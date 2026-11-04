import { adminDb } from '../handlers/_firebaseAdmin.js';

/**
 * Circle of Legends — single source of truth for tiers, earning rates and the
 * points ledger.
 *
 * Before this existed the tiers lived in three places (client, admin, and
 * nowhere on the payment path), so the advertised 2x–5x multipliers were never
 * applied. Every credit now resolves the tier here.
 */

export const TIERS = [
  { level: 1, name: 'The Observer', minLegacy: 0, minBottles: 0, multiplier: 1 },
  { level: 2, name: 'The Curator', minLegacy: 500, minBottles: 1, multiplier: 2 },
  { level: 3, name: 'The Collector', minLegacy: 2500, minBottles: 3, multiplier: 3 },
  { level: 4, name: 'The Archivist', minLegacy: 8000, minBottles: 6, multiplier: 4 },
  { level: 5, name: 'The Sovereign', minLegacy: 20000, minBottles: 12, multiplier: 5 }
];

const BASE_EARN_RATE = 0.03;

/** Resolve the collector's tier from the server-side ledger. */
export function tierFor(legacyMythos, fullBottles, overrideLevel = null) {
  const legacy = Number(legacyMythos) || 0;
  const bottles = Number(fullBottles) || 0;

  const override = Number(overrideLevel);
  if (Number.isInteger(override) && override >= 1 && override <= 5) {
    return TIERS.find((t) => t.level === override) || TIERS[0];
  }

  let current = TIERS[0];
  for (const tier of TIERS) {
    if (legacy >= tier.minLegacy && bottles >= tier.minBottles) current = tier;
  }
  return current;
}

/** Earning rate for this collector, including the tier multiplier. */
export function earnRate(legacyMythos, fullBottles, overrideLevel = null) {
  return BASE_EARN_RATE * tierFor(legacyMythos, fullBottles, overrideLevel).multiplier;
}

export function tierLabel(legacyMythos, fullBottles, overrideLevel = null) {
  const t = tierFor(legacyMythos, fullBottles, overrideLevel);
  return `Level ${t.level}: ${t.name}`;
}

/**
 * Append a points movement to the ledger.
 * Must be called with a Firestore transaction so the balance and its
 * explanation are written atomically.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {object} entry
 */
export function writeLedgerEntry(tx, entry) {
  const ref = adminDb.collection('loyalty_ledger').doc();
  tx.set(ref, {
    uid: entry.uid,
    type: entry.type,                 // 'earn' | 'redeem' | 'referral' | 'adjust' | 'bottle-bonus'
    spendableDelta: Number(entry.spendableDelta) || 0,
    legacyDelta: Number(entry.legacyDelta) || 0,
    balanceAfter: Number(entry.balanceAfter) || 0,
    reason: String(entry.reason || '').slice(0, 200),
    orderId: entry.orderId || null,
    actor: entry.actor || 'system',
    createdAt: new Date().toISOString()
  });
  return ref;
}
