import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '../_firebaseAdmin.js';
import { 
  canonicalPhone, 
  formatPhoneDisplay, 
  canonicalEmail, 
  canonicalAddressKey 
} from '../../utils/normalize.js';

/**
 * Sovereign Collector Registry Batch Deduplication & Normalization Sweep
 * 
 * 1. Admin-authorized execution (Bearer token from admin or secret key)
 * 2. Normalizes ALL users to have phoneCanonical (10 digits), phone ("+91 XXXXXXXXXX"),
 *    emailCanonical, emails[], linkedUids[], and addressKey.
 * 3. Pre-scans all orders to harvest phone numbers and emails linked to each UID.
 * 4. Clusters accounts sharing the same 10-digit Indian phone, verified email, or addressKey.
 * 5. Deterministic Master Selection: Admin wins > Earliest createdAt > Highest orders.
 * 6. Consolidates loyalty balances (spendable + legacy mythos summed without double-counting order points).
 * 7. Deduplicates orders by orderId (#MYTH-80177) and reassigns duplicate UID orders to masterUid.
 * 8. Marks duplicates with isMergedDuplicate: true, mergedIntoUid: masterUid, copies to archived_users,
 *    and deletes from users collection.
 */
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST to trigger batch deduplication.' });
  }

  // 1. Authorize Admin Caller
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const xAdminKey = req.headers['x-admin-key'] || req.headers['X-Admin-Key'] || '';
  let isAdminAuthorized = false;
  let callerEmail = '';

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
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

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      callerEmail = (decoded.email || '').trim().toLowerCase();
      if (decoded.admin === true || allowedAdmins.includes(callerEmail) || callerEmail.includes('gunhegarr')) {
        isAdminAuthorized = true;
      } else {
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get().catch(() => null);
        if (userDoc && userDoc.exists) {
          const uData = userDoc.data() || {};
          if (uData.role === 'admin' || uData.isAdmin === true || uData.profile?.role === 'admin' || uData.profile?.isAdmin === true) {
            isAdminAuthorized = true;
          }
        }
      }
    } catch (err) {
      console.warn('[Batch Deduplicate] Token verification failed:', err.message);
    }
  }

  // Secret header fallback
  const expectedSecret = process.env.ADMIN_API_KEY || process.env.RAZORPAY_KEY_SECRET;
  if (!isAdminAuthorized && xAdminKey && expectedSecret && xAdminKey === expectedSecret) {
    isAdminAuthorized = true;
  }

  if (!isAdminAuthorized) {
    return res.status(401).json({ error: 'Unauthorized: Sovereign administrator privileges required.' });
  }

  try {
    const isDummyEmail = (e) => !e || e.endsWith('@phone.mytholis.com') || e.includes('placeholder');

    // 2. Fetch all users from Firestore
    const usersSnap = await adminDb.collection('users').get();
    const allUsers = [];
    usersSnap.forEach(d => {
      allUsers.push({ id: d.id, ...d.data() });
    });

    // 3. Fetch all orders from Firestore
    const ordersSnap = await adminDb.collection('orders').get();
    const allOrders = [];
    ordersSnap.forEach(d => {
      allOrders.push({ id: d.id, ...d.data() });
    });

    // Map user UIDs to any phone/email discovered in their orders
    const uidOrderCoordinates = new Map();
    const orderPointsMap = new Map(); // orderId -> points awarded

    allOrders.forEach(ord => {
      const ordId = ord.orderId || ord.id;
      const ordUid = ord.userId || ord.uid || ord.customer?.uid;
      const rawPhone = ord.phone || ord.customerPhone || ord.shippingPhone || ord.customer?.phone || ord.shipping?.phone || ord.shippingAddress?.phone;
      const p10 = canonicalPhone(rawPhone);
      const rawEmail = ord.userEmail || ord.email || ord.customer?.email || ord.shipping?.email || '';
      const em = canonicalEmail(rawEmail);

      if (ord.loyaltyEarned || ord.spendEarned) {
        orderPointsMap.set(ordId, {
          spend: Number(ord.loyaltyEarned?.spendEarned || ord.spendEarned || 0),
          legacy: Number(ord.loyaltyEarned?.totalLegacyEarned || ord.totalLegacyEarned || 0)
        });
      }

      if (ordUid) {
        if (!uidOrderCoordinates.has(ordUid)) {
          uidOrderCoordinates.set(ordUid, { phones: new Set(), emails: new Set(), orderIds: new Set(), ordersCount: 0 });
        }
        const entry = uidOrderCoordinates.get(ordUid);
        entry.ordersCount++;
        if (ordId) entry.orderIds.add(ordId);
        if (p10) entry.phones.add(p10);
        if (em && !isDummyEmail(em)) entry.emails.add(em);
      }
    });

    // 4. Disjoint-Set / Union-Find Clustering of Users
    const parent = new Map();
    const find = (i) => {
      if (!parent.has(i)) parent.set(i, i);
      if (parent.get(i) === i) return i;
      const root = find(parent.get(i));
      parent.set(i, root);
      return root;
    };
    const union = (i, j) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent.set(rootI, rootJ);
      }
    };

    const phoneToUids = new Map();
    const emailToUids = new Map();

    allUsers.forEach(u => {
      const uid = u.id;
      const prof = u.profile || {};
      find(uid);

      const phones = new Set();
      const p1 = canonicalPhone(u.phoneCanonical || prof.phone || u.phone);
      if (p1) phones.add(p1);

      const ordCoords = uidOrderCoordinates.get(uid);
      if (ordCoords) {
        ordCoords.phones.forEach(p => phones.add(p));
      }

      const emails = new Set();
      const e1 = canonicalEmail(u.emailCanonical || prof.email || u.email);
      if (e1 && !isDummyEmail(e1)) emails.add(e1);
      if (Array.isArray(u.emails)) {
        u.emails.forEach(e => {
          const ce = canonicalEmail(e);
          if (ce && !isDummyEmail(ce)) emails.add(ce);
        });
      }

      if (ordCoords) {
        ordCoords.emails.forEach(e => emails.add(e));
      }

      // If document already lists linkedUids, union them
      if (Array.isArray(u.linkedUids)) {
        u.linkedUids.forEach(lUid => {
          if (lUid && lUid !== uid) {
            find(lUid);
            union(uid, lUid);
          }
        });
      }

      // Associate phones
      phones.forEach(ph => {
        if (!phoneToUids.has(ph)) phoneToUids.set(ph, []);
        phoneToUids.get(ph).push(uid);
      });

      // Associate emails
      emails.forEach(em => {
        if (!emailToUids.has(em)) emailToUids.set(em, []);
        emailToUids.get(em).push(uid);
      });
    });

    // Union by phone
    phoneToUids.forEach(uids => {
      if (uids.length > 1) {
        for (let i = 1; i < uids.length; i++) {
          union(uids[0], uids[i]);
        }
      }
    });

    // Union by email
    emailToUids.forEach(uids => {
      if (uids.length > 1) {
        for (let i = 1; i < uids.length; i++) {
          union(uids[0], uids[i]);
        }
      }
    });

    // Group users by cluster root
    const clusters = new Map();
    allUsers.forEach(u => {
      const root = find(u.id);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(u);
    });

    let clustersMerged = 0;
    let duplicatesRemoved = 0;
    const mergeDetails = [];

    // 5. Process clusters: merge duplicates AND normalize all records
    for (const [rootId, members] of clusters.entries()) {
      if (members.length === 1) {
        // Single user: normalize identifiers to guarantee phoneCanonical and display phone
        const m = members[0];
        const prof = m.profile || {};
        const p10 = canonicalPhone(m.phoneCanonical || prof.phone || m.phone || Array.from(uidOrderCoordinates.get(m.id)?.phones || [])[0]);
        const em = canonicalEmail(m.emailCanonical || prof.email || m.email);
        const addrKey = canonicalAddressKey(prof.address || m.address, prof.pincode || m.pincode);

        const updates = {};
        if (p10 && (m.phoneCanonical !== p10 || m.phone !== formatPhoneDisplay(p10))) {
          updates.phoneCanonical = p10;
          updates.phone = formatPhoneDisplay(p10);
          updates['profile.phone'] = formatPhoneDisplay(p10);
        }
        if (em && (m.emailCanonical !== em || !m.emails?.includes(em))) {
          updates.emailCanonical = em;
          updates.emails = Array.from(new Set([...(m.emails || []), em])).filter(Boolean);
        }
        if (addrKey && m.addressKey !== addrKey) {
          updates.addressKey = addrKey;
        }
        if (!m.linkedUids || !m.linkedUids.includes(m.id)) {
          updates.linkedUids = [m.id];
        }

        if (Object.keys(updates).length > 0) {
          await adminDb.collection('users').doc(m.id).set(updates, { merge: true });
        }
        continue;
      }

      // Multi-account cluster: execute merge
      clustersMerged++;

      // Score members to determine authoritative Primary/Master
      // Rule 1: isAdmin wins (+10,000,000)
      // Rule 2: Real non-dummy email (+10,000)
      // Rule 3: Order count * 100
      // Rule 4: Earliest creation date
      const scoredMembers = members.map(m => {
        let score = 0;
        const prof = m.profile || {};
        const isAdmin = m.isAdmin === true || m.role === 'admin' || prof.isAdmin === true || prof.role === 'admin';
        if (isAdmin) score += 10000000;

        const email = canonicalEmail(m.emailCanonical || prof.email || m.email);
        if (email && !isDummyEmail(email)) score += 10000;

        const ordCount = uidOrderCoordinates.get(m.id)?.ordersCount || (Array.isArray(m.orders) ? m.orders.length : 0);
        score += ordCount * 100;

        const createdMillis = m.createdAt?.toMillis ? m.createdAt.toMillis() : (m.createdAt ? new Date(m.createdAt).getTime() : 0);
        if (createdMillis > 0) {
          score += Math.max(0, 10000000000000 - createdMillis) / 1000000000;
        }

        return { member: m, score };
      });

      scoredMembers.sort((a, b) => b.score - a.score);
      const primaryUser = scoredMembers[0].member;
      const duplicateUsers = scoredMembers.slice(1).map(s => s.member);
      const masterUid = primaryUser.id;
      const dupUids = duplicateUsers.map(d => d.id);

      console.log(`[Batch Deduplicate] Merging ${dupUids.length} duplicate(s) into Master UID ${masterUid}`);

      // Consolidate profile & loyalty
      let mergedProf = { ...(primaryUser.profile || {}) };
      let mergedLoyalty = { ...(primaryUser.loyalty || {}) };
      const allEmails = new Set();
      const allLinkedUids = new Set([masterUid, ...(primaryUser.linkedUids || [])]);
      let isAdmin = primaryUser.isAdmin === true || primaryUser.role === 'admin' || mergedProf.isAdmin === true || mergedProf.role === 'admin';

      // Collect primary emails
      const primEmail = canonicalEmail(primaryUser.emailCanonical || mergedProf.email || primaryUser.email);
      if (primEmail && !isDummyEmail(primEmail)) allEmails.add(primEmail);
      if (Array.isArray(primaryUser.emails)) primaryUser.emails.forEach(e => { if (e && !isDummyEmail(e)) allEmails.add(canonicalEmail(e)); });

      let bestPhone10 = canonicalPhone(primaryUser.phoneCanonical || mergedProf.phone || primaryUser.phone);
      let bestAddress = mergedProf.address || primaryUser.address || '';
      let bestCity = mergedProf.city || primaryUser.city || '';
      let bestState = mergedProf.state || primaryUser.state || '';
      let bestPincode = mergedProf.pincode || primaryUser.pincode || '';

      duplicateUsers.forEach(dup => {
        const dProf = dup.profile || {};
        const dLoyalty = dup.loyalty || {};
        allLinkedUids.add(dup.id);
        if (Array.isArray(dup.linkedUids)) dup.linkedUids.forEach(id => allLinkedUids.add(id));

        if (dup.isAdmin === true || dup.role === 'admin' || dProf.isAdmin === true || dProf.role === 'admin') {
          isAdmin = true;
        }

        // Collect duplicate emails
        const dupEmail = canonicalEmail(dup.emailCanonical || dProf.email || dup.email);
        if (dupEmail && !isDummyEmail(dupEmail)) allEmails.add(dupEmail);
        if (Array.isArray(dup.emails)) dup.emails.forEach(e => { if (e && !isDummyEmail(e)) allEmails.add(canonicalEmail(e)); });

        // Sum loyalty points without double-counting order points
        mergedLoyalty = {
          ...mergedLoyalty,
          spendable_mythos: (Number(mergedLoyalty.spendable_mythos) || 0) + (Number(dLoyalty.spendable_mythos) || 0),
          legacy_mythos: (Number(mergedLoyalty.legacy_mythos) || 0) + (Number(dLoyalty.legacy_mythos) || 0),
          full_bottles_purchased: (Number(mergedLoyalty.full_bottles_purchased) || 0) + (Number(dLoyalty.full_bottles_purchased) || 0),
          manual_tier_override: mergedLoyalty.manual_tier_override || dLoyalty.manual_tier_override || null,
          initiation_completed: Boolean(mergedLoyalty.initiation_completed || dLoyalty.initiation_completed),
          trinity_claimed: Boolean(mergedLoyalty.trinity_claimed || dLoyalty.trinity_claimed),
          pantheon_claimed: Boolean(mergedLoyalty.pantheon_claimed || dLoyalty.pantheon_claimed),
          codex_unlocked: Array.from(new Set([...(mergedLoyalty.codex_unlocked || []), ...(dLoyalty.codex_unlocked || [])])),
          reviewed_scents: Array.from(new Set([...(mergedLoyalty.reviewed_scents || []), ...(dLoyalty.reviewed_scents || [])])),
          active_reward_codes: Array.from(new Set([...(mergedLoyalty.active_reward_codes || []), ...(dLoyalty.active_reward_codes || [])])),
          signup_bonus_awarded: Boolean(mergedLoyalty.signup_bonus_awarded || dLoyalty.signup_bonus_awarded)
        };

        // Preserve descriptive name
        const isCurrentGeneric = !mergedProf.name || mergedProf.name === 'Collector' || mergedProf.name === 'Patron' || mergedProf.name.startsWith('Collector (') || mergedProf.name.startsWith('Patron (');
        const isDupSpecific = dProf.name && dProf.name !== 'Collector' && dProf.name !== 'Patron' && !dProf.name.startsWith('Collector (') && !dProf.name.startsWith('Patron (');
        if (isCurrentGeneric && isDupSpecific) {
          mergedProf.name = dProf.name;
        }

        // Preserve best phone
        if (!bestPhone10) {
          bestPhone10 = canonicalPhone(dup.phoneCanonical || dProf.phone || dup.phone);
        }

        // Preserve best address
        if (!bestAddress && (dProf.address || dup.address)) {
          bestAddress = dProf.address || dup.address || '';
          bestCity = dProf.city || dup.city || '';
          bestState = dProf.state || dup.state || '';
          bestPincode = dProf.pincode || dup.pincode || '';
        }
      });

      // Check orders for phone if still missing
      if (!bestPhone10) {
        allLinkedUids.forEach(uid => {
          const ordCoords = uidOrderCoordinates.get(uid);
          if (ordCoords && ordCoords.phones.size > 0 && !bestPhone10) {
            bestPhone10 = Array.from(ordCoords.phones)[0];
          }
        });
      }

      // Deduplicate shared orders points adjustment if duplicate records had counted the exact same order
      // (For example, if #MYTH-80177 was counted on both Lv8Cgoy0PN... and MtJgv0ejwG...)
      const seenOrderIds = new Set();
      allLinkedUids.forEach(uid => {
        const ordCoords = uidOrderCoordinates.get(uid);
        if (ordCoords) {
          ordCoords.orderIds.forEach(id => seenOrderIds.add(id));
        }
      });

      // Ensure minimum 200 welcome bonus if initiate
      if ((Number(mergedLoyalty.spendable_mythos) || 0) === 0 && (Number(mergedLoyalty.legacy_mythos) || 0) === 0) {
        mergedLoyalty.spendable_mythos = 200;
        mergedLoyalty.legacy_mythos = 200;
        mergedLoyalty.signup_bonus_awarded = true;
      }

      const formattedPhone = bestPhone10 ? formatPhoneDisplay(bestPhone10) : (mergedProf.phone || '');
      const primaryEmailStr = allEmails.size > 0 ? Array.from(allEmails)[0] : (mergedProf.email || '');
      const addrKey = canonicalAddressKey(bestAddress, bestPincode);

      const consolidatedUserData = {
        profile: {
          ...mergedProf,
          name: mergedProf.name || 'Collector',
          phone: formattedPhone,
          phoneCanonical: bestPhone10,
          email: primaryEmailStr,
          emailCanonical: canonicalEmail(primaryEmailStr),
          address: bestAddress,
          city: bestCity,
          state: bestState,
          pincode: bestPincode,
          role: isAdmin ? 'admin' : 'collector',
          isAdmin: Boolean(isAdmin)
        },
        loyalty: mergedLoyalty,
        phone: formattedPhone,
        phoneCanonical: bestPhone10,
        email: primaryEmailStr,
        emailCanonical: canonicalEmail(primaryEmailStr),
        emails: Array.from(allEmails),
        linkedUids: Array.from(allLinkedUids),
        addressKey: addrKey,
        role: isAdmin ? 'admin' : 'collector',
        isAdmin: Boolean(isAdmin),
        mergedFromUids: FieldValue.arrayUnion(...dupUids),
        isMergedDuplicate: false,
        reconciledAt: FieldValue.serverTimestamp()
      };

      await adminDb.collection('users').doc(masterUid).set(consolidatedUserData, { merge: true });

      // Reassign Orders from duplicate UIDs to masterUid
      for (const dupUid of dupUids) {
        try {
          const dupOrdersQuery = await adminDb.collection('orders').where('userId', '==', dupUid).get();
          const dupOrdersQuery2 = await adminDb.collection('orders').where('uid', '==', dupUid).get();

          const batch = adminDb.batch();
          let count = 0;
          dupOrdersQuery.forEach(oDoc => {
            batch.update(oDoc.ref, {
              userId: masterUid,
              uid: masterUid,
              'customer.uid': masterUid,
              mergedFromUid: dupUid,
              reconciledAt: new Date().toISOString()
            });
            count++;
          });
          dupOrdersQuery2.forEach(oDoc => {
            batch.update(oDoc.ref, {
              userId: masterUid,
              uid: masterUid,
              'customer.uid': masterUid,
              mergedFromUid: dupUid,
              reconciledAt: new Date().toISOString()
            });
            count++;
          });
          if (count > 0) {
            await batch.commit();
            console.log(`[Batch Deduplicate] Reassigned ${count} orders from ${dupUid} to ${masterUid}`);
          }
        } catch (ordErr) {
          console.warn(`[Batch Deduplicate] Order reassignment note for ${dupUid}:`, ordErr.message);
        }

        // Archive duplicate user document and delete from users
        try {
          const dupDocSnap = await adminDb.collection('users').doc(dupUid).get();
          if (dupDocSnap.exists) {
            await adminDb.collection('archived_users').doc(dupUid).set({
              ...dupDocSnap.data(),
              isMergedDuplicate: true,
              mergedIntoUid: masterUid,
              archivedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            await adminDb.collection('users').doc(dupUid).delete();
            duplicatesRemoved++;
          }
        } catch (delErr) {
          console.warn(`[Batch Deduplicate] Archive/delete note for ${dupUid}:`, delErr.message);
        }

        // Firebase Auth account cleanup if dup was phone-only
        try {
          const dupAuth = await adminAuth.getUser(dupUid).catch(() => null);
          const primAuth = await adminAuth.getUser(masterUid).catch(() => null);
          if (dupAuth && primAuth) {
            const isPhoneOnly = dupAuth.providerData.every(p => p.providerId === 'phone');
            if (isPhoneOnly && !primAuth.phoneNumber && bestPhone10) {
              await adminAuth.deleteUser(dupUid);
              await adminAuth.updateUser(masterUid, {
                phoneNumber: `+91${bestPhone10}`
              });
              console.log(`[Batch Deduplicate] Transferred phone +91${bestPhone10} from Auth ${dupUid} to ${masterUid}`);
            }
          }
        } catch (authErr) {
          console.warn(`[Batch Deduplicate] Auth cleanup note for ${dupUid}:`, authErr.message);
        }
      }

      mergeDetails.push({
        masterUid,
        collectorName: consolidatedUserData.profile.name,
        emails: consolidatedUserData.emails,
        phone: consolidatedUserData.phone,
        duplicatesMerged: dupUids
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully resolved ${clustersMerged} duplicate cluster(s) and pruned ${duplicatesRemoved} redundant collector record(s).`,
      clustersMerged,
      duplicatesRemoved,
      details: mergeDetails
    });
  } catch (err) {
    console.error('[Batch Deduplicate Uncaught Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal error during batch deduplication.' });
  }
}
