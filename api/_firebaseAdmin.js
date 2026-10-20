import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app = null;
let adminDb = null;
let adminAuth = null;

try {
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
        console.warn("[Mytholis Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      try {
        credential = cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'mytholis-1',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });
      } catch (e) {
        console.warn("[Mytholis Admin] Failed to initialize cert with private key:", e.message);
      }
    }

    const appConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'mytholis-1'
    };

    if (credential) {
      appConfig.credential = credential;
    }

    // Only initialize if we have credentials or in Google Cloud environment
    if (credential || process.env.K_SERVICE || process.env.FUNCTION_NAME) {
      app = initializeApp(appConfig);
      adminDb = getFirestore(app);
      adminAuth = getAuth(app);
    } else {
      console.warn("[Mytholis Admin] No service account credentials found. Admin SDK in standby mode.");
    }
  } else {
    app = getApps()[0];
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
  }
} catch (initErr) {
  console.warn("[Mytholis Admin] Initialization warning (standby):", initErr.message);
}

export { adminDb, adminAuth };
export default app;
