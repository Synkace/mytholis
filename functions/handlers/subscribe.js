import crypto from 'node:crypto';
import { adminDb } from './_firebaseAdmin.js';

/**
 * Gazette / Concierge newsletter signup.
 *
 * Public endpoint (no auth) - a visitor can subscribe before they have an
 * account. Writes only to `subscribers`, keyed by a hash of the email so the
 * same address can never appear twice.
 *
 * POST /api/subscribe  { email, source? }
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Very small in-process throttle. Cloud Functions reuse instances, so this
// catches the obvious repeat-submit case without a datastore round trip.
const recentByIp = new Map();

function throttled(ip) {
  const now = Date.now();
  const last = recentByIp.get(ip) || 0;
  if (now - last < 3000) return true;
  recentByIp.set(ip, now);
  if (recentByIp.size > 500) recentByIp.clear();
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const raw = String(req.body?.email || '').trim().toLowerCase();
  const source = String(req.body?.source || 'footer-gazette').slice(0, 60);

  if (!raw) return res.status(400).json({ error: 'An email address is required.' });
  if (raw.length > 254 || !EMAIL_RE.test(raw)) {
    return res.status(400).json({ error: 'That email address does not look right.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  if (throttled(ip)) {
    return res.status(429).json({ error: 'One moment - please try again in a few seconds.' });
  }

  try {
    const id = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
    const ref = adminDb.collection('subscribers').doc(id);
    const snap = await ref.get();

    if (snap.exists) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already on the list. The next dispatch will reach you.'
      });
    }

    await ref.set({
      email: raw,
      source,
      subscribedAt: new Date().toISOString(),
      confirmed: false,
      unsubscribed: false
    });

    console.log(`[Gazette] New subscriber (${source})`);
    return res.status(200).json({
      success: true,
      alreadySubscribed: false,
      message: 'Welcome to the Gazette. Private invitations will find you.'
    });
  } catch (err) {
    console.error('[Gazette] subscribe error:', err.message);
    return res.status(500).json({ error: 'Could not record your address. Please try again.' });
  }
}
