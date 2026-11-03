import { adminDb, adminAuth } from '../_firebaseAdmin.js';
import { authenticate, isAdminToken } from '../../lib/auth.js';

/**
 * Sovereign Collector Account Deletion / Reset API
 * Allows:
 * 1. A user to permanently delete their own account & data (for testing fresh signups)
 * 2. An administrator to delete a target test user from both Firebase Auth and Firestore
 */
export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authenticate caller via Firebase ID Token
  const auth = await authenticate(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }
  const decodedToken = auth.decoded;

  const callerUid = decodedToken.uid;
  const callerEmail = (decodedToken.email || '').trim().toLowerCase();
  const targetUid = String(req.body?.targetUid || callerUid).trim();
  const isCallerAdmin = isAdminToken(decodedToken);

  // If attempting to delete another account, caller must be an admin.
  if (targetUid !== callerUid && !isCallerAdmin) {
    console.warn(`[Delete Account API] Forbidden cross-account deletion attempt by ${callerUid} -> ${targetUid}`);
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required to delete other accounts.' });
  }

  try {
    // 2. Safeguard administrator accounts from being deleted.
    const targetDocSnap = await adminDb.collection('users').doc(targetUid).get().catch(() => null);
    const targetData = targetDocSnap && targetDocSnap.exists ? targetDocSnap.data() : {};
    const targetEmail = (targetData.profile?.email || targetData.email || '').trim().toLowerCase();

    const protectedEmails = String(process.env.ADMIN_EMAIL || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let targetIsAdmin = protectedEmails.includes(targetEmail);
    if (!targetIsAdmin) {
      try {
        const targetRecord = await adminAuth.getUser(targetUid);
        targetIsAdmin = targetRecord.customClaims?.admin === true;
      } catch (_) {}
    }

    if (targetIsAdmin) {
      return res.status(403).json({ error: 'Cannot delete an administrator account. Revoke the admin claim first.' });
    }

    // 3. Delete from Firebase Authentication
    let authDeleted = false;
    try {
      await adminAuth.deleteUser(targetUid);
      authDeleted = true;
      console.log(`[Delete Account API] Successfully deleted user from Firebase Auth: ${targetUid}`);
    } catch (authDelErr) {
      console.warn(`[Delete Account API] Auth deletion note for ${targetUid}:`, authDelErr.message);
    }

    // 4. Delete from Firestore users collection
    if (targetDocSnap && targetDocSnap.exists) {
      await adminDb.collection('users').doc(targetUid).delete();
      console.log(`[Delete Account API] Successfully deleted user doc users/${targetUid}`);
    }

    // 5. Delete from archived_users collection if present
    await adminDb.collection('archived_users').doc(targetUid).delete().catch(() => {});

    // 6. Optionally purge *unpaid* order drafts.
    // Paid orders are statutory invoice records (GST) and are NEVER deleted
    // here; they are anonymised instead so the financial ledger stays intact.
    const purgeOrders = req.body?.purgeOrders === true;
    if (purgeOrders) {
      const explicitOrderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds : [];
      const ordersToPurge = new Set(explicitOrderIds);

      // Query by userId or uid
      if (targetUid && !targetUid.startsWith('guest_')) {
        const ordersSnap1 = await adminDb.collection('orders').where('userId', '==', targetUid).get().catch(() => null);
        if (ordersSnap1) ordersSnap1.forEach(doc => ordersToPurge.add(doc.id));
        const ordersSnapUid = await adminDb.collection('orders').where('uid', '==', targetUid).get().catch(() => null);
        if (ordersSnapUid) ordersSnapUid.forEach(doc => ordersToPurge.add(doc.id));
      }

      // Query by email if available
      const cleanTargetEmail = (req.body?.email || targetEmail || '').trim().toLowerCase();
      if (cleanTargetEmail && !cleanTargetEmail.endsWith('@phone.mytholis.com')) {
        const ordersSnap2 = await adminDb.collection('orders').where('userEmail', '==', cleanTargetEmail).get().catch(() => null);
        if (ordersSnap2) ordersSnap2.forEach(doc => ordersToPurge.add(doc.id));
        const ordersSnap3 = await adminDb.collection('orders').where('email', '==', cleanTargetEmail).get().catch(() => null);
        if (ordersSnap3) ordersSnap3.forEach(doc => ordersToPurge.add(doc.id));
      }

      // Query by phone if available
      const cleanPhone = String(req.body?.phone || '').replace(/\D/g, '');
      const p10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      if (p10 && p10.length === 10) {
        const ordersAll = await adminDb.collection('orders').get().catch(() => null);
        if (ordersAll) {
          ordersAll.forEach(doc => {
            const data = doc.data() || {};
            const oPhone = String(data.phone || data.customerPhone || data.shippingPhone || data.shippingAddress?.phone || '').replace(/\D/g, '');
            if (oPhone.includes(p10)) {
              ordersToPurge.add(doc.id);
            }
          });
        }
      }

      // Query by order ID if targetUid is actually an order ID
      const directOrd = await adminDb.collection('orders').doc(targetUid).get().catch(() => null);
      if (directOrd && directOrd.exists) {
        ordersToPurge.add(targetUid);
      }

      if (ordersToPurge.size > 0) {
        const batch = adminDb.batch();
        let deleted = 0;
        let retained = 0;

        for (const ordId of ordersToPurge) {
          const ordRef = adminDb.collection('orders').doc(ordId);
          const ordSnap = await ordRef.get().catch(() => null);

          if (!ordSnap || !ordSnap.exists) {
            batch.delete(ordRef);
            deleted += 1;
            continue;
          }

          const ord = ordSnap.data() || {};
          const payStatus = String(ord.paymentStatus || '').toLowerCase();
          const isFinanciallySettled =
            payStatus.includes('paid') ||
            payStatus.includes('captured') ||
            ord.paymentCaptured === true ||
            Boolean(ord.razorpayPaymentId || ord.paymentId);

          if (isFinanciallySettled) {
            // Keep the invoice, strip the personal data.
            batch.set(ordRef, {
              customerName: 'Redacted',
              customerPhone: '',
              customerAddress: '',
              customer: {},
              phone: '',
              address: '',
              userEmail: '',
              email: '',
              userId: `deleted_${targetUid}`,
              uid: `deleted_${targetUid}`,
              piiRedactedAt: new Date().toISOString()
            }, { merge: true });
            retained += 1;
          } else {
            batch.delete(ordRef);
            deleted += 1;
          }
        }

        await batch.commit();
        console.log(`[Delete Account API] Orders for ${targetUid}: ${deleted} purged, ${retained} retained (paid, redacted).`);
      }
    }

    return res.status(200).json({
      success: true,
      authDeleted,
      message: `Account and associated data for UID ${targetUid} (${targetEmail || 'No Email'}) permanently deleted.`
    });
  } catch (err) {
    console.error('[Delete Account API Uncaught Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error deleting account.' });
  }
}
