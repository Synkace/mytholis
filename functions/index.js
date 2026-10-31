import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

// Import route handlers
import adminHandler from "./handlers/admin.js";
import completeOrderHandler from "./handlers/complete-order.js";
import dispatchHandler from "./handlers/dispatch.js";
import healthHandler from "./handlers/health.js";
import redeemRewardHandler from "./handlers/redeem-reward.js";

// Patron & Collector Deduplication & Reconciliation
import patronReconcileHandler from "./handlers/patron/reconcile.js";
import patronBatchDeduplicateHandler from "./handlers/patron/batch-deduplicate.js";
import patronDeleteAccountHandler from "./handlers/patron/delete-account.js";

// Razorpay handlers
import razorpayCreateOrderHandler from "./handlers/razorpay/create-order.js";
import razorpayVerifyPaymentHandler from "./handlers/razorpay/verify-payment.js";

// Permanent server-side secret sanitization
import { adminDb } from "./handlers/_firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

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
router.all("/complete-order", completeOrderHandler);
router.all("/dispatch", dispatchHandler);
router.all("/health", healthHandler);
router.all("/redeem-reward", redeemRewardHandler);

// Patron Account Deduplication & Reconciliation
router.all("/patron/reconcile", patronReconcileHandler);
router.all("/collector/reconcile", patronReconcileHandler);
router.all("/patron/batch-deduplicate", patronBatchDeduplicateHandler);
router.all("/collector/batch-deduplicate", patronBatchDeduplicateHandler);
router.all("/patron/delete-account", patronDeleteAccountHandler);
router.all("/collector/delete-account", patronDeleteAccountHandler);

// Razorpay Payment Gateway APIs (support both /create-order and /razorpay/create-order)
router.all("/create-order", razorpayCreateOrderHandler);
router.all("/verify-payment", razorpayVerifyPaymentHandler);
router.all("/razorpay/create-order", razorpayCreateOrderHandler);
router.all("/razorpay/verify-payment", razorpayVerifyPaymentHandler);

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
