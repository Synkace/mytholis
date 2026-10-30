import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '../_firebaseAdmin.js';
import { normalizePhone, normalizeEmail } from '../../utils/normalize.js';

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST reconciliation payload.' });
  }

  // 1. Authenticate caller via Firebase ID Token
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (authErr) {
    console.error('[Reconcile API] Token verification failed:', authErr.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  }

  const primaryUid = decodedToken.uid;
  if (!primaryUid) {
    return res.status(400).json({ error: 'Invalid user token: UID missing.' });
  }

  try {
    // 2. Extract and normalize phone & email from request body or existing user profile
    const bodyPhone = req.body?.phone || req.body?.phoneNumber || '';
    const bodyEmail = req.body?.email || '';

    const primaryUserRef = adminDb.collection('users').doc(primaryUid);
    const primarySnap = await primaryUserRef.get();
    const primaryData = primarySnap.exists ? primarySnap.data() : { profile: {}, loyalty: {} };
    const primaryProf = primaryData.profile || {};

    const rawPhone = bodyPhone || primaryProf.phone || primaryData.phone || decodedToken.phone_number || '';
    const rawEmail = bodyEmail || primaryProf.email || primaryData.email || decodedToken.email || '';

    const normalizedPhone = normalizePhone(rawPhone);
    const normalizedEmail = normalizeEmail(rawEmail);

    const isDummyEmail = (e) => !e || e.endsWith('@phone.mytholis.com') || e.includes('placeholder');

    // 3. Search for duplicate candidates in Firestore
    const candidateUids = new Set();
    const duplicateDocs = [];

    // Helper to check and collect candidate docs
    const collectCandidateDoc = (snapDoc) => {
      if (!snapDoc || !snapDoc.exists) return;
      const docId = snapDoc.id;
      if (docId !== primaryUid && !candidateUids.has(docId)) {
        candidateUids.add(docId);
        duplicateDocs.push({ id: docId, ...snapDoc.data() });
      }
    };

    // A. Direct check by common synthetic phone UID
    if (normalizedPhone) {
      const syntheticPhoneDoc = await adminDb.collection('users').doc(`phone_${normalizedPhone}`).get().catch(() => null);
      if (syntheticPhoneDoc && syntheticPhoneDoc.exists) {
        collectCandidateDoc(syntheticPhoneDoc);
      }
    }

    // B. Query users by phone numbers
    if (normalizedPhone) {
      const phoneVariants = [
        normalizedPhone,
        `+91${normalizedPhone}`,
        `+91 ${normalizedPhone}`,
        `91${normalizedPhone}`,
        `0${normalizedPhone}`
      ];

      // Query profile.phone
      try {
        const qProfPhone = await adminDb.collection('users')
          .where('profile.phone', 'in', phoneVariants.slice(0, 10))
          .get();
        qProfPhone.forEach(d => collectCandidateDoc(d));
      } catch (qErr1) {
        console.warn('[Reconcile API] profile.phone query fallback:', qErr1.message);
      }

      // Query root phone field
      try {
        const qRootPhone = await adminDb.collection('users')
          .where('phone', 'in', phoneVariants.slice(0, 10))
          .get();
        qRootPhone.forEach(d => collectCandidateDoc(d));
      } catch (qErr2) {
        console.warn('[Reconcile API] root phone query fallback:', qErr2.message);
      }
    }

    // C. Query users by verified email (non-dummy)
    if (normalizedEmail && !isDummyEmail(normalizedEmail)) {
      try {
        const qEmail = await adminDb.collection('users')
          .where('profile.email', '==', normalizedEmail)
          .get();
        qEmail.forEach(d => collectCandidateDoc(d));
      } catch (qErr3) {
        console.warn('[Reconcile API] profile.email query fallback:', qErr3.message);
      }

      try {
        const qRootEmail = await adminDb.collection('users')
          .where('email', '==', normalizedEmail)
          .get();
        qRootEmail.forEach(d => collectCandidateDoc(d));
      } catch (qErr4) {
        console.warn('[Reconcile API] root email query fallback:', qErr4.message);
      }
    }

    // If no duplicate accounts found, ensure primary user has normalized attributes and return
    if (duplicateDocs.length === 0) {
      const updates = {};
      if (normalizedPhone && (!primaryProf.phone || primaryProf.phone !== normalizedPhone)) {
        updates['profile.phone'] = normalizedPhone;
        updates['phone'] = normalizedPhone;
      }
      if (normalizedEmail && !isDummyEmail(normalizedEmail) && (!primaryProf.email || isDummyEmail(primaryProf.email))) {
        updates['profile.email'] = normalizedEmail;
        updates['email'] = normalizedEmail;
      }

      if (Object.keys(updates).length > 0) {
        await primaryUserRef.set(updates, { merge: true });
        const refreshed = await primaryUserRef.get();
        return res.status(200).json({
          success: true,
          merged: false,
          user: refreshed.data()
        });
      }

      return res.status(200).json({
        success: true,
        merged: false,
        user: primaryData
      });
    }

    // 4. Atomic Consolidation & Merge Engine for each duplicate record
    console.log(`[Reconcile API] Found ${duplicateDocs.length} duplicate(s) for primaryUid ${primaryUid}:`, Array.from(candidateUids));

    let mergedProfile = { ...primaryProf };
    let mergedLoyalty = { ...(primaryData.loyalty || {}) };
    let earliestCreatedAt = primaryData.createdAt || primaryProf.createdAt || null;
    const mergedFromUids = [...(primaryData.mergedFromUids || [])];

    for (const dup of duplicateDocs) {
      const dupUid = dup.id;
      const dupProf = dup.profile || {};
      const dupLoyalty = dup.loyalty || {};

      mergedFromUids.push(dupUid);

      // Merge loyalty points & bottle milestones
      mergedLoyalty = {
        ...mergedLoyalty,
        spendable_mythos: (Number(mergedLoyalty.spendable_mythos) || 0) + (Number(dupLoyalty.spendable_mythos) || 0),
        legacy_mythos: (Number(mergedLoyalty.legacy_mythos) || 0) + (Number(dupLoyalty.legacy_mythos) || 0),
        full_bottles_purchased: (Number(mergedLoyalty.full_bottles_purchased) || 0) + (Number(dupLoyalty.full_bottles_purchased) || 0),
        manual_tier_override: mergedLoyalty.manual_tier_override || dupLoyalty.manual_tier_override || null,
        initiation_completed: Boolean(mergedLoyalty.initiation_completed || dupLoyalty.initiation_completed),
        trinity_claimed: Boolean(mergedLoyalty.trinity_claimed || dupLoyalty.trinity_claimed),
        pantheon_claimed: Boolean(mergedLoyalty.pantheon_claimed || dupLoyalty.pantheon_claimed),
        codex_unlocked: Array.from(new Set([...(mergedLoyalty.codex_unlocked || []), ...(dupLoyalty.codex_unlocked || [])])),
        reviewed_scents: Array.from(new Set([...(mergedLoyalty.reviewed_scents || []), ...(dupLoyalty.reviewed_scents || [])])),
        active_reward_codes: Array.from(new Set([...(mergedLoyalty.active_reward_codes || []), ...(dupLoyalty.active_reward_codes || [])]))
      };

      // Keep earliest created date
      const dupCreated = dup.createdAt || dupProf.createdAt;
      if (dupCreated) {
        if (!earliestCreatedAt) {
          earliestCreatedAt = dupCreated;
        } else {
          const tPrimary = earliestCreatedAt.toMillis ? earliestCreatedAt.toMillis() : new Date(earliestCreatedAt).getTime();
          const tDup = dupCreated.toMillis ? dupCreated.toMillis() : new Date(dupCreated).getTime();
          if (tDup < tPrimary) earliestCreatedAt = dupCreated;
        }
      }

      // Preserve most complete address and name
      if (!mergedProfile.address && (dupProf.address || dup.address)) {
        mergedProfile.address = dupProf.address || dup.address || '';
        mergedProfile.city = dupProf.city || dup.city || '';
        mergedProfile.state = dupProf.state || dup.state || '';
        mergedProfile.pincode = dupProf.pincode || dup.pincode || '';
      }

      // Preserve descriptive name over generic
      const isCurrentGeneric = !mergedProfile.name || mergedProfile.name === 'Collector' || mergedProfile.name === 'Patron' || mergedProfile.name.startsWith('Collector (') || mergedProfile.name.startsWith('Patron (');
      const isDupSpecific = dupProf.name && dupProf.name !== 'Collector' && dupProf.name !== 'Patron' && !dupProf.name.startsWith('Collector (') && !dupProf.name.startsWith('Patron (');
      if (isCurrentGeneric && isDupSpecific) {
        mergedProfile.name = dupProf.name;
      }

      // Preserve real email
      if (isDummyEmail(mergedProfile.email) && !isDummyEmail(dupProf.email || dup.email)) {
        mergedProfile.email = normalizeEmail(dupProf.email || dup.email);
      }

      // Preserve verified phone
      if (!mergedProfile.phone && (dupProf.phone || dup.phone)) {
        mergedProfile.phone = normalizePhone(dupProf.phone || dup.phone);
      }

      // Preserve admin standing if either was admin
      if (dup.isAdmin === true || dup.role === 'admin' || dupProf.isAdmin === true || dupProf.role === 'admin') {
        mergedProfile.isAdmin = true;
        mergedProfile.role = 'admin';
      }

      // Reassign Orders: Query orders where userId == dupUid or uid == dupUid
      try {
        const ordersQuery = await adminDb.collection('orders')
          .where('userId', '==', dupUid)
          .get();

        const batch = adminDb.batch();
        ordersQuery.forEach(ordDoc => {
          batch.update(ordDoc.ref, {
            userId: primaryUid,
            uid: primaryUid,
            'customer.uid': primaryUid,
            mergedFromUid: dupUid,
            reconciledAt: new Date().toISOString()
          });
        });

        // Also check if stored as 'uid'
        const ordersQuery2 = await adminDb.collection('orders')
          .where('uid', '==', dupUid)
          .get();

        ordersQuery2.forEach(ordDoc => {
          batch.update(ordDoc.ref, {
            userId: primaryUid,
            uid: primaryUid,
            'customer.uid': primaryUid,
            mergedFromUid: dupUid,
            reconciledAt: new Date().toISOString()
          });
        });

        await batch.commit();
        console.log(`[Reconcile API] Reassigned ${ordersQuery.size + ordersQuery2.size} order(s) from ${dupUid} to ${primaryUid}.`);
      } catch (orderReassignErr) {
        console.warn(`[Reconcile API] Order reassignment note for ${dupUid}:`, orderReassignErr.message);
      }

      // Firebase Auth Account Link / Cleanup via Admin SDK
      try {
        const dupAuthUser = await adminAuth.getUser(dupUid).catch(() => null);
        const primaryAuthUser = await adminAuth.getUser(primaryUid).catch(() => null);

        // If duplicate was phone-only and primary has no phone linked yet
        if (dupAuthUser && primaryAuthUser) {
          const isPhoneOnlyDup = dupAuthUser.providerData.every(p => p.providerId === 'phone');
          if (isPhoneOnlyDup && !primaryAuthUser.phoneNumber && normalizedPhone) {
            await adminAuth.deleteUser(dupUid);
            await adminAuth.updateUser(primaryUid, {
              phoneNumber: `+91${normalizedPhone}`
            });
            console.log(`[Reconcile API] Transferred phone +91${normalizedPhone} from ${dupUid} to ${primaryUid}.`);
          }
        }
      } catch (authErr) {
        console.warn(`[Reconcile API] Auth user transfer note for ${dupUid}:`, authErr.message);
      }

      // Move duplicate document to archived_users collection and delete from users
      try {
        await adminDb.collection('archived_users').doc(dupUid).set({
          ...dup,
          mergedInto: primaryUid,
          mergedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        await adminDb.collection('users').doc(dupUid).delete();
        console.log(`[Reconcile API] Archived and deleted duplicate doc users/${dupUid}`);
      } catch (archiveErr) {
        console.warn(`[Reconcile API] Archive/delete note for ${dupUid}:`, archiveErr.message);
      }
    }

    // 5. Save consolidated profile & loyalty to primary user doc
    const finalProfile = {
      ...mergedProfile,
      phone: normalizedPhone || mergedProfile.phone || '',
      email: (!isDummyEmail(normalizedEmail) ? normalizedEmail : mergedProfile.email) || '',
      createdAt: earliestCreatedAt || FieldValue.serverTimestamp()
    };

    const finalUserData = {
      profile: finalProfile,
      loyalty: mergedLoyalty,
      phone: finalProfile.phone,
      email: finalProfile.email,
      role: finalProfile.role || 'collector',
      isAdmin: Boolean(finalProfile.isAdmin),
      mergedFromUids: FieldValue.arrayUnion(...mergedFromUids),
      reconciledAt: FieldValue.serverTimestamp()
    };

    await primaryUserRef.set(finalUserData, { merge: true });
    const finalSnap = await primaryUserRef.get();

    return res.status(200).json({
      success: true,
      merged: true,
      mergedUids: Array.from(candidateUids),
      user: finalSnap.data()
    });
  } catch (err) {
    console.error('[Reconcile API Uncaught Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during account reconciliation.' });
  }
}
