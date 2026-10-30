import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '../_firebaseAdmin.js';
import { 
  canonicalPhone, 
  formatPhoneDisplay, 
  canonicalEmail, 
  canonicalAddressKey 
} from '../../utils/normalize.js';

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

  const callerUid = decodedToken.uid;
  if (!callerUid) {
    return res.status(400).json({ error: 'Invalid user token: UID missing.' });
  }

  try {
    // 2. Extract and canonicalize phone & email from request body, token, and database
    const bodyPhone = req.body?.phone || req.body?.phoneNumber || '';
    const bodyEmail = req.body?.email || '';

    const callerUserRef = adminDb.collection('users').doc(callerUid);
    const callerSnap = await callerUserRef.get();
    const callerData = callerSnap.exists ? callerSnap.data() : { profile: {}, loyalty: {} };
    const callerProf = callerData.profile || {};

    const rawPhone = bodyPhone || callerData.phoneCanonical || callerProf.phone || callerData.phone || decodedToken.phone_number || '';
    const rawEmail = bodyEmail || callerData.emailCanonical || callerProf.email || callerData.email || decodedToken.email || '';

    let p10 = canonicalPhone(rawPhone);
    const em = canonicalEmail(rawEmail);

    // If caller has no phone in profile/token, search recent orders to resolve their phone
    if (!p10) {
      try {
        const userOrders = await adminDb.collection('orders').where('userId', '==', callerUid).limit(5).get();
        userOrders.forEach(ord => {
          if (!p10) {
            const ordData = ord.data() || {};
            const p = ordData.phone || ordData.customerPhone || ordData.shippingPhone || ordData.customer?.phone || ordData.shipping?.phone || ordData.shippingAddress?.phone;
            const normP = canonicalPhone(p);
            if (normP) p10 = normP;
          }
        });
      } catch (ordSearchErr) {
        console.warn('[Reconcile API] Order phone discovery note:', ordSearchErr.message);
      }
    }

    const isDummyEmail = (e) => !e || e.endsWith('@phone.mytholis.com') || e.includes('placeholder');

    // 3. Search for duplicate candidates in Firestore
    const candidateMap = new Map(); // uid -> data
    candidateMap.set(callerUid, { id: callerUid, ...callerData });

    const collectCandidateDoc = (snapDoc) => {
      if (!snapDoc || !snapDoc.exists) return;
      const docId = snapDoc.id;
      if (!candidateMap.has(docId)) {
        candidateMap.set(docId, { id: docId, ...snapDoc.data() });
      }
    };

    // A. Query by synthetic phone UID
    if (p10) {
      const syntheticPhoneDoc = await adminDb.collection('users').doc(`phone_${p10}`).get().catch(() => null);
      if (syntheticPhoneDoc && syntheticPhoneDoc.exists) {
        collectCandidateDoc(syntheticPhoneDoc);
      }
    }

    // B. Query users by phoneCanonical and phone variants
    if (p10) {
      try {
        const qCanonical = await adminDb.collection('users').where('phoneCanonical', '==', p10).get();
        qCanonical.forEach(d => collectCandidateDoc(d));
      } catch (qErr) {
        console.warn('[Reconcile API] phoneCanonical query note:', qErr.message);
      }

      const phoneVariants = [
        p10,
        `+91${p10}`,
        `+91 ${p10}`,
        `91${p10}`,
        `0${p10}`
      ];

      try {
        const qProfPhone = await adminDb.collection('users').where('profile.phone', 'in', phoneVariants).get();
        qProfPhone.forEach(d => collectCandidateDoc(d));
      } catch (_) {}

      try {
        const qRootPhone = await adminDb.collection('users').where('phone', 'in', phoneVariants).get();
        qRootPhone.forEach(d => collectCandidateDoc(d));
      } catch (_) {}
    }

    // C. Query users by verified email
    if (em && !isDummyEmail(em)) {
      try {
        const qEmailCanon = await adminDb.collection('users').where('emailCanonical', '==', em).get();
        qEmailCanon.forEach(d => collectCandidateDoc(d));
      } catch (_) {}

      try {
        const qEmailsArr = await adminDb.collection('users').where('emails', 'array-contains', em).get();
        qEmailsArr.forEach(d => collectCandidateDoc(d));
      } catch (_) {}

      try {
        const qProfEmail = await adminDb.collection('users').where('profile.email', '==', em).get();
        qProfEmail.forEach(d => collectCandidateDoc(d));
      } catch (_) {}

      try {
        const qRootEmail = await adminDb.collection('users').where('email', '==', em).get();
        qRootEmail.forEach(d => collectCandidateDoc(d));
      } catch (_) {}
    }

    // D. Query users by linkedUids containing callerUid
    try {
      const qLinked = await adminDb.collection('users').where('linkedUids', 'array-contains', callerUid).get();
      qLinked.forEach(d => collectCandidateDoc(d));
    } catch (_) {}

    const allCandidates = Array.from(candidateMap.values());

    // If only the caller document exists (no duplicates)
    if (allCandidates.length <= 1) {
      const formattedPhone = p10 ? formatPhoneDisplay(p10) : (callerProf.phone || '');
      const addrKey = canonicalAddressKey(callerProf.address || callerData.address, callerProf.pincode || callerData.pincode);

      const updates = {
        phoneCanonical: p10 || '',
        phone: formattedPhone,
        'profile.phone': formattedPhone,
        emailCanonical: em || '',
        email: em || callerData.email || '',
        emails: Array.from(new Set([...(callerData.emails || []), em])).filter(Boolean),
        linkedUids: Array.from(new Set([...(callerData.linkedUids || []), callerUid])),
        addressKey: addrKey,
        isMergedDuplicate: false
      };

      // Ensure 200 welcome bonus if initiate
      const currentSpendable = Number(callerData.loyalty?.spendable_mythos || 0);
      const currentLegacy = Number(callerData.loyalty?.legacy_mythos || 0);
      const hasLoyaltyPoints = currentSpendable > 0 || currentLegacy > 0;

      if (!hasLoyaltyPoints) {
        updates.loyalty = {
          spendable_mythos: 200,
          legacy_mythos: 200,
          full_bottles_purchased: 0,
          initiation_completed: false,
          codex_unlocked: [],
          trinity_claimed: false,
          pantheon_claimed: false,
          reviewed_scents: [],
          active_reward_codes: [],
          applied_reward_code: null,
          signup_bonus_awarded: true
        };
      }

      await callerUserRef.set(updates, { merge: true });
      const refreshed = await callerUserRef.get();
      return res.status(200).json({
        success: true,
        masterUid: callerUid,
        merged: false,
        user: refreshed.data()
      });
    }

    // 4. Deterministic Master Record Selection across all candidates
    // Priority:
    // 1. isAdmin === true or role === 'admin'
    // 2. Real non-dummy email
    // 3. Earliest createdAt
    const scoredCandidates = allCandidates.map(c => {
      let score = 0;
      const prof = c.profile || {};
      const isAdmin = c.isAdmin === true || c.role === 'admin' || prof.isAdmin === true || prof.role === 'admin';
      if (isAdmin) score += 10000000;

      const email = canonicalEmail(c.emailCanonical || prof.email || c.email);
      if (email && !isDummyEmail(email)) score += 10000;

      const createdMillis = c.createdAt?.toMillis ? c.createdAt.toMillis() : (c.createdAt ? new Date(c.createdAt).getTime() : 0);
      if (createdMillis > 0) {
        score += Math.max(0, 10000000000000 - createdMillis) / 1000000000;
      }
      return { candidate: c, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const masterCandidate = scoredCandidates[0].candidate;
    const masterUid = masterCandidate.id;
    const duplicateCandidates = scoredCandidates.slice(1).map(s => s.candidate);
    const dupUids = duplicateCandidates.map(d => d.id);

    console.log(`[Reconcile API] Found ${dupUids.length} duplicate(s). Master UID is ${masterUid} (Caller was ${callerUid})`);

    // Consolidate data into Master
    let masterProf = { ...(masterCandidate.profile || {}) };
    let masterLoyalty = { ...(masterCandidate.loyalty || {}) };
    const allEmails = new Set();
    const allLinkedUids = new Set([masterUid, ...(masterCandidate.linkedUids || [])]);
    let isAdmin = masterCandidate.isAdmin === true || masterCandidate.role === 'admin' || masterProf.isAdmin === true || masterProf.role === 'admin';

    const mEmail = canonicalEmail(masterCandidate.emailCanonical || masterProf.email || masterCandidate.email);
    if (mEmail && !isDummyEmail(mEmail)) allEmails.add(mEmail);
    if (Array.isArray(masterCandidate.emails)) masterCandidate.emails.forEach(e => { if (e && !isDummyEmail(e)) allEmails.add(canonicalEmail(e)); });

    let bestPhone10 = canonicalPhone(masterCandidate.phoneCanonical || masterProf.phone || masterCandidate.phone || p10);
    let bestAddress = masterProf.address || masterCandidate.address || '';
    let bestCity = masterProf.city || masterCandidate.city || '';
    let bestState = masterProf.state || masterCandidate.state || '';
    let bestPincode = masterProf.pincode || masterCandidate.pincode || '';

    duplicateCandidates.forEach(dup => {
      const dProf = dup.profile || {};
      const dLoyalty = dup.loyalty || {};
      allLinkedUids.add(dup.id);
      if (Array.isArray(dup.linkedUids)) dup.linkedUids.forEach(id => allLinkedUids.add(id));

      if (dup.isAdmin === true || dup.role === 'admin' || dProf.isAdmin === true || dProf.role === 'admin') {
        isAdmin = true;
      }

      const dupEmail = canonicalEmail(dup.emailCanonical || dProf.email || dup.email);
      if (dupEmail && !isDummyEmail(dupEmail)) allEmails.add(dupEmail);
      if (Array.isArray(dup.emails)) dup.emails.forEach(e => { if (e && !isDummyEmail(e)) allEmails.add(canonicalEmail(e)); });

      // Sum points across duplicates
      masterLoyalty = {
        ...masterLoyalty,
        spendable_mythos: (Number(masterLoyalty.spendable_mythos) || 0) + (Number(dLoyalty.spendable_mythos) || 0),
        legacy_mythos: (Number(masterLoyalty.legacy_mythos) || 0) + (Number(dLoyalty.legacy_mythos) || 0),
        full_bottles_purchased: (Number(masterLoyalty.full_bottles_purchased) || 0) + (Number(dLoyalty.full_bottles_purchased) || 0),
        manual_tier_override: masterLoyalty.manual_tier_override || dLoyalty.manual_tier_override || null,
        initiation_completed: Boolean(masterLoyalty.initiation_completed || dLoyalty.initiation_completed),
        trinity_claimed: Boolean(masterLoyalty.trinity_claimed || dLoyalty.trinity_claimed),
        pantheon_claimed: Boolean(masterLoyalty.pantheon_claimed || dLoyalty.pantheon_claimed),
        codex_unlocked: Array.from(new Set([...(masterLoyalty.codex_unlocked || []), ...(dLoyalty.codex_unlocked || [])])),
        reviewed_scents: Array.from(new Set([...(masterLoyalty.reviewed_scents || []), ...(dLoyalty.reviewed_scents || [])])),
        active_reward_codes: Array.from(new Set([...(masterLoyalty.active_reward_codes || []), ...(dLoyalty.active_reward_codes || [])])),
        signup_bonus_awarded: Boolean(masterLoyalty.signup_bonus_awarded || dLoyalty.signup_bonus_awarded)
      };

      const isCurrentGeneric = !masterProf.name || masterProf.name === 'Collector' || masterProf.name === 'Patron' || masterProf.name.startsWith('Collector (') || masterProf.name.startsWith('Patron (');
      const isDupSpecific = dProf.name && dProf.name !== 'Collector' && dProf.name !== 'Patron' && !dProf.name.startsWith('Collector (') && !dProf.name.startsWith('Patron (');
      if (isCurrentGeneric && isDupSpecific) {
        masterProf.name = dProf.name;
      }

      if (!bestPhone10) {
        bestPhone10 = canonicalPhone(dup.phoneCanonical || dProf.phone || dup.phone);
      }

      if (!bestAddress && (dProf.address || dup.address)) {
        bestAddress = dProf.address || dup.address || '';
        bestCity = dProf.city || dup.city || '';
        bestState = dProf.state || dup.state || '';
        bestPincode = dProf.pincode || dup.pincode || '';
      }
    });

    const formattedPhone = bestPhone10 ? formatPhoneDisplay(bestPhone10) : (masterProf.phone || '');
    const primaryEmailStr = allEmails.size > 0 ? Array.from(allEmails)[0] : (masterProf.email || '');
    const addrKey = canonicalAddressKey(bestAddress, bestPincode);

    const consolidatedMasterData = {
      profile: {
        ...masterProf,
        name: masterProf.name || 'Collector',
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
      loyalty: masterLoyalty,
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

    await adminDb.collection('users').doc(masterUid).set(consolidatedMasterData, { merge: true });

    // Reassign Orders from duplicate UIDs to masterUid
    for (const dupUid of dupUids) {
      try {
        const ordQ1 = await adminDb.collection('orders').where('userId', '==', dupUid).get();
        const ordQ2 = await adminDb.collection('orders').where('uid', '==', dupUid).get();
        const batch = adminDb.batch();
        let cCount = 0;
        ordQ1.forEach(doc => {
          batch.update(doc.ref, { userId: masterUid, uid: masterUid, 'customer.uid': masterUid, mergedFromUid: dupUid, reconciledAt: new Date().toISOString() });
          cCount++;
        });
        ordQ2.forEach(doc => {
          batch.update(doc.ref, { userId: masterUid, uid: masterUid, 'customer.uid': masterUid, mergedFromUid: dupUid, reconciledAt: new Date().toISOString() });
          cCount++;
        });
        if (cCount > 0) await batch.commit();
      } catch (ordErr) {
        console.warn(`[Reconcile API] Order reassignment note for ${dupUid}:`, ordErr.message);
      }

      // Archive duplicate doc & delete from users
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
        }
      } catch (delErr) {
        console.warn(`[Reconcile API] Archive/delete note for ${dupUid}:`, delErr.message);
      }
    }

    const finalSnap = await adminDb.collection('users').doc(masterUid).get();

    return res.status(200).json({
      success: true,
      merged: true,
      masterUid,
      callerUid,
      mergedUids: dupUids,
      user: finalSnap.data()
    });
  } catch (err) {
    console.error('[Reconcile API Uncaught Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during account reconciliation.' });
  }
}
