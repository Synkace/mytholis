import { adminAuth, adminDb } from './_firebaseAdmin.js';
import { requireAdmin } from '../lib/auth.js';

// Dual-Key Tier Level Hierarchy matching store.js
const LOYALTY_TIERS = [
  { level: 1, name: "The Initiate", minLegacy: 0, minBottles: 0 },
  { level: 2, name: "The Curator", minLegacy: 500, minBottles: 1 },
  { level: 3, name: "The Collector", minLegacy: 2500, minBottles: 3 },
  { level: 4, name: "The Archivist", minLegacy: 8000, minBottles: 6 },
  { level: 5, name: "The Sovereign", minLegacy: 20000, minBottles: 12 }
];

function calculateTier(legacyMythos, fullBottles) {
  const legacy = Number(legacyMythos) || 0;
  const bottles = Number(fullBottles) || 0;
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    const tier = LOYALTY_TIERS[i];
    if (legacy >= tier.minLegacy && bottles >= tier.minBottles) {
      return `Level ${tier.level}: ${tier.name}`;
    }
  }
  return "Level 1: The Initiate";
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authoritative admin authorization (custom claim, or verified ADMIN_EMAIL).
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }
  const decodedToken = auth.decoded;
  const tokenEmail = (decodedToken.email || '').trim().toLowerCase();

  const { action, payload = {} } = req.body || {};

  try {
    switch (action) {
      case 'GET_DASHBOARD_DATA': {
        // Fetch recent orders
        let orders = [];
        try {
          const ordersSnap = await adminDb.collection('orders').limit(100).get();
          orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by timestamp or date desc in memory
          orders.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (new Date(a.date || a.createdAt || 0).getTime());
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (new Date(b.date || b.createdAt || 0).getTime());
            return timeB - timeA;
          });
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching orders:", e.message);
        }

        // Fetch users
        let users = [];
        try {
          const usersSnap = await adminDb.collection('users').limit(500).get();
          users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching users:", e.message);
        }

        // Fetch products
        let products = [];
        try {
          const prodSnap = await adminDb.collection('products').limit(100).get();
          products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching products:", e.message);
        }

        // Fetch posts
        let posts = [];
        try {
          const postsSnap = await adminDb.collection('posts').limit(100).get();
          posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching posts:", e.message);
        }

        // Fetch global settings
        let settings = {};
        try {
          const setSnap = await adminDb.doc('settings/global').get();
          if (setSnap.exists) {
            settings = setSnap.data() || {};
          }
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching settings:", e.message);
        }

        // Fetch inventory overrides
        let inventory = {};
        try {
          const invSnap = await adminDb.doc('settings/inventory').get();
          if (invSnap.exists) {
            inventory = invSnap.data() || {};
          }
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching inventory:", e.message);
        }

        // Fetch VIP reward codes
        let codes = [];
        try {
          const codesSnap = await adminDb.collection('reward_codes').limit(200).get();
          codes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("[Mytholis Admin API] Error fetching reward codes:", e.message);
        }

        return res.status(200).json({
          success: true,
          adminUser: tokenEmail,
          data: {
            orders,
            users,
            products,
            posts,
            settings,
            inventory,
            codes
          }
        });
      }

      case 'UPDATE_ORDER_STATUS': {
        const { orderId, status, courier, awb_number } = payload;
        if (!orderId) {
          return res.status(400).json({ error: 'Missing orderId' });
        }

        const updateData = {
          updated_at: new Date().toISOString()
        };
        if (status) updateData.status = status;
        if (courier !== undefined) updateData.courier = courier;
        if (awb_number !== undefined) updateData.awb_number = awb_number;

        await adminDb.collection('orders').doc(orderId).set(updateData, { merge: true });

        return res.status(200).json({
          success: true,
          message: `Order ${orderId} status updated successfully`,
          updated: updateData
        });
      }

      case 'ADJUST_USER_MYTHOS': {
        const { targetUid, spendableDelta = 0, legacyDelta = 0, addBottleCount = 0, unlockScent = '' } = payload;
        if (!targetUid) {
          return res.status(400).json({ error: 'Missing targetUid' });
        }

        const userDocRef = adminDb.collection('users').doc(targetUid);
        const userSnap = await userDocRef.get();
        const userData = userSnap.exists ? userSnap.data() : { profile: {}, loyalty: {} };
        const loyalty = Object.assign({}, userData.loyalty || {});

        loyalty.spendable_mythos = Math.max(0, (loyalty.spendable_mythos || 0) + Number(spendableDelta || 0));
        loyalty.legacy_mythos = Math.max(0, (loyalty.legacy_mythos || 0) + Number(legacyDelta || 0));
        loyalty.full_bottles_purchased = Math.max(0, (loyalty.full_bottles_purchased || 0) + Number(addBottleCount || 0));

        if (unlockScent && typeof unlockScent === 'string') {
          const codex = Array.isArray(loyalty.codex_unlocked) ? [...loyalty.codex_unlocked] : [];
          if (!codex.includes(unlockScent)) {
            codex.push(unlockScent);
          }
          loyalty.codex_unlocked = codex;
        }

        // Auto-recalculate Dual-Key Tier (Levels 1 to 5)
        const recalculatedTier = calculateTier(loyalty.legacy_mythos, loyalty.full_bottles_purchased);
        const profile = Object.assign({}, userData.profile || {}, {
          tier: recalculatedTier,
          points: loyalty.spendable_mythos
        });

        await userDocRef.set({
          loyalty,
          profile,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        return res.status(200).json({
          success: true,
          message: `Loyalty ledger for ${targetUid} updated to ${recalculatedTier}`,
          loyalty,
          tier: recalculatedTier
        });
      }

      case 'TOGGLE_INVENTORY': {
        const { skuKey, status } = payload;
        if (!skuKey || !status) {
          return res.status(400).json({ error: 'Missing skuKey or status (in_stock, sold_out, early_access)' });
        }

        await adminDb.doc('settings/inventory').set({
          [skuKey]: status,
          updated_at: new Date().toISOString()
        }, { merge: true });

        return res.status(200).json({
          success: true,
          message: `Inventory SKU ${skuKey} set to ${status}`
        });
      }

      case 'CREATE_VIP_CODE': {
        const { code, title, type = 'discount', amount = 500, minOrder = 1500, maxUses = 1, targetEmail = null, note = '' } = payload;
        if (!code) {
          return res.status(400).json({ error: 'Missing promo code name' });
        }

        const normalizedCode = String(code).trim().toUpperCase();
        const codeDoc = {
          code: normalizedCode,
          title: title || 'VIP Sanctum Concession',
          type,
          amount: Number(amount) || 0,
          minOrder: Number(minOrder) || 0,
          used: false,
          maxUses: Number(maxUses) || 1,
          usesCount: 0,
          targetEmail: targetEmail ? String(targetEmail).trim().toLowerCase() : null,
          note: note || '',
          createdAt: new Date().toISOString()
        };

        await adminDb.collection('reward_codes').doc(normalizedCode).set(codeDoc);

        return res.status(200).json({
          success: true,
          message: `Code ${normalizedCode} minted into Vault ledger`,
          rewardCode: codeDoc
        });
      }

      /* ------------------------------------------------------------------
         Grant or revoke the admin claim. This is the ONLY supported way to
         create another administrator. Never grant admin from a client-writable
         document field.
         ------------------------------------------------------------------ */
      case 'SET_ADMIN_CLAIM': {
        const { targetUid, email, enabled = true } = payload;
        let uid = targetUid || null;

        if (!uid && email) {
          try {
            const userRecord = await adminAuth.getUserByEmail(String(email).trim().toLowerCase());
            uid = userRecord.uid;
          } catch (_) {
            return res.status(404).json({ error: 'No account exists for that email address.' });
          }
        }
        if (!uid) {
          return res.status(400).json({ error: 'Missing targetUid or email' });
        }

        // Never let an operator lock themselves out.
        if (uid === decodedToken.uid && enabled === false) {
          return res.status(400).json({ error: 'You cannot revoke your own admin claim.' });
        }

        const userRecord = await adminAuth.getUser(uid);
        const existing = userRecord.customClaims || {};
        const nextClaims = { ...existing };
        if (enabled === true) {
          nextClaims.admin = true;
        } else {
          delete nextClaims.admin;
        }

        await adminAuth.setCustomUserClaims(uid, nextClaims);
        console.log(`[Mytholis Admin API] admin claim for ${uid} set to ${enabled === true}`);

        // Mirror onto the profile document for display only - never for auth.
        await adminDb.collection('users').doc(uid).set({
          role: enabled === true ? 'admin' : 'collector',
          isAdmin: enabled === true,
          adminClaimUpdatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        return res.status(200).json({
          success: true,
          uid,
          admin: enabled === true,
          message: enabled === true
            ? 'Admin claim granted. The user must sign in again for it to take effect.'
            : 'Admin claim revoked.'
        });
      }

      /* ------------------------------------------------------------------
         Abandoned checkout recovery desk (caller executive).
         ------------------------------------------------------------------ */
      case 'MARK_CHECKOUT_RECOVERY': {
        const { orderId, status, note = '' } = payload;
        if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

        const allowed = ['CONTACTED', 'RECOVERED', 'LOST', 'NOT_CONTACTED'];
        const next = String(status || '').toUpperCase();
        if (!allowed.includes(next)) return res.status(400).json({ error: 'Invalid recovery status' });

        await adminDb.collection('orders').doc(orderId).set({
          recoveryStatus: next,
          recoveryNote: String(note || '').slice(0, 500),
          recoveryUpdatedAt: new Date().toISOString(),
          recoveryBy: tokenEmail || decodedToken.uid
        }, { merge: true });

        return res.status(200).json({ success: true, orderId, recoveryStatus: next });
      }

      case 'PURGE_ABANDONED_DRAFTS': {
        const olderThanDays = Number(payload.olderThanDays) || 30;
        const cutoffMs = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
        const dryRun = payload.dryRun === true;

        const snap = await adminDb.collection('orders').limit(1000).get();
        const victims = [];

        snap.docs.forEach((d) => {
          const o = d.data() || {};
          const status = String(o.status || '').toUpperCase();
          const isDraft = o.isDraft === true || ['CREATED', 'AWAITING_PAYMENT'].includes(status);
          const paid = /paid|captured/i.test(String(o.paymentStatus || '')) || Boolean(o.paidAt);
          if (!isDraft || paid) return;

          const raw = o.checkoutStartedAt || o.createdAt || o.timestamp;
          const ms = raw?.toMillis ? raw.toMillis() : new Date(raw || 0).getTime();
          if (Number.isFinite(ms) && ms > 0 && ms < cutoffMs) victims.push(d.ref);
        });

        if (dryRun) {
          return res.status(200).json({ success: true, dryRun: true, wouldDelete: victims.length, olderThanDays });
        }

        let deleted = 0;
        for (let i = 0; i < victims.length; i += 400) {
          const batch = adminDb.batch();
          victims.slice(i, i + 400).forEach((ref) => batch.delete(ref));
          await batch.commit();
          deleted += Math.min(400, victims.length - i);
        }

        console.log(`[Admin] Purged ${deleted} abandoned checkout draft(s) older than ${olderThanDays} days`);
        return res.status(200).json({ success: true, deleted, olderThanDays });
      }

      default:        return res.status(400).json({ error: `Unsupported admin action: ${action}` });
    }
  } catch (actionErr) {
    console.error(`[Mytholis Admin API] Error executing ${action}:`, actionErr);
    return res.status(500).json({ error: 'Internal Sanctum Server Error', details: actionErr.message });
  }
}
