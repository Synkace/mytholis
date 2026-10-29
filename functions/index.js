import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

// Import route handlers
import adminHandler from "./handlers/admin.js";
import completeOrderHandler from "./handlers/complete-order.js";
import dispatchHandler from "./handlers/dispatch.js";
import healthHandler from "./handlers/health.js";
import redeemRewardHandler from "./handlers/redeem-reward.js";

// PayU handlers
import payuInitiateHandler from "./handlers/payu/initiate.js";
import payuResponseHandler from "./handlers/payu/response.js";

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
router.all("/dispatch-event", dispatchHandler);
router.all("/webhook", dispatchHandler);
router.all("/health", healthHandler);
router.all("/redeem-reward", redeemRewardHandler);

// PayU Hosted Gateway APIs
router.all("/payu/initiate", payuInitiateHandler);
router.all("/payu/response", payuResponseHandler);

// Mount router on both '/api' and '/' to support Firebase Hosting rewrite and direct invocation
app.use("/api", router);
app.use("/", router);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl || req.url });
});

// Export 2nd Gen Cloud Function
export const api = onRequest({
  region: "us-central1",
  cors: true,
  maxInstances: 10,
  memory: "512MiB",
  timeoutSeconds: 60
}, app);
