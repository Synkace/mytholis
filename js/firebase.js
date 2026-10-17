/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - FIREBASE AUTH & FIRESTORE REALTIME SYNC
   Project ID: mytholis-1
   Package Name (Android): com.samar.mytholis
   ========================================================================== */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

// Your web app's Firebase configuration with Vite environment variable support
export const firebaseConfig = {
  apiKey: (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || "AIzaSyBc2aJMywhHkOTLLZKj8jFcYivZ3tJE-Qg",
  authDomain: (import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "mytholis-1.firebaseapp.com",
  projectId: (import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || "mytholis-1",
  storageBucket: (import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "mytholis-1.firebasestorage.app",
  messagingSenderId: (import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "227633160778",
  appId: (import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || "1:227633160778:web:6511ffcd68584df1adfcb3",
  measurementId: (import.meta.env && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || "G-RN50TZNZH3"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isSyncing = false;
  }

  init(storeRef, appRef) {
    this.store = storeRef;
    this.app = appRef;

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        console.log("[Mytholis Firebase] Client authenticated:", user.email || user.uid);
        await this.syncUserDataOnLogin(user);
      } else {
        console.log("[Mytholis Firebase] Client signed out.");
        if (this.store) {
          this.store.firebaseUser = null;
          this.store.notify();
        }
      }

      this.authListeners.forEach(cb => cb(user));
    });
  }

  onAuth(callback) {
    this.authListeners.push(callback);
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  }

  // Google 1-Tap Sign-In / Popup
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Google Sign-In Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Email & Password Sign-In
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Email Sign-In Error:", error);
      return { success: false, error: this.formatAuthError(error.code) || error.message };
    }
  }

  // Email & Password Sign-Up (New VIP Registration)
  async signUpWithEmail(email, password, name = '') {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Email Sign-Up Error:", error);
      return { success: false, error: this.formatAuthError(error.code) || error.message };
    }
  }

  // Sign Out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Sign Out Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Friendly error formatter
  formatAuthError(code) {
    switch (code) {
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account registered with this email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/invalid-credential': return 'Invalid email or password.';
      case 'auth/email-already-in-use': return 'An account already exists with this email address.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/popup-closed-by-user': return 'Sign-in cancelled.';
      default: return null;
    }
  }

  // Synchronize Cloud Firestore with Store on Login
  async syncUserDataOnLogin(user) {
    if (!this.store) return;
    this.isSyncing = true;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const cloudData = userDocSnap.data();

        // Merge cloud profile with store
        if (cloudData.profile) {
          this.store.user = Object.assign({}, this.store.user, cloudData.profile, {
            email: user.email,
            uid: user.uid,
            photoURL: user.photoURL || null
          });
          this.store.saveLocalStorage('mytholis_user', this.store.user);
        }

        // Merge cloud loyalty state with store
        if (cloudData.loyalty) {
          // Keep highest progress between cloud and local
          const localLoyalty = this.store.loyalty;
          const mergedLoyalty = Object.assign({}, localLoyalty, cloudData.loyalty);
          mergedLoyalty.spendable_mythos = Math.max(localLoyalty.spendable_mythos || 0, cloudData.loyalty.spendable_mythos || 0);
          mergedLoyalty.legacy_mythos = Math.max(localLoyalty.legacy_mythos || 0, cloudData.loyalty.legacy_mythos || 0);
          mergedLoyalty.full_bottles_purchased = Math.max(localLoyalty.full_bottles_purchased || 0, cloudData.loyalty.full_bottles_purchased || 0);
          
          // Union codex unlocks
          mergedLoyalty.codex_unlocked = Array.from(new Set([
            ...(localLoyalty.codex_unlocked || []),
            ...(cloudData.loyalty.codex_unlocked || [])
          ]));

          // Union active reward codes
          const codesMap = new Map();
          (localLoyalty.active_reward_codes || []).forEach(c => codesMap.set(c.code, c));
          (cloudData.loyalty.active_reward_codes || []).forEach(c => codesMap.set(c.code, c));
          mergedLoyalty.active_reward_codes = Array.from(codesMap.values());

          this.store.loyalty = mergedLoyalty;
          this.store.saveLocalStorage('mytholis_loyalty', mergedLoyalty);
        }
      } else {
        // First-time cloud registration: upload current local profile & loyalty
        await setDoc(userDocRef, {
          profile: {
            name: user.displayName || this.store.user.name || 'Mytholis Patron',
            email: user.email,
            phone: this.store.user.phone || '',
            address: this.store.user.address || '',
            pincode: this.store.user.pincode || '',
            city: this.store.user.city || '',
            createdAt: serverTimestamp()
          },
          loyalty: this.store.loyalty,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      this.store.firebaseUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      this.store.notify();
    } catch (err) {
      console.error("[Mytholis Firebase] Error syncing cloud profile:", err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Push local changes up to Firestore
  async pushLocalStateToCloud() {
    if (!this.currentUser || this.isSyncing) return;

    try {
      const userDocRef = doc(db, "users", this.currentUser.uid);
      await setDoc(userDocRef, {
        profile: {
          name: this.store.user.name || this.currentUser.displayName || '',
          email: this.currentUser.email,
          phone: this.store.user.phone || '',
          address: this.store.user.address || '',
          pincode: this.store.user.pincode || '',
          city: this.store.user.city || '',
          updatedAt: serverTimestamp()
        },
        loyalty: this.store.loyalty,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not sync to cloud:", err.message);
    }
  }

  // Record completed order into Firestore orders collection
  async recordOrderInCloud(orderData) {
    if (!this.currentUser) return;
    try {
      const ordersRef = collection(db, "orders");
      await addDoc(ordersRef, {
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        ...orderData,
        timestamp: serverTimestamp()
      });
      console.log("[Mytholis Firebase] Order recorded in cloud.");
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not record cloud order:", err.message);
    }
  }
}

export const firebaseService = new FirebaseService();
export { db, auth, doc, getDoc, setDoc, getDocs, collection };

if (typeof window !== 'undefined') {
  window.firebaseService = firebaseService;
  window.firebaseDb = db;
}
