import crypto from 'node:crypto';
import { settlePaidOrder } from '../../lib/settle.js';

/**
 * Browser-side payment callback.
 *
 * This endpoint is a UX optimisation, NOT the source of truth. It proves the
 * signature Razorpay Checkout handed to the browser, then hands off to
 * settlePaidOrder (the same function the webhook uses).
 *
 * The webhook remains authoritative: if the buyer closes the tab, this never
 * runs and Razorpay still settles the order.
 *
 * Differences from the previous version:
 *  - a missing order draft is an error, not a silent 200 success
 *  - a database failure is an error, not a swallowed console.warn
 *  - it no longer computes or credits loyalty itself
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST payment verification payload.' });
  }

  try {
    const orderId = req.body?.razorpay_order_id || req.body?.order_id;
    const paymentId = req.body?.razorpay_payment_id || req.body?.payment_id;
    const signature = req.body?.razorpay_signature || req.body?.signature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: order_id, payment_id, and signature are required.'
      });
    }

    // Secret comes only from the server environment (AGENTS.md §1).
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keySecret) {
      console.error('[Razorpay Verify] Key secret not found in environment.');
      return res.status(500).json({
        success: false,
        error: 'Cryptographic verification unavailable: server secret unconfigured.'
      });
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) - fail closed.
    let isSignatureValid = false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
      const providedBuf = Buffer.from(String(signature), 'utf-8');

      isSignatureValid = expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch (cryptoErr) {
      console.error('[Razorpay Verify] Signature comparison error:', cryptoErr.message);
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(`[Razorpay Security Alert] Invalid signature for order ${orderId}.`);
      return res.status(400).json({
        success: false,
        error: 'Signature verification failed. Invalid signature.'
      });
    }

    const settlement = await settlePaidOrder({
      orderId,
      paymentId,
      source: 'verify-payment'
    });

    if (!settlement.ok) {
      console.error(`[Razorpay Verify] Settlement refused for ${orderId}: ${settlement.error}`);
      return res.status(settlement.status || 500).json({
        success: false,
        error: settlement.error || 'Payment could not be settled.'
      });
    }

    return res.status(200).json({
      success: true,
      message: settlement.idempotent
        ? 'Payment already settled.'
        : 'Payment verified and settled.',
      order_id: orderId,
      orderId,
      payment_id: paymentId,
      paymentId,
      total: settlement.total ?? null,
      idempotent: !!settlement.idempotent
    });
  } catch (err) {
    console.error('[Razorpay Verify Exception]:', err);
    return res.status(500).json({ success: false, error: 'Internal verification error.' });
  }
}
