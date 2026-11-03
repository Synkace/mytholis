import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../_firebaseAdmin.js';
import { requireAdmin } from '../../lib/auth.js';

/**
 * Manual settlement of the balance on a Partial COD order.
 *
 * There is no courier integration yet, so delivery is confirmed by staff in the
 * dashboard rather than by a logistics webhook. This endpoint does what the
 * webhook would have done: collect the balance, mark the order paid, and credit
 * the collector's rewards exactly once.
 *
 * POST /api/patron/settle-balance   (admin Bearer)
 * body: { orderId }
 */

const EARN_PCT = 0.03;
const BOTTLE_BONUS = { 50: 300, 100: 500 };

function calculateRewards(order) {
  const total = Number(order.verifiedTotal ?? order.total ?? 0) || 0;
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

  return { spendEarned, legacyEarned: spendEarned + bottleBonus, bottleCount };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const orderId = String(req.body?.orderId || '').trim();
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderSnap = await tx.get(orderRef);

      if (!orderSnap.exists) return { status: 404, error: 'Order not found' };

      const order = orderSnap.data() || {};
      const balanceDue = Number(order.balanceDue) || 0;

      if (order.rewardsCredited === true) {
        return { status: 200, alreadySettled: true, orderId };
      }
      if (order.isPartialCod !== true && !balanceDue) {
        return { status: 400, error: 'This order has no deferred balance to collect.' };
      }

      const uid = order.userId || order.uid || null;
      const rewards = calculateRewards(order);
      const userRef = uid && !String(uid).startsWith('guest')
        ? adminDb.collection('users').doc(uid)
        : null;
      const userSnap = userRef ? await tx.get(userRef) : null;

      tx.set(orderRef, {
        paymentStatus: 'PAID',
        status: 'Delivered',
        balanceCollected: balanceDue,
        balanceCollectedAt: new Date().toISOString(),
        balanceDue: 0,
        rewardsCredited: true,
        rewardsCreditedAt: FieldValue.serverTimestamp(),
        rewardsGranted: rewards,
        settledBy: 'admin-manual'
      }, { merge: true });

      if (userRef && userSnap && userSnap.exists) {
        const loyalty = userSnap.data()?.loyalty || {};
        const spendable = (Number(loyalty.spendable_mythos) || 0) + rewards.spendEarned;

        tx.set(userRef, {
          loyalty: {
            ...loyalty,
            spendable_mythos: spendable,
            legacy_mythos: (Number(loyalty.legacy_mythos) || 0) + rewards.legacyEarned,
            full_bottles_purchased: (Number(loyalty.full_bottles_purchased) || 0) + rewards.bottleCount
          },
          points: spendable,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      return { status: 200, orderId, balanceCollected: balanceDue, rewards };
    });

    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.error || 'Could not settle the balance.' });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Settle Balance] error:', err);
    return res.status(500).json({ error: 'Settlement failed' });
  }
}
