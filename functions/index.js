import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

// Import route handlers
import adminHandler from "./handlers/admin.js";
import dispatchHandler from "./handlers/dispatch.js";
import healthHandler from "./handlers/health.js";
import redeemRewardHandler from "./handlers/redeem-reward.js";
import subscribeHandler from "./handlers/subscribe.js";
import loyaltyHandler from "./handlers/loyalty.js";

// Patron & Collector Deduplication & Reconciliation
import patronReconcileHandler from "./handlers/patron/reconcile.js";
import patronBatchDeduplicateHandler from "./handlers/patron/batch-deduplicate.js";
import patronDeleteAccountHandler from "./handlers/patron/delete-account.js";
import patronBootstrapHandler from "./handlers/patron/bootstrap.js";
import patronSettleOrderHandler from "./handlers/patron/settle-order.js";
import patronSettleBalanceHandler from "./handlers/patron/settle-balance.js";

// Razorpay handlers
import razorpayCreateOrderHandler from "./handlers/razorpay/create-order.js";
import razorpayVerifyPaymentHandler from "./handlers/razorpay/verify-payment.js";
import razorpayWebhookHandler from "./handlers/razorpay/webhook.js";

// Permanent server-side secret sanitization & catalog synchronization
import { adminDb } from "./handlers/_firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";
import { SERVER_CATALOG } from "./catalog.js";

let _settingsSanitized = false;
async function purgeLegacySecretsFromFirestore() {
  if (_settingsSanitized) return;
  try {
    const globalDocRef = adminDb.collection("settings").doc("global");
    const snap = await globalDocRef.get();
    if (snap.exists) {
      const data = snap.data() || {};
      if (data.razorpayKeySecret !== undefined) {
        await globalDocRef.update({
          razorpayKeySecret: FieldValue.delete()
        });
        console.log("[Security Startup] Permanently wiped legacy razorpayKeySecret from settings/global");
      }
    }
    _settingsSanitized = true;
  } catch (err) {
    console.warn("[Security Startup] Firestore secret sanitization notice:", err.message);
  }
}
purgeLegacySecretsFromFirestore().catch(() => {});

/* ------------------------------------------------------------------------
   One-time promo migration: FIRST20 / WELCOME20 -> FIRST25.

   The catalog reads settings/global.promoCodes BEFORE its built-in table, so
   editing code alone would have left the old 20% codes in force. This rewrites
   the Firestore copy once, and stamps promoCodesMigratedAt so it never repeats.
   ------------------------------------------------------------------------ */
let _promoMigrated = false;
async function migratePromoCodesToFirst25() {
  if (_promoMigrated || !adminDb) return;
  try {
    const ref = adminDb.collection('settings').doc('global');
    const snap = await ref.get();
    if (!snap.exists) {
      _promoMigrated = true;
      return;
    }

    const settings = snap.data() || {};
    if (settings.promoCodesMigratedAt) {
      _promoMigrated = true;
      return;
    }

    const existing = Array.isArray(settings.promoCodes) ? settings.promoCodes : [];
    const retired = ['FIRST20', 'WELCOME20', 'FIRST25'];
    const kept = existing.filter((p) => {
      const code = String(p?.code || '').trim().toUpperCase();
      return p && !retired.includes(code);
    });

    kept.unshift({
      code: 'FIRST25',
      discountType: 'percent',
      value: 25,
      maxDiscount: 5000,
      minOrder: 0,
      active: true,
      firstOrderOnly: true,
      excludeProductIds: ['mytholis-discovery-set']
    });

    await ref.set({
      promoCodes: kept,
      promoCodesMigratedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[Promo Migration] FIRST20/WELCOME20 retired, FIRST25 installed (${kept.length} codes).`);
    _promoMigrated = true;
  } catch (err) {
    console.warn('[Promo Migration] Notice:', err.message);
  }
}
migratePromoCodesToFirst25().catch(() => {});

let _catalogSynced = false;
async function syncAuthoritativeCatalogToFirestore() {
  if (_catalogSynced || !adminDb) return;
  try {
    for (const prod of SERVER_CATALOG) {
      const prodRef = adminDb.collection("products").doc(prod.id);
      const snap = await prodRef.get();
      // Only seed a product document if it does not exist in Firestore yet.
      // Never overwrite existing Firestore prices, variants, or admin edits.
      if (!snap.exists) {
        await prodRef.set({
          ...prod,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        console.log(`[Catalog Seed] Seeded missing product document ${prod.id} into Firestore`);
      }
    }
    _catalogSynced = true;
  } catch (err) {
    console.warn("[Catalog Sync] Notice during catalog seed check:", err.message);
  }
}
syncAuthoritativeCatalogToFirestore().catch(() => {});

const app = express();

// Permissive CORS for cross-origin or local requests
app.use(cors({ origin: true, credentials: true }));

// Body parsers preserving rawBody for HMAC & cryptographic signature verification
app.use(express.json({
  verify: (req, _res, buf) => {
    if (!req.rawBody) {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  verify: (req, _res, buf) => {
    if (!req.rawBody) {
      req.rawBody = buf;
    }
  }
}));

// Route parameter backward compatibility (mapping req.params into req.query)
app.use((req, _res, next) => {
  if (req.params && req.query) {
    Object.assign(req.query, req.params);
  }
  next();
});

// Define unified router
const router = express.Router();

// Sovereign Core APIs
router.all("/admin", adminHandler);
router.all("/dispatch", dispatchHandler);
router.all("/health", healthHandler);
router.all("/redeem-reward", redeemRewardHandler);
router.all("/subscribe", subscribeHandler);
router.all("/loyalty/tiers", loyaltyHandler);
router.all("/loyalty/claim", loyaltyHandler);

// Patron Account Deduplication & Reconciliation
router.all("/patron/reconcile", patronReconcileHandler);
router.all("/collector/reconcile", patronReconcileHandler);
router.all("/patron/batch-deduplicate", patronBatchDeduplicateHandler);
router.all("/collector/batch-deduplicate", patronBatchDeduplicateHandler);
router.all("/patron/delete-account", patronDeleteAccountHandler);
router.all("/collector/delete-account", patronDeleteAccountHandler);

// Server-owned collector document + reward settlement
router.all("/patron/bootstrap", patronBootstrapHandler);
router.all("/patron/settle-order", patronSettleOrderHandler);
router.all("/patron/settle-balance", patronSettleBalanceHandler);
router.all("/patron/collect-balance", patronSettleBalanceHandler);

// Razorpay Payment Gateway APIs (support both /create-order and /razorpay/create-order)
router.all("/create-order", razorpayCreateOrderHandler);
router.all("/verify-payment", razorpayVerifyPaymentHandler);
router.all("/razorpay/create-order", razorpayCreateOrderHandler);
router.all("/razorpay/verify-payment", razorpayVerifyPaymentHandler);

// Razorpay webhook: the authoritative settlement path (server-to-server).
router.all("/razorpay/webhook", razorpayWebhookHandler);
router.all("/webhook/razorpay", razorpayWebhookHandler);

// Mount router on both '/api' and '/' to support Firebase Hosting rewrite and direct invocation
app.use("/api", router);
app.use("/", router);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl || req.url });
});

// Export Express App & 2nd Gen Cloud Function
export { app };
export const api = onRequest({
  region: "us-central1",
  cors: true,
  maxInstances: 10,
  memory: "512MiB",
  timeoutSeconds: 60
}, app);
