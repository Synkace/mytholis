import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../_firebaseAdmin.js';
import { authenticate, isAdminToken } from '../../lib/auth.js';

/**
 * Server-side collector account bootstrap.
 *
 * The client used to create its own `users/{uid}` document, including the
 * loyalty ledger and its welcome bonus. Firestore rules no longer allow a
 * client to write `loyalty`, `role` or `isAdmin`, so the document is created
 * here instead, with the Admin SDK, using server-owned values only.
 *
 * POST /api/patron/bootstrap  (Bearer required)
 * -> { success, user }
 */

const DEFAULT_WELCOME_BONUS = 200;

function emptyLoyalty(bonus = DEFAULT_WELCOME_BONUS) {
  return {
    spendable_mythos: bonus,
    legacy_mythos: bonus,
    full_bottles_purchased: 0,
    initiation_completed: false,
    codex_unlocked: [],
    trinity_claimed: false,
    pantheon_claimed: false,
    reviewed_scents: [],
    active_reward_codes: [],
    applied_reward_code: null,
    signup_bonus_awarded: true,
    signup_bonus_popup_seen: false
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await authenticate(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const decoded = auth.decoded;
  const uid = decoded.uid;

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const snap = await userRef.get();

    if (snap.exists) {
      const data = snap.data() || {};
      // Repair an account that predates server-side loyalty.
      if (!data.loyalty || typeof data.loyalty !== 'object') {
        await userRef.set({ loyalty: emptyLoyalty() }, { merge: true });
        const fresh = await userRef.get();
        return res.status(200).json({ success: true, created: false, repaired: true, user: fresh.data() });
      }
      return res.status(200).json({ success: true, created: false, user: data });
    }

    // First login: create the document server-side.
    let bonus = DEFAULT_WELCOME_BONUS;
    try {
      const settingsSnap = await adminDb.collection('settings').doc('global').get();
      if (settingsSnap.exists) {
        const s = settingsSnap.data() || {};
        const configured = Number(s.signupBonusMythos);
        if (Number.isFinite(configured) && configured >= 0) bonus = configured;
      }
    } catch (_) {}

    const isAdmin = isAdminToken(decoded);

    const newUser = {
      profile: {
        name: decoded.name || '',
        email: decoded.email_verified === true ? decoded.email : '',
        phone: decoded.phone_number || '',
        photoURL: decoded.picture || '',
        createdAt: new Date().toISOString()
      },
      loyalty: emptyLoyalty(bonus),
      isMergedDuplicate: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    // role/isAdmin here are display mirrors only; authorization reads the claim.
    if (isAdmin) {
      newUser.role = 'admin';
      newUser.isAdmin = true;
    }

    await userRef.set(newUser, { merge: true });
    const created = await userRef.get();

    console.log(`[Bootstrap] Created collector document for ${uid} with welcome bonus ${bonus}`);
    return res.status(200).json({ success: true, created: true, user: created.data() });
  } catch (err) {
    console.error('[Bootstrap] error:', err);
    return res.status(500).json({ error: 'Could not initialise collector account.' });
  }
}
