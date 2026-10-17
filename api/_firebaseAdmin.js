import admin from 'firebase-admin';

if (!admin.apps.length) {
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      const saJson = saRaw.startsWith('{')
        ? JSON.parse(saRaw)
        : JSON.parse(Buffer.from(saRaw, 'base64').toString('utf-8'));
      credential = admin.credential.cert(saJson);
    } catch (e) {
      console.error("[Mytholis Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'mytholis-1',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
    } catch (e) {
      console.error("[Mytholis Admin] Failed to initialize cert with private key:", e.message);
    }
  }

  const appConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'mytholis-1'
  };

  if (credential) {
    appConfig.credential = credential;
  }

  admin.initializeApp(appConfig);
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
