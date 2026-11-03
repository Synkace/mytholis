import { randomBytes } from 'node:crypto';
import { adminDb } from './_firebaseAdmin.js';
import { authenticate } from '../lib/auth.js';

/**
 * Server-authoritative Mythos redemption.
 *
 * Everything that determines value lives here:
 *  - the reward catalogue (cost, amount, minimum tier, minimum order),
 *  - the collector's real balance, read inside a transaction,
 *  - the debit,
 *  - the voucher code.
 *
 * The client may only say WHICH reward it wants. See AGENTS.md §3.
 */

// Dual-key tiers, same thresholds as store.js / admin.js.
const TIERS = [
  { level: 1, minLegacy: 0, minBottles: 0 },
  { level: 2, minLegacy: 500, minBottles: 1 },
  { level: 3, minLegacy: 2500, minBottles: 3 },
  { level: 4, minLegacy: 8000, minBottles: 6 },
  { level: 5, minLegacy: 20000, minBottles: 12 }
];

const SERVER_REWARDS = {
  DISC_200:   { cost: 200,  amount: 200,  type: 'discount', minLevel: 1, minOrder: 1500, title: '₹200 Off Voucher' },
  DISC_400:   { cost: 400,  amount: 400,  type: 'discount', minLevel: 1, minOrder: 1500, title: '₹400 Off Voucher' },
  FREE_8ML:   { cost: 500,  amount: 0,    type: 'gift',     minLevel: 2, minOrder: 0,    title: 'Free 8ml Deluxe Travel Spray', giftItem: '8ml Deluxe Travel Atomizer' },
  DISC_800:   { cost: 800,  amount: 800,  type: 'discount', minLevel: 3, minOrder: 0,    title: '₹800 Off Voucher' },
  FREE_15ML:  { cost: 1100, amount: 0,    type: 'gift',     minLevel: 3, minOrder: 0,    title: 'Exclusive 15ml Vault Flacon', giftItem: '15ml Vault Flacon Miniature' },
  DISC_2500:  { cost: 2500, amount: 2500, type: 'discount', minLevel: 4, minOrder: 0,    title: '₹2,500 Off Voucher' },
  FREE_50ML:  { cost: 3500, amount: 0,    type: 'gift',     minLevel: 5, minOrder: 0,    title: 'Free 50ml Extrait Bottle', giftItem: 'Full 50ml Signature Extrait' },
  FREE_100ML: { cost: 5000, amount: 0,    type: 'gift',     minLevel: 5, minOrder: 0,    title: 'Free 100ml Extrait Bottle', giftItem: 'Full 100ml Masterpiece Extrait' }
};

function tierLevel(legacyMythos, fullBottles) {
  const legacy = Number(legacyMythos) || 0;
  const bottles = Number(fullBottles) || 0;
  let level = 1;
  for (const tier of TIERS) {
    if (legacy >= tier.minLegacy && bottles >= tier.minBottles) level = tier.level;
  }
  return level;
}

function mintCode(rewardId) {
  // 16 hex chars = 4 billion combinations, and never collides in practice.
  const suffix = randomBytes(8).toString('hex').toUpperCase();
  return `MYTH-${rewardId}-${suffix}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await authenticate(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }
  const uid = auth.decoded.uid;

  const rewardId = String(req.body?.rewardId || '').trim().toUpperCase();
  const reward = SERVER_REWARDS[rewardId];
  if (!rewardId || !reward) {
    return res.status(400).json({ error: 'Invalid or unsupported rewardId' });
  }

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await tx.get(userRef);

      if (!userSnap.exists) {
        return { status: 404, error: 'Collector account not found.' };
      }

      const userData = userSnap.data() || {};
      const loyalty = userData.loyalty || {};
      const spendable = Number(loyalty.spendable_mythos) || 0;
      const legacy = Number(loyalty.legacy_mythos) || 0;
      const bottles = Number(loyalty.full_bottles_purchased) || 0;
      const level = tierLevel(legacy, bottles);

      if (level < reward.minLevel) {
        return { status: 403, error: `Requires Level ${reward.minLevel}. You are Level ${level}.` };
      }
      if (spendable < reward.cost) {
        return {
          status: 400,
          error: `Insufficient Spendable Mythos. You need ${(reward.cost - spendable).toLocaleString()} more M.`
        };
      }

      const now = new Date().toISOString();
      const code = mintCode(rewardId);

      const voucher = {
        code,
        id: rewardId,
        title: reward.title,
        type: reward.type,
        amount: reward.amount,
        giftItem: reward.giftItem || '',
        minOrder: reward.minOrder || 0,
        used: false,
        usedOnOrderId: null,
        mintedAt: now,
        createdAt: now
      };

      const codes = Array.isArray(loyalty.active_reward_codes) ? loyalty.active_reward_codes : [];

      tx.set(userRef, {
        loyalty: {
          ...loyalty,
          spendable_mythos: spendable - reward.cost,
          active_reward_codes: [voucher, ...codes]
        },
        updatedAt: now
      }, { merge: true });

      return {
        status: 200,
        remainingMythos: spendable - reward.cost,
        code,
        reward: voucher
      };
    });

    if (result.status !== 200) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    // Also record the issuance so it is auditable outside the user document.
    await adminDb.collection('voucher_issuances').add({
      uid,
      code: result.code,
      rewardId,
      cost: reward.cost,
      amount: reward.amount,
      issuedAt: new Date().toISOString()
    }).catch(() => {});

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Mythos Redeem] error:', err);
    return res.status(500).json({ success: false, error: 'Redemption failed. Please try again.' });
  }
}
