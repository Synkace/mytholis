import crypto from 'node:crypto';
import { adminDb } from '../_firebaseAdmin.js';
import { settlePaidOrder } from '../../lib/settle.js';

/**
 * Razorpay webhook - the authoritative settlement path.
 *
 * Why this exists: `/api/verify-payment` only runs if the buyer's browser is
 * still open after paying. Close the tab, and money was captured while the
 * order stayed PENDING forever. The webhook is server-to-server and cannot be
 * skipped by the client.
 *
 * Security (AGENTS.md §2, fail-closed):
 *  - the webhook secret must be configured, or every request is rejected
 *  - the X-Razorpay-Signature HMAC is computed over the RAW body
 *  - comparison is timing-safe
 *  - a missing signature is a rejection, never a warning
 */

function readRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf-8');
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body), 'utf-8');
  return Buffer.alloc(0);
}

function parseEvent(req, raw) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && Object.keys(req.body).length) {
    return req.body;
  }
  try {
    return JSON.parse(raw.toString('utf-8'));
  } catch (_) {
    return null;
  }
}

function signatureMatches(raw, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected, 'utf-8');
  const b = Buffer.from(String(signature), 'utf-8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}

async function recordEvent(event, outcome) {
  try {
    const id = String(event?.id || `${event?.event || 'unknown'}_${Date.now()}`);
    await adminDb.collection('webhook_events').doc(id).set({
      provider: 'razorpay',
      event: event?.event || null,
      receivedAt: new Date().toISOString(),
      outcome
    }, { merge: true });
  } catch (err) {
    console.warn('[Razorpay Webhook] Could not record event:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    console.error('[Razorpay Webhook] Rejected: RAZORPAY_WEBHOOK_SECRET is not configured.');
    return res.status(401).json({ error: 'Webhook secret not configured' });
  }

  const raw = readRawBody(req);
  const headerSig = req.headers['x-razorpay-signature'];
  const signature = Array.isArray(headerSig) ? headerSig[0] : headerSig;

  if (!signature) {
    // Fail closed. No signature means no trust.
    console.warn('[Razorpay Webhook] Rejected: missing X-Razorpay-Signature header.');
    return res.status(401).json({ error: 'Missing signature' });
  }

  if (!signatureMatches(raw, signature, secret)) {
    console.warn('[Razorpay Webhook] Rejected: signature mismatch.');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = parseEvent(req, raw);
  if (!event || !event.event) {
    return res.status(400).json({ error: 'Malformed event payload' });
  }

  const type = String(event.event);
  const payload = event.payload || {};

  try {
    switch (type) {
      /* --------------------------------------------------------------
         Money actually captured. This is the one that matters.
         `order.paid` fires once all attempts on an order are paid, so it is
         handled identically - settlePaidOrder is idempotent either way.
         -------------------------------------------------------------- */
      case 'payment.captured':
      case 'order.paid': {
        const payment = payload.payment?.entity || null;
        const orderEntity = payload.order?.entity || null;

        const orderId = payment?.order_id || orderEntity?.id || null;
        const paymentId = payment?.id || null;
        // `order.paid` carries no payment entity; fall back to the order's
        // amount_paid (paise) so the amount check still runs.
        const amountPaise = payment?.amount ?? orderEntity?.amount_paid ?? orderEntity?.amount ?? null;

        if (!orderId) {
          await recordEvent(event, { handled: false, reason: 'no order_id' });
          return res.status(200).json({ status: 'ignored', reason: 'no order id' });
        }

        const result = await settlePaidOrder({
          orderId,
          paymentId,
          source: 'webhook',
          paidAmountPaise: amountPaise
        });

        await recordEvent(event, { handled: result.ok, idempotent: !!result.idempotent, error: result.error || null });

        if (!result.ok) {
          // A 5xx makes Razorpay retry, which is what we want for transient
          // errors. Amount mismatches will not resolve on retry, so ack them.
          const retryable = result.status >= 500;
          console.error(`[Razorpay Webhook] Settlement failed for ${orderId}: ${result.error}`);
          return res.status(retryable ? 500 : 200).json({
            status: retryable ? 'error' : 'acknowledged',
            error: result.error
          });
        }

        console.log(`[Razorpay Webhook] Settled ${orderId} (${type}) idempotent=${!!result.idempotent}`);
        return res.status(200).json({ status: 'ok', orderId, idempotent: !!result.idempotent });
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity || {};
        await recordEvent(event, { handled: true, type: 'payment.failed' });
        console.log(`[Razorpay Webhook] payment.failed for order ${payment.order_id || 'unknown'}: ${payment.error_description || ''}`);
        return res.status(200).json({ status: 'ok' });
      }

      case 'refund.processed':
      case 'refund.created': {
        const refund = payload.refund?.entity || {};
        const paymentId = refund.payment_id || null;

        if (paymentId) {
          const q = await adminDb.collection('orders')
            .where('razorpayPaymentId', '==', paymentId)
            .limit(1)
            .get()
            .catch(() => null);

          if (q && !q.empty) {
            const orderRef = q.docs[0].ref;
            await orderRef.set({
              paymentStatus: type === 'refund.processed' ? 'REFUNDED' : 'REFUND_PENDING',
              refundId: refund.id || null,
              refundedAt: type === 'refund.processed' ? new Date().toISOString() : null,
              refundAmount: refund.amount ? Number(refund.amount) / 100 : null
            }, { merge: true });
          }
        }

        await recordEvent(event, { handled: true, type });
        return res.status(200).json({ status: 'ok' });
      }

      default:
        await recordEvent(event, { handled: false, reason: 'unhandled event type' });
        return res.status(200).json({ status: 'ignored', event: type });
    }
  } catch (err) {
    console.error('[Razorpay Webhook] handler error:', err);
    // 500 so Razorpay retries.
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
