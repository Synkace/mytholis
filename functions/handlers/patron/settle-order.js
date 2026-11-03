import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../_firebaseAdmin.js';
import { requireAdmin } from '../../lib/auth.js';

/**
 * Server-authoritative order reward settlement.
 *
 * Replaces the client-side `settleCodOrderLoyalty`, which computed and wrote
 * loyalty balances in the browser. Runs in a transaction so an order can only
 * ever be credited once.
 *
 * POST /api/patron/settle-order  (admin Bearer required)
 * body: { orderId }
 */

const EARN_PCT = 0.03;
const BOTTLE_BONUS = { 50: 300, 100: 500 };

function calculateRewards(order) {
  const total = Number(order.verifiedTotal ?? order.finalPayable ?? order.total ?? 0) || 0;
  const items = Array.isArray(order.items) ? order.items : [];

  const spendEarned = Math.round(total * EARN_PCT);
  let bottleCount = 0;
  let bottleBonus = 0;

  for (const item of items) {
    const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    const size = Number(item.size);
    if (BOTTLE_BONUS[size]) {
      bottleCount += qty;
      bottleBonus += BOTTLE_BONUS[size] * qty;
    }
  }

  return { spendEarned, bottleBonus, bottleCount, legacyEarned: spendEarned + bottleBonus };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const orderId = String(req.body?.orderId || '').trim();
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderSnap = await tx.get(orderRef);

      if (!orderSnap.exists) {
        return { ok: false, status: 404, error: 'Order not found' };
      }

      const order = orderSnap.data() || {};

      if (order.rewardsCredited === true) {
        return { ok: true, alreadySettled: true, orderId };
      }

      const uid = order.userId || order.uid;
      if (!uid || String(uid).startsWith('guest')) {
        return { ok: false, status: 400, error: 'Order has no collector attached' };
      }

      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        return { ok: false, status: 404, error: 'Collector account does not exist' };
      }

      const userData = userSnap.data() || {};
      const loyalty = userData.loyalty || {};
      const rewards = calculateRewards(order);

      tx.set(userRef, {
        loyalty: {
          ...loyalty,
          spendable_mythos: (Number(loyalty.spendable_mythos) || 0) + rewards.spendEarned,
          legacy_mythos: (Number(loyalty.legacy_mythos) || 0) + rewards.legacyEarned,
          full_bottles_purchased: (Number(loyalty.full_bottles_purchased) || 0) + rewards.bottleCount
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(orderRef, {
        rewardsCredited: true,
        rewardsCreditedAt: FieldValue.serverTimestamp(),
        rewardsGranted: {
          spendEarned: rewards.spendEarned,
          legacyEarned: rewards.legacyEarned,
          bottleCount: rewards.bottleCount
        }
      }, { merge: true });

      return { ok: true, orderId, rewards };
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Settle Order] error:', err);
    return res.status(500).json({ error: 'Settlement failed' });
  }
}
