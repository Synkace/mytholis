import { adminDb } from './_firebaseAdmin.js';
import { authenticate } from '../lib/auth.js';
import { TIERS, tierFor, writeLedgerEntry } from '../lib/loyalty.js';

/**
 * Loyalty surface.
 *
 * GET  /api/loyalty/tiers   - public. The client hydrates its tier table from
 *                             here, so `functions/lib/loyalty.js` is the only
 *                             copy of the thresholds and multipliers.
 *
 * POST /api/loyalty/claim   - authenticated. Server-verified point awards for
 *                             the two actions the browser used to fake:
 *                             finishing initiation and reviewing a scent.
 */

const CORE_SCENTS = ['king-scar', 'petralux', 'oud-rion', 'spark', 'wood-sera', 'ash'];

const REVIEW_POINTS = { text: 50, media: 100 };
const INITIATION_POINTS = { spendable: 150, legacy: 100 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = String(req.path || req.originalUrl || '').toLowerCase();

  // ---- public: tier table ----
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      tiers: TIERS.map((t) => ({
        level: t.level,
        name: t.name,
        minLegacy: t.minLegacy,
        minBottles: t.minBottles,
        multiplier: t.multiplier,
        cashbackPct: Math.round(3 * t.multiplier)
      }))
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const auth = await authenticate(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const uid = auth.decoded.uid;

  const action = String(req.body?.action || '').trim();
  const scentId = String(req.body?.scentId || '').trim();
  const hasMedia = req.body?.hasMedia === true;

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const userRef = adminDb.collection('users').doc(uid);
      const snap = await tx.get(userRef);
      if (!snap.exists) return { status: 404, error: 'Collector account not found.' };

      const data = snap.data() || {};
      const loyalty = { ...(data.loyalty || {}) };
      const legacy = Number(loyalty.legacy_mythos) || 0;
      const bottles = Number(loyalty.full_bottles_purchased) || 0;
      const tier = tierFor(legacy, bottles, loyalty.manual_tier_override);

      let spend = 0;
      let leg = 0;
      let reason = '';

      if (action === 'initiation') {
        if (loyalty.initiation_completed === true) {
          return { status: 200, alreadyClaimed: true, loyalty };
        }
        spend = INITIATION_POINTS.spendable;
        leg = INITIATION_POINTS.legacy;
        reason = 'Initiation bounty';
        loyalty.initiation_completed = true;
      } else if (action === 'review') {
        if (!CORE_SCENTS.includes(scentId)) {
          return { status: 400, error: 'Unknown scent.' };
        }
        if (tier.level < 2) {
          return { status: 403, error: 'Dossier reviews unlock at Level 2: The Curator.' };
        }
        const reviewed = Array.isArray(loyalty.reviewed_scents) ? [...loyalty.reviewed_scents] : [];
        if (reviewed.includes(scentId)) {
          return { status: 200, alreadyClaimed: true, loyalty };
        }
        spend = hasMedia ? REVIEW_POINTS.media : REVIEW_POINTS.text;
        reason = `Scent review: ${scentId}`;
        loyalty.reviewed_scents = [...reviewed, scentId];
      } else {
        return { status: 400, error: 'Unsupported claim action.' };
      }

      const currentSpendable = Number(loyalty.spendable_mythos) || 0;
      const nextSpendable = currentSpendable + spend;
      loyalty.spendable_mythos = nextSpendable;
      loyalty.legacy_mythos = legacy + leg;

      writeLedgerEntry(tx, {
        uid,
        type: 'earn',
        spendableDelta: spend,
        legacyDelta: leg,
        balanceAfter: nextSpendable,
        reason,
        actor: 'collector'
      });

      tx.set(userRef, { loyalty, points: nextSpendable, updatedAt: new Date().toISOString() }, { merge: true });

      return { status: 200, awarded: { spendable: spend, legacy: leg }, loyalty };
    });

    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[Loyalty] claim error:', err.message);
    return res.status(500).json({ error: 'Could not record this claim.' });
  }
}
