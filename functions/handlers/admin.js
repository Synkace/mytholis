import { adminAuth, adminDb } from './_firebaseAdmin.js';

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

  // 1. Read Bearer token
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const idToken = authHeader.replace('Bearer ', '').trim();

  // 2. Verify token & verify ADMIN_EMAIL
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (authErr) {
    console.error("[Mytholis Admin API] Token verification failed:", authErr.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  const tokenEmail = (decodedToken.email || '').trim().toLowerCase();

  const allowedAdmins = [
    'gunhegarr@gmail.com',
    'admin@mytholis.com',
    'alexander@mytholis.com',
    'founder@mytholis.com'
  ];
  if (configuredAdminEmail) {
    configuredAdminEmail.split(',').forEach(e => {
      const trimmed = e.trim().toLowerCase();
      if (trimmed && !allowedAdmins.includes(trimmed)) allowedAdmins.push(trimmed);
    });
  }

  // Also check dynamic admin emails from Firestore settings/global
  if (adminDb) {
    try {
      const settingsSnap = await adminDb.collection('settings').doc('global').get();
      if (settingsSnap.exists) {
        const s = settingsSnap.data() || {};
        if (Array.isArray(s.adminEmails)) {
          s.adminEmails.forEach(e => {
            const trimmed = String(e).trim().toLowerCase();
            if (trimmed && !allowedAdmins.includes(trimmed)) allowedAdmins.push(trimmed);
          });
        }
      }
    } catch (e) {
      console.warn('[Mytholis Admin API] Could not load dynamic admin emails:', e.message);
    }
  }

  const isAuthorized = 
    decodedToken.admin === true ||
    allowedAdmins.some(a => a.toLowerCase() === tokenEmail);

  if (!isAuthorized) {
    console.warn(`[Mytholis Admin API] Forbidden attempt by ${tokenEmail || decodedToken.uid}.`);
    return res.status(403).json({ error: 'Forbidden: Access restricted to verified Founder only' });
  }

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

      default:
        return res.status(400).json({ error: `Unsupported admin action: ${action}` });
    }
  } catch (actionErr) {
    console.error(`[Mytholis Admin API] Error executing ${action}:`, actionErr);
    return res.status(500).json({ error: 'Internal Sanctum Server Error', details: actionErr.message });
  }
}
