# Mytholis Project Engineering & Security Rules

All automated coding agents and contributors MUST adhere strictly to the following security protocols across all future changes:

## 1. Zero Hardcoded Credentials
- **NEVER** commit API keys, webhook secrets, private keys, database passwords, or auth tokens in source files or git history.
- Always retrieve secrets from runtime environment variables (`process.env.VARIABLE_NAME`).
- If an environment secret is not configured, the endpoint must **fail closed** (reject or throw a configuration error), never fall back to hardcoded dummy or production credentials in code.

## 2. Fail-Closed Cryptographic Verification
- For all payment gateway callbacks (PayU, Razorpay) and webhooks (Fastrr, Shiprocket):
  - Signature and HMAC validation must default to `isHashValid = false`.
  - Check that both the shared secret AND the incoming signature header exist before calculation.
  - If the signature is missing or does not match, immediately reject with `401 Unauthorized`.
  - **NEVER** implement "permissive mode" or log warnings while proceeding to mutate order/payment state.

## 3. Server-Authoritative Financial & Loyalty Logic
- **Prices and Discounts**: Never trust prices, product costs, or discount values supplied by client requests. Always recalculate totals server-side against the official catalog.
- **Voucher & Reward Generation**: Voucher values, minimum order amounts, and loyalty costs must be looked up in a server-side table (e.g. `SERVER_REWARDS` in `api/redeem-reward.js`), not accepted from client parameters.
- **Loyalty Deductions & Credits**: Points and tiers may only be credited after a cryptographically verified server-to-server payment confirmation.

## 4. Firestore Security Rules & Access Control
- Maintain strict least-privilege access in `firestore.rules`.
- Disallow client writes to administrative keys (`role`, `isAdmin`) on user documents.
- Restrict `/orders` reads so patrons can only read their own documents (`resource.data.userId == request.auth.uid`). Updates and deletes are restricted to `isAdmin()`.
- Global configuration (`/settings`, `/reward_codes`) must be writable strictly by `isAdmin()`.

## 5. Mobile & Android Packaging Hygiene
- Keep `"allowMixedContent": false` in `capacitor.config.json` to prevent unencrypted HTTP traffic inside the Android WebView.
- Do not add artificial notch / status-bar padding in general CSS. Use standard CSS `env(safe-area-inset-*)` so browsers and emulators do not inherit artificial empty voids.
