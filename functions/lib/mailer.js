import { adminDb } from '../handlers/_firebaseAdmin.js';

/**
 * Transactional email.
 *
 * Provider: Resend (https://resend.com) - a single HTTPS call, no SDK.
 * Configure:
 *   RESEND_API_KEY  - server secret
 *   MAIL_FROM       - e.g. "Mytholis <orders@mytholis.com>" (domain must be verified)
 *   MAIL_REPLY_TO   - optional, defaults to concierge@mytholis.com
 *
 * Fail-open by design: if email is not configured or the provider errors, the
 * order still succeeds. The failure is logged and never surfaces to the buyer.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isConfigured() {
  return Boolean((process.env.RESEND_API_KEY || '').trim() && (process.env.MAIL_FROM || '').trim());
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function orderEmailHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1d3a2f;color:#e8e4da;font-size:14px;">
        ${escapeHtml(item.name || item.id)} <span style="color:#9aa39d;">(${escapeHtml(item.size || 50)}ml × ${escapeHtml(item.quantity || 1)})</span>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #1d3a2f;color:#f0dfa0;font-size:14px;">
        ${money(Number(item.price || item.unitPrice || 0) * Number(item.quantity || item.qty || 1))}
      </td>
    </tr>`).join('');

  const isCod = /cod|cash on delivery/i.test(String(order.paymentMethod || ''));

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#020c08;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:Helvetica,Arial,sans-serif;">
    <div style="text-align:center;padding-bottom:24px;">
      <div style="font-family:Georgia,serif;font-size:26px;letter-spacing:6px;color:#f0dfa0;">MYTHOLIS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#9aa39d;margin-top:6px;">HAUTE PARFUMERIE</div>
    </div>

    <div style="background:#06150f;border:1px solid #1d3a2f;border-radius:12px;padding:26px;">
      <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;color:#f0dfa0;font-weight:normal;">
        Your order is confirmed
      </h1>
      <p style="margin:0 0 20px;color:#9aa39d;font-size:13px;">
        Order <strong style="color:#e8e4da;">#${escapeHtml(order.orderId || order.id || '')}</strong>
        ${isCod ? '— Cash on Delivery' : '— Payment received'}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr>
          <td style="color:#9aa39d;font-size:13px;padding-top:6px;">Total</td>
          <td align="right" style="color:#f0dfa0;font-size:17px;padding-top:6px;">${money(order.verifiedTotal || order.total || 0)}</td>
        </tr>
      </table>

      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #1d3a2f;">
        <div style="color:#9aa39d;font-size:11px;letter-spacing:2px;margin-bottom:8px;">SHIPPING TO</div>
        <div style="color:#e8e4da;font-size:13px;line-height:1.6;">
          ${escapeHtml(order.customerName || order.customer?.name || 'Collector')}<br>
          ${escapeHtml(order.customerAddress || '')}<br>
          ${escapeHtml([order.customer?.city, order.customer?.state, order.customer?.pincode].filter(Boolean).join(', '))}
        </div>
      </div>
    </div>

    <p style="color:#9aa39d;font-size:12px;line-height:1.7;margin-top:22px;">
      We dispatch within 24–48 hours and send tracking as soon as it is generated.
      Delivery is 2–7 business days depending on your pin code.
    </p>
    <p style="color:#9aa39d;font-size:12px;line-height:1.7;">
      Questions? WhatsApp <strong style="color:#e8e4da;">+91 77700 09170</strong>
      or reply to this email.
    </p>
    <p style="color:#4a5a52;font-size:11px;margin-top:26px;">
      Mytholis Luxury Fragrances Pvt. Ltd. · GSTIN 27NJXPS7705H1Z2<br>
      <a href="https://mytholis.com/refund" style="color:#6b7a72;">Refund policy</a> ·
      <a href="https://mytholis.com/shipping" style="color:#6b7a72;">Shipping policy</a>
    </p>
  </div>
</body></html>`;
}

async function postToResend(payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(process.env.RESEND_API_KEY || '').trim()}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
  }
  return text;
}

/**
 * Send the order confirmation once. Idempotent on `confirmationEmailSentAt`.
 * @param {string} orderId Firestore document id of the order.
 */
export async function sendOrderConfirmation(orderId) {
  if (!orderId) return { skipped: true, reason: 'no-order-id' };
  if (!isConfigured()) {
    console.warn('[Mailer] RESEND_API_KEY / MAIL_FROM not configured - confirmation email skipped.');
    return { skipped: true, reason: 'not-configured' };
  }

  try {
    const ref = adminDb.collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return { skipped: true, reason: 'order-not-found' };

    const order = snap.data() || {};
    if (order.confirmationEmailSentAt) return { skipped: true, reason: 'already-sent' };

    const to = String(order.userEmail || order.customer?.email || '').trim();
    if (!to || !to.includes('@')) return { skipped: true, reason: 'no-email' };

    await postToResend({
      from: (process.env.MAIL_FROM || '').trim(),
      to: [to],
      reply_to: (process.env.MAIL_REPLY_TO || 'concierge@mytholis.com').trim(),
      subject: `Mytholis order #${order.orderId || orderId} confirmed`,
      html: orderEmailHtml(order)
    });

    await ref.set({
      confirmationEmailSentAt: new Date().toISOString(),
      confirmationEmailTo: to
    }, { merge: true });

    console.log(`[Mailer] Confirmation sent for ${orderId} to ${to}`);
    return { sent: true, to };
  } catch (err) {
    console.error('[Mailer] Confirmation failed:', err.message);
    await adminDb.collection('mail_failures').add({
      orderId,
      error: String(err.message || err).slice(0, 400),
      at: new Date().toISOString()
    }).catch(() => {});
    return { skipped: true, reason: 'send-failed' };
  }
}
