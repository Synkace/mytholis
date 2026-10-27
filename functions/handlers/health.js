import { adminDb, adminAuth } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const status = {
    api_server: 'ok',
    env_configured: Boolean(
      process.env.GCLOUD_PROJECT || process.env.MYTHOLIS_PROJECT_ID || process.env.FIREBASE_CONFIG
    ),
    firestore_admin: adminDb ? 'ready' : 'standby',
    auth_admin: adminAuth ? 'ready' : 'standby',
    timestamp: new Date().toISOString()
  };

  try {
    if (adminDb) {
      // Test Firestore Admin read/write access
      const pingRef = adminDb.collection('_diagnostics').doc('health_check');
      await pingRef.set({ last_ping: status.timestamp }, { merge: true });
      const snap = await pingRef.get();
      status.firestore_admin = snap.exists ? 'connected' : 'failed';
    }

    if (adminAuth) {
      // Test Firebase Auth Admin initialization
      await adminAuth.listUsers(1);
      status.auth_admin = 'connected';
    }

    return res.status(200).json({ ok: true, status });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      status,
      warning: error.message
    });
  }
}
