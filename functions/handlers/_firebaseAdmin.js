import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let _app = null;
let _db = null;
let _auth = null;

function initFirebase() {
  if (_app) return { app: _app, db: _db, auth: _auth };

  try {
    if (!getApps().length) {
      let credential = null;
      const resolvedProjectId = process.env.MYTHOLIS_PROJECT_ID || process.env.GCLOUD_PROJECT || 'mytholis-1';

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
            projectId: resolvedProjectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          });
        } catch (e) {
          console.warn("[Mytholis Admin] Failed to initialize cert with private key:", e.message);
        }
      }

      const appConfig = { projectId: resolvedProjectId };
      if (credential) {
        appConfig.credential = credential;
      }

      _app = initializeApp(appConfig);
    } else {
      _app = getApps()[0];
    }

    _db = getFirestore(_app);
    _auth = getAuth(_app);
  } catch (err) {
    console.warn("[Mytholis Admin] Lazy initialization warning:", err.message);
  }

  return { app: _app, db: _db, auth: _auth };
}

// Proxies allow calling adminDb.collection(...) or adminAuth.verifyIdToken(...) without eager startup probing
export const adminDb = new Proxy({}, {
  get(target, prop) {
    const { db } = initFirebase();
    if (!db) return undefined;
    const val = db[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  }
});

export const adminAuth = new Proxy({}, {
  get(target, prop) {
    const { auth } = initFirebase();
    if (!auth) return undefined;
    const val = auth[prop];
    return typeof val === 'function' ? val.bind(auth) : val;
  }
});

export default new Proxy({}, {
  get(target, prop) {
    const { app } = initFirebase();
    if (!app) return undefined;
    const val = app[prop];
    return typeof val === 'function' ? val.bind(app) : val;
  }
});
