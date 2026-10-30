import { adminDb, adminAuth } from '../_firebaseAdmin.js';

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
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (authErr) {
    console.error('[Delete Account API] Token verification failed:', authErr.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  }

  const callerUid = decodedToken.uid;
  const callerEmail = (decodedToken.email || '').trim().toLowerCase();
  const targetUid = req.body?.targetUid || callerUid;

  // Master Admin Protection List
  const allowedAdmins = [
    'gunhegarr@gmail.com',
    'admin@mytholis.com',
    'alexander@mytholis.com',
    'founder@mytholis.com'
  ];
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  if (configuredAdminEmail) {
    configuredAdminEmail.split(',').forEach(e => {
      const trimmed = e.trim().toLowerCase();
      if (trimmed && !allowedAdmins.includes(trimmed)) allowedAdmins.push(trimmed);
    });
  }

  // Check if caller is admin
  let isCallerAdmin = decodedToken.admin === true || allowedAdmins.includes(callerEmail) || callerEmail.includes('gunhegarr');
  if (!isCallerAdmin) {
    const callerDoc = await adminDb.collection('users').doc(callerUid).get().catch(() => null);
    if (callerDoc && callerDoc.exists) {
      const cData = callerDoc.data() || {};
      if (cData.role === 'admin' || cData.isAdmin === true || cData.profile?.role === 'admin' || cData.profile?.isAdmin === true) {
        isCallerAdmin = true;
      }
    }
  }

  // If attempting to delete another account, caller must be an admin
  if (targetUid !== callerUid && !isCallerAdmin) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required to delete other accounts.' });
  }

  try {
    // 2. Safeguard Master Admin Accounts from being deleted
    const targetDocSnap = await adminDb.collection('users').doc(targetUid).get().catch(() => null);
    const targetData = targetDocSnap && targetDocSnap.exists ? targetDocSnap.data() : {};
    const targetEmail = (targetData.profile?.email || targetData.email || '').trim().toLowerCase();

    if (allowedAdmins.includes(targetEmail) || targetEmail.includes('gunhegarr')) {
      return res.status(403).json({ error: 'Cannot delete sovereign master administrator account.' });
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

    // 6. Optionally purge orders for this user if requested (default to false to keep ledger intact)
    const purgeOrders = Boolean(req.body?.purgeOrders);
    if (purgeOrders) {
      const ordersSnap = await adminDb.collection('orders').where('userId', '==', targetUid).get();
      const batch = adminDb.batch();
      ordersSnap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[Delete Account API] Purged ${ordersSnap.size} orders for ${targetUid}`);
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
