import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app;

if (!getApps().length) {
  let credential = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      const saJson = saRaw.startsWith('{')
        ? JSON.parse(saRaw)
        : JSON.parse(Buffer.from(saRaw, 'base64').toString('utf-8'));
      credential = cert(saJson);
    } catch (e) {
      console.error("[Mytholis Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      credential = cert({
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

  app = initializeApp(appConfig);
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export default app;
