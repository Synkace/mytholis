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
  signInWithCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  linkWithCredential
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";

// Founder and High-Security Admin Whitelist
export const ADMIN_EMAILS = [
  'gunhegarr@gmail.com',
  'admin@mytholis.com',
  'alexander@mytholis.com',
  'founder@mytholis.com',
  ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_EMAIL) || '').trim().toLowerCase()
].filter(Boolean);

export function checkIsAdmin(user, profile = {}) {
  if (!user && !profile) return false;
  const email = (user?.email || profile?.email || '').trim().toLowerCase();
  if (email && (ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.includes('gunhegarr'))) return true;
  if (profile?.isAdmin === true || profile?.role === 'admin') return true;
  if (user?.role === 'admin' || user?.isAdmin === true) return true;
  return false;
}

// Auto-resolve custom auth domain: if on mytholis.com, use custom domain for white-label Google Sign-In
const resolvedAuthDomain = (import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ||
  (typeof window !== 'undefined' && (window.location.hostname === 'mytholis.com' || window.location.hostname === 'www.mytholis.com')
    ? 'mytholis.com'
    : 'mytholis-1.firebaseapp.com');

// Your web app's Firebase configuration with Vite environment variable support
export const firebaseConfig = {
  apiKey: (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || "AIzaSyBc2aJMywhHkOTLLZKj8jFcYivZ3tJE-Qg",
  authDomain: resolvedAuthDomain,
  projectId: (import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || "mytholis-1",
  storageBucket: (import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "mytholis-1.firebasestorage.app",
  messagingSenderId: (import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "227633160778",
  appId: (import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || "1:227633160778:web:6511ffcd68584df1adfcb3",
  measurementId: (import.meta.env && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || "G-RN50TZNZH3"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
let db;
try {
  db = initializeFirestore(firebaseApp, {
    experimentalAutoDetectLongPolling: true
  });
} catch (e) {
  db = getFirestore(firebaseApp);
}

// Google OAuth Provider with prompt=select_account for immediate account transition
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isSyncing = false;
    this.phoneConfirmationResult = null;
  }

  init(storeRef, appRef) {
    this.store = storeRef;
    this.app = appRef;

    // Boot-time cloud hydrate for products and settings
    this.fetchGlobalSettings().catch(() => {});
    this.fetchProductsFromFirestore().catch(() => {});

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        console.log("[Mytholis Firebase] Client authenticated:", user.email || user.phoneNumber || user.uid);
        await this.syncUserDataOnLogin(user);
        if (this.app) {
          this.app.updateNavAuth();
          if (this.store && (this.store.currentView === 'admin' || this.store.currentView === 'sanctum-command' || this.store.currentView === 'profile')) {
            this.app.renderCurrentView();
          }
        }
      } else {
        console.log("[Mytholis Firebase] Client signed out.");
        if (this.store) {
          this.store.firebaseUser = null;
          this.store.user.isAdmin = false;
          this.store.user.role = 'patron';
          this.store.notify();
        }
        if (this.app) {
          this.app.updateNavAuth();
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

  // Sign in with Google Identity Services credential (ID Token / GoogleAuthProvider.credential)
  async signInWithGoogleCredential(idToken, accessToken = null) {
    try {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const result = await signInWithCredential(auth, credential);
      if (result && result.user) {
        await this.syncUserDataOnLogin(result.user);
      }
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Google Credential Sign-In Error:", error);
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
    }
  }

  // Google 1-Tap / Identity Services / Popup Sign-In
  async signInWithGoogle(idToken = null) {
    try {
      // If an ID Token is provided from Google Identity Services, authenticate directly via credential
      if (idToken) {
        return await this.signInWithGoogleCredential(idToken);
      }

      // Ensure select_account prompt is set so the flow transitions immediately without hanging
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        await this.syncUserDataOnLogin(result.user);
      }
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Google Sign-In Error:", error);
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
    }
  }

  // Clear reCAPTCHA widget and remove orphaned badges
  clearRecaptcha() {
    if (typeof window === 'undefined') return;
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (_) {}
      window.recaptchaVerifier = null;
    }
    document.querySelectorAll('.grecaptcha-badge').forEach(badge => {
      try {
        const parent = badge.closest('div[style*="position: fixed"]') || badge.parentElement;
        if (parent && parent !== document.body) {
          parent.remove();
        } else {
          badge.remove();
        }
      } catch (_) {}
    });
  }

  // Phone Number SMS OTP Authentication
  setupRecaptcha(containerId = 'recaptcha-container', forceRecreate = false) {
    try {
      if (typeof window === 'undefined') return null;

      // 1. If we already have a valid verifier attached and not forced to recreate, reuse it
      const existingContainer = document.getElementById(containerId);
      if (window.recaptchaVerifier && existingContainer && !forceRecreate) {
        return window.recaptchaVerifier;
      }

      // 2. Clear existing verifier & detached badges
      this.clearRecaptcha();

      // 3. Ensure a clean container exists
      let containerEl = document.getElementById(containerId);
      if (!containerEl) {
        // Fallback: create container on body so it is always present
        containerEl = document.createElement('div');
        containerEl.id = containerId;
        document.body.appendChild(containerEl);
      } else if (containerEl.parentNode) {
        // VITAL FIX for "reCAPTCHA has already been rendered in this element":
        // Google reCAPTCHA tracks DOM node instances internally. If a DOM node was rendered into,
        // creating a new RecaptchaVerifier on that exact DOM node throws an error.
        // Replacing the container node with a brand new node generates a clean, unrendered DOM reference!
        const freshContainer = document.createElement('div');
        freshContainer.id = containerId;
        containerEl.parentNode.replaceChild(freshContainer, containerEl);
        containerEl = freshContainer;
      }

      // 4. Initialize RecaptchaVerifier on the fresh DOM element
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerEl, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn("[Mytholis Firebase] reCAPTCHA expired, resetting...");
          this.clearRecaptcha();
        }
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.error("[Mytholis Firebase] Recaptcha setup error:", err);
      return null;
    }
  }

  async sendPhoneOtp(fullPhoneNumber, containerId = 'recaptcha-container') {
    try {
      let verifier = this.setupRecaptcha(containerId);
      if (!verifier) {
        throw new Error("Could not initialize security verification. Please refresh and try again.");
      }

      let confirmationResult;
      try {
        confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      } catch (firstError) {
        const isRenderError = firstError.message?.includes('already been rendered') ||
                              firstError.code === 'auth/captcha-check-failed' ||
                              firstError.code === 'auth/internal-error';
        if (isRenderError) {
          console.warn('[Mytholis Firebase] reCAPTCHA collision detected. Re-initializing fresh container and retrying...');
          verifier = this.setupRecaptcha(containerId, true);
          if (!verifier) throw firstError;
          confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
        } else {
          throw firstError;
        }
      }

      this.phoneConfirmationResult = confirmationResult;
      window.phoneConfirmationResult = confirmationResult;
      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Phone OTP Send Error:", error);
      this.clearRecaptcha();
      const friendly = this.formatAuthError(error.code);
      let errMsg = friendly || error.message;
      if (error.message?.includes('already been rendered')) {
        errMsg = 'Security check reset. Please tap Request SMS Passcode again.';
      }
      return { success: false, error: errMsg };
    }
  }

  async verifyPhoneOtp(otpCode) {
    try {
      const confirmationResult = this.phoneConfirmationResult || window.phoneConfirmationResult;
      if (!confirmationResult) {
        return { success: false, error: "Verification session expired. Please request a new code." };
      }
      const result = await confirmationResult.confirm(otpCode.trim());
      await this.syncUserDataOnLogin(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("[Mytholis Firebase] Phone OTP Verify Error:", error);
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
    }
  }

  // Password Reset
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Password Reset Error:", error);
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
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

  // Update Patron Profile (Name, Phone, Address, Coordinates, Avatar Photo)
  async updatePatronProfile(profileData = {}) {
    try {
      const user = auth.currentUser || this.currentUser;
      if (!user) {
        return { success: true, localOnly: true };
      }

      // 1. Update Firebase Auth display name and photoURL if provided
      const authUpdates = {};
      if (profileData.name && profileData.name.trim()) {
        authUpdates.displayName = profileData.name.trim();
      }
      // Firebase Auth updateProfile only accepts valid HTTP/HTTPS URLs under 2048 chars for photoURL
      if (profileData.photoURL !== undefined) {
        if (typeof profileData.photoURL === 'string' && (profileData.photoURL.startsWith('http://') || profileData.photoURL.startsWith('https://'))) {
          authUpdates.photoURL = profileData.photoURL;
        }
      }
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates).catch(err => console.warn('[Firebase Auth] updateProfile warn:', err.message));
      }

      // 2. Persist to Cloud Firestore under users/{uid}.profile
      const userDocRef = doc(db, "users", user.uid);
      const cleanData = {};
      for (const [key, val] of Object.entries(profileData)) {
        if (val !== undefined) {
          cleanData[key] = val;
        }
      }
      cleanData.updatedAt = new Date().toISOString();

      await setDoc(userDocRef, {
        profile: cleanData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Update Patron Profile Error:", error);
      return { success: false, error: error.message };
    }
  }

  // Change or Update Patron Password
  async updatePatronPassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser || this.currentUser;
      if (!user) {
        return { success: false, error: 'No active patron session found.' };
      }

      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters.' };
      }

      // If current password provided and user has email, re-authenticate first to prevent auth/requires-recent-login
      if (currentPassword && user.email && !user.email.endsWith('@phone.mytholis.com')) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
        } catch (reauthErr) {
          console.warn("[Mytholis Firebase] Re-authentication failed:", reauthErr);
          if (reauthErr.code === 'auth/wrong-password' || reauthErr.code === 'auth/invalid-credential') {
            return { success: false, error: 'Current password does not match.' };
          }
        }
      }

      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Update Password Error:", error);
      if (error.code === 'auth/requires-recent-login') {
        return { 
          success: false, 
          error: 'Security timeout: please sign out and sign back in, or use the "Send Password Reset Link" button below.' 
        };
      }
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
    }
  }

  // Link Email & Password to a Phone-authenticated account
  async linkEmailPasswordToPhone(email, password) {
    try {
      const user = auth.currentUser || this.currentUser;
      if (!user) {
        return { success: false, error: 'No active patron session found.' };
      }

      if (!email || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const credential = EmailAuthProvider.credential(email.trim(), password);
      await linkWithCredential(user, credential);

      // Update Firestore user record with real email
      await this.updatePatronProfile({ email: email.trim() });
      if (this.store) {
        this.store.user.email = email.trim();
        if (this.store.firebaseUser) this.store.firebaseUser.email = email.trim();
        this.store.saveLocalStorage('mytholis_user', this.store.user);
        this.store.notify();
      }

      return { success: true };
    } catch (error) {
      console.error("[Mytholis Firebase] Link Email/Password Error:", error);
      const friendly = this.formatAuthError(error.code);
      return { success: false, error: friendly || error.message };
    }
  }

  // Friendly error formatter
  formatAuthError(code) {
    switch (code) {
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account registered with this email. Please register first.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/invalid-credential': return 'Invalid email or password.';
      case 'auth/email-already-in-use': return 'An account already exists with this email address. Please sign in instead.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/popup-closed-by-user': return 'Sign-in cancelled.';
      case 'auth/configuration-not-found': return 'Sign-In provider is not enabled yet in your Firebase Console. Please register with Email & Password, or enable the provider in Firebase Console under Authentication > Sign-in method.';
      case 'auth/operation-not-allowed': return 'Phone Authentication is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable "Phone".';
      case 'auth/app-not-authorized': return 'This domain is not authorized for Phone Auth. Please add it to Firebase Console > Authentication > Settings > Authorized domains.';
      case 'auth/invalid-app-credential': return 'Firebase cannot verify this app or domain (auth/invalid-app-credential). Please ensure your domain is added to Firebase Console > Authentication > Settings > Authorized Domains, or add this number under "Phone numbers for testing".';
      case 'auth/invalid-phone-number': return 'Please enter a valid mobile number with country code (e.g. +91 98765 43210).';
      case 'auth/missing-phone-number': return 'Mobile phone number is required.';
      case 'auth/quota-exceeded': return 'SMS verification quota exceeded for today. Please try again later or sign in with Email.';
      case 'auth/captcha-check-failed': return 'Security verification failed. Please refresh the page and try again.';
      case 'auth/invalid-verification-code': return 'Incorrect 6-digit SMS passcode. Please check and re-enter.';
      case 'auth/code-expired': return 'The 6-digit SMS passcode has expired. Please request a new code.';
      case 'auth/too-many-requests': return 'Too many attempts. Please wait a few moments and try again.';
      default: return null;
    }
  }

  // Synchronize Cloud Firestore with Store on Login
  async syncUserDataOnLogin(user) {
    if (!this.store || !user) return;
    this.currentUser = user;

    // 1. Immediately establish authenticated session in local store & localStorage
    const isUserAdmin = checkIsAdmin(user, this.store.user);
    const existingCustomName = (this.store.user?.name && this.store.user.name !== 'Mytholis Patron' && !this.store.user.name.startsWith('Patron (')) ? this.store.user.name : null;
    const patronName = existingCustomName || user.displayName || user.email?.split('@')[0] || (user.phoneNumber ? `Patron (${user.phoneNumber})` : 'Mytholis Patron');
    const patronEmail = user.email || (user.phoneNumber ? `${user.phoneNumber}@phone.mytholis.com` : '');
    const existingCustomPhoto = this.store.user?.photoURL || null;
    const patronPhoto = existingCustomPhoto || user.photoURL || null;

    this.store.user.isLoggedIn = true;
    this.store.user.uid = user.uid;
    this.store.user.email = patronEmail;
    this.store.user.phone = user.phoneNumber || this.store.user.phone || '';
    this.store.user.name = patronName;
    this.store.user.photoURL = patronPhoto;
    this.store.user.isAdmin = isUserAdmin;
    this.store.user.role = isUserAdmin ? 'admin' : 'patron';
    this.store.saveLocalStorage('mytholis_user', this.store.user);

    this.store.firebaseUser = {
      uid: user.uid,
      email: patronEmail,
      phone: this.store.user.phone,
      displayName: patronName,
      photoURL: patronPhoto,
      role: isUserAdmin ? 'admin' : 'patron',
      isAdmin: isUserAdmin
    };

    // Immediately notify UI so navbar switches to Avatar + Sovereign Crown
    this.store.notify();
    if (this.app && typeof this.app.updateNavAuth === 'function') {
      this.app.updateNavAuth();
    }

    // 2. Perform background Cloud Firestore synchronization
    this.isSyncing = true;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef).catch(() => null);
      let cloudData = null;

      if (userDocSnap && userDocSnap.exists()) {
        cloudData = userDocSnap.data();

        // Merge cloud profile with store
        if (cloudData.profile) {
          const mergedAddress = cloudData.profile.address || this.store.user.address || '';
          const mergedCity = cloudData.profile.city || this.store.user.city || '';
          const mergedState = cloudData.profile.state || this.store.user.state || '';
          const mergedPincode = cloudData.profile.pincode || this.store.user.pincode || '';
          const mergedName = cloudData.profile.name || existingCustomName || user.displayName || this.store.user.name || 'Mytholis Patron';
          const mergedPhone = user.phoneNumber || cloudData.profile.phone || this.store.user.phone || '';
          const mergedPhoto = cloudData.profile.photoURL || this.store.user.photoURL || user.photoURL || null;

          this.store.user = Object.assign({}, this.store.user, cloudData.profile, {
            name: mergedName,
            email: patronEmail,
            phone: mergedPhone,
            address: mergedAddress,
            city: mergedCity,
            state: mergedState,
            pincode: mergedPincode,
            uid: user.uid,
            photoURL: mergedPhoto,
            isAdmin: isUserAdmin || cloudData.profile.isAdmin === true || cloudData.isAdmin === true,
            role: isUserAdmin || cloudData.profile.role === 'admin' || cloudData.role === 'admin' ? 'admin' : 'patron'
          });
          this.store.saveLocalStorage('mytholis_user', this.store.user);

          // Keep firebaseUser in sync with custom name and portrait
          this.store.firebaseUser = {
            uid: user.uid,
            email: patronEmail,
            phone: mergedPhone,
            displayName: mergedName,
            photoURL: mergedPhoto,
            role: this.store.user.role,
            isAdmin: this.store.user.isAdmin
          };
        }

        // Merge cloud loyalty state with store
        if (cloudData.loyalty) {
          this.store.loyalty = cloudData.loyalty;
          this.store.saveLocalStorage('mytholis_loyalty', cloudData.loyalty);
        }
      } else {
        // First-time cloud registration: create clean initial profile & loyalty
        const initialLoyalty = {
          spendable_mythos: this.store?.globalSettings?.signupBonusMythos || 100,
          legacy_mythos: this.store?.globalSettings?.signupBonusMythos || 100,
          full_bottles_purchased: 0,
          initiation_completed: false,
          codex_unlocked: [],
          trinity_claimed: false,
          pantheon_claimed: false,
          reviewed_scents: [],
          active_reward_codes: [],
          applied_reward_code: null
        };
        const initialProfile = {
          name: patronName,
          email: patronEmail,
          phone: user.phoneNumber || this.store.user.phone || '',
          address: this.store.user.address || '',
          pincode: this.store.user.pincode || '',
          city: this.store.user.city || '',
          state: this.store.user.state || '',
          photoURL: patronPhoto,
          role: isUserAdmin ? 'admin' : 'patron',
          isAdmin: isUserAdmin,
          createdAt: serverTimestamp()
        };

        await setDoc(userDocRef, {
          profile: initialProfile,
          loyalty: initialLoyalty,
          role: isUserAdmin ? 'admin' : 'patron',
          isAdmin: isUserAdmin,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(() => {});

        this.store.loyalty = initialLoyalty;
        this.store.saveLocalStorage('mytholis_loyalty', initialLoyalty);
      }

      // If user qualifies as admin by email whitelist but Firestore doesn't mark it yet, persist it
      if (isUserAdmin && (!cloudData || cloudData.role !== 'admin' || !cloudData.isAdmin)) {
        await setDoc(userDocRef, {
          role: 'admin',
          isAdmin: true,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(() => {});
      }

      // Fetch user's real orders from Firestore orders collection
      try {
        const ordersQ = query(collection(db, "orders"), where("userId", "==", user.uid));
        const ordersSnap = await getDocs(ordersQ);
        const fetchedOrders = [];
        ordersSnap.forEach(d => {
          fetchedOrders.push({ id: d.id, ...d.data() });
        });
        fetchedOrders.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        this.store.user.orders = fetchedOrders;
      } catch (errOrders) {
        console.warn("[Mytholis Firebase] Could not fetch real orders:", errOrders.message);
      }

      this.store.notify();
      if (this.app && typeof this.app.updateNavAuth === 'function') {
        this.app.updateNavAuth();
      }
    } catch (err) {
      console.warn("[Mytholis Firebase] Cloud sync notice (offline or rules in progress):", err.message);
    } finally {
      this.isSyncing = false;
    }
  }

  // Push local changes up to Firestore
  async pushLocalStateToCloud() {
    if (!this.currentUser || this.isSyncing) return;

    try {
      const userDocRef = doc(db, "users", this.currentUser.uid);
      const profileToSave = {
        name: this.store.user.name || this.currentUser.displayName || '',
        email: this.currentUser.email || this.store.user.email || '',
        phone: this.store.user.phone || this.currentUser.phoneNumber || '',
        address: this.store.user.address || '',
        pincode: this.store.user.pincode || '',
        city: this.store.user.city || '',
        state: this.store.user.state || '',
        updatedAt: serverTimestamp()
      };
      if (this.store.user.photoURL || this.currentUser.photoURL) {
        profileToSave.photoURL = this.store.user.photoURL || this.currentUser.photoURL;
      }
      await setDoc(userDocRef, {
        profile: profileToSave,
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
      const docRef = await addDoc(ordersRef, {
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email,
        userName: this.currentUser.displayName || this.store?.user?.name || 'Mytholis Patron',
        ...orderData,
        rewardsCredited: orderData.paymentMethod === 'Prepaid' ? true : false,
        timestamp: serverTimestamp()
      });
      console.log("[Mytholis Firebase] Order recorded in cloud with ID:", docRef.id);
      return docRef.id;
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not record cloud order:", err.message);
      return null;
    }
  }

  /* ==========================================================================
     SOVEREIGN COMMAND ADMIN FIRESTORE METHODS
     ========================================================================== */

  // Fetch comprehensive admin dashboard data
  async fetchAdminDashboardData() {
    const data = {
      orders: [],
      users: [],
      products: [],
      posts: [],
      settings: {}
    };

    try {
      // 1. Orders
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        ordersSnap.forEach(d => {
          data.orders.push({ id: d.id, ...d.data() });
        });
        data.orders.sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.date || a.createdAt || 0).getTime();
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.date || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch orders:", err.message);
      }

      // 2. Users & Patron Enrichment
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach(d => {
          data.users.push({ uid: d.id, ...d.data() });
        });
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch users:", err.message);
      }

      // Cross-reference & enrich Patrons with real order coordinates, shipping addresses, phone numbers, and LTV
      try {
        const cleanDigits = (p) => (p || '').toString().replace(/[^0-9]/g, '');
        const normEmail = (e) => (e || '').toString().trim().toLowerCase();

        // Helper to format any address object or string into a clean printable string
        const formatAddress = (addr, city, state, pin) => {
          if (typeof addr === 'string' && addr.trim()) {
            let res = addr.trim();
            if (city && !res.toLowerCase().includes(city.toLowerCase())) res += `, ${city}`;
            if (state && !res.toLowerCase().includes(state.toLowerCase())) res += `, ${state}`;
            if (pin && !res.includes(pin)) res += ` - ${pin}`;
            return res;
          }
          if (addr && typeof addr === 'object') {
            const parts = [
              addr.address || addr.line1 || addr.street || addr.address1 || '',
              addr.line2 || addr.landmark || addr.address2 || '',
              addr.city || city || '',
              addr.state || state || '',
              addr.pincode || addr.postalCode || addr.zip || pin || ''
            ].map(s => String(s || '').trim()).filter(Boolean);
            if (parts.length) return parts.join(', ');
          }
          const fallbackParts = [city, state, pin].map(s => String(s || '').trim()).filter(Boolean);
          return fallbackParts.length ? fallbackParts.join(', ') : '';
        };

        const enrichedUsers = [];
        const seenUserKeys = new Set();

        data.users.forEach(u => {
          const prof = u.profile || {};
          let uEmail = normEmail(prof.email || u.email);
          let uPhone = cleanDigits(prof.phone || prof.phoneNumber || u.phone || u.phoneNumber || u.mobile || u.contact);
          let uName = prof.name || u.displayName || u.name || '';
          let uAddress = prof.address || u.address || u.street || '';
          let uCity = prof.city || u.city || '';
          let uState = prof.state || u.state || '';
          let uPincode = prof.pincode || prof.postalCode || u.pincode || u.postalCode || '';

          // Find all orders linked to this registered user
          const userOrders = data.orders.filter(ord => {
            if (u.uid && (ord.userId === u.uid || ord.uid === u.uid || ord.customer?.uid === u.uid)) return true;
            const ordEmail = normEmail(ord.userEmail || ord.email || ord.customer?.email || ord.shipping?.email || ord.billingAddress?.email);
            if (uEmail && ordEmail && ordEmail === uEmail) return true;
            const ordPhone = cleanDigits(ord.phone || ord.customerPhone || ord.shippingPhone || ord.customer?.phone || ord.shipping?.phone || ord.shippingAddress?.phone);
            if (uPhone && ordPhone && (ordPhone === uPhone || ordPhone.endsWith(uPhone) || uPhone.endsWith(ordPhone))) return true;
            return false;
          });

          // Extract best available coordinates from orders if missing on user profile
          userOrders.forEach(ord => {
            if (!uPhone) {
              const ordPhone = cleanDigits(ord.phone || ord.customerPhone || ord.shippingPhone || ord.customer?.phone || ord.shipping?.phone || ord.shippingAddress?.phone);
              if (ordPhone) uPhone = ordPhone;
            }
            if (!uName || uName === 'Patron') {
              const ordName = ord.userName || ord.customerName || ord.name || ord.customer?.name || ord.shipping?.name;
              if (ordName && ordName !== 'Patron') uName = ordName;
            }
            if (!uAddress) {
              const rawAddr = ord.address || ord.shippingAddress || ord.shipping?.address || ord.customerAddress || ord.customer?.address || ord.billingAddress;
              if (rawAddr) {
                uAddress = typeof rawAddr === 'object' ? (rawAddr.address || rawAddr.line1 || rawAddr.street || '') : rawAddr;
              }
            }
            if (!uCity) {
              uCity = ord.city || ord.shippingAddress?.city || ord.shipping?.city || ord.customer?.city || '';
            }
            if (!uState) {
              uState = ord.state || ord.shippingAddress?.state || ord.shipping?.state || ord.customer?.state || '';
            }
            if (!uPincode) {
              uPincode = ord.pincode || ord.postalCode || ord.shippingAddress?.pincode || ord.shippingAddress?.postalCode || ord.shipping?.pincode || ord.customer?.pincode || '';
            }
          });

          const formattedFullAddress = formatAddress(uAddress, uCity, uState, uPincode);

          // Calculate commerce metrics
          const lifetimeSpend = userOrders.reduce((sum, ord) => sum + Number(ord.finalPayable || ord.total || ord.subtotal || 0), 0);
          let fullFlaconsOrdered = 0;
          userOrders.forEach(ord => {
            const items = Array.isArray(ord.items) ? ord.items : [];
            items.forEach(it => {
              if (Number(it.size || 50) >= 50) {
                fullFlaconsOrdered += Number(it.quantity || 1);
              }
            });
          });

          // Sync back into user structure
          u.profile = {
            ...prof,
            name: uName || prof.name || 'Patron',
            email: uEmail || prof.email || 'N/A',
            phone: uPhone || prof.phone || '',
            address: uAddress || prof.address || '',
            city: uCity || prof.city || '',
            state: uState || prof.state || '',
            pincode: uPincode || prof.pincode || '',
            fullAddress: formattedFullAddress,
            role: prof.role || u.role || 'patron',
            isAdmin: Boolean(prof.isAdmin || u.isAdmin || u.role === 'admin')
          };
          u.phone = uPhone;
          u.address = uAddress;
          u.city = uCity;
          u.state = uState;
          u.pincode = uPincode;
          u.fullAddress = formattedFullAddress;
          u.ordersCount = userOrders.length;
          u.lifetimeSpend = lifetimeSpend;
          u.orders = userOrders;
          u.fullFlaconsOrdered = fullFlaconsOrdered;
          if (userOrders.length > 0) {
            u.lastOrder = userOrders[0];
          }

          if (u.uid) seenUserKeys.add(u.uid);
          if (uEmail) seenUserKeys.add(uEmail);
          if (uPhone) seenUserKeys.add(uPhone);

          enrichedUsers.push(u);
        });

        // Also detect guest orders / patrons who ordered but don't have a users doc yet
        const guestOrdersByCustomer = new Map();
        data.orders.forEach(ord => {
          const ordEmail = normEmail(ord.userEmail || ord.email || ord.customer?.email || ord.shipping?.email);
          const ordPhone = cleanDigits(ord.phone || ord.customerPhone || ord.shippingPhone || ord.customer?.phone || ord.shipping?.phone || ord.shippingAddress?.phone);
          const ordUid = ord.userId;

          const isKnown = (ordUid && seenUserKeys.has(ordUid)) || (ordEmail && seenUserKeys.has(ordEmail)) || (ordPhone && seenUserKeys.has(ordPhone));
          if (!isKnown) {
            const groupKey = ordEmail || ordPhone || ord.id;
            if (!guestOrdersByCustomer.has(groupKey)) {
              guestOrdersByCustomer.set(groupKey, []);
            }
            guestOrdersByCustomer.get(groupKey).push(ord);
          }
        });

        guestOrdersByCustomer.forEach((ordList, key) => {
          const latestOrd = ordList[0];
          const ordName = latestOrd.userName || latestOrd.customerName || latestOrd.name || latestOrd.customer?.name || latestOrd.shipping?.name || 'Patron';
          const ordEmail = normEmail(latestOrd.userEmail || latestOrd.email || latestOrd.customer?.email || latestOrd.shipping?.email) || 'N/A';
          const ordPhone = cleanDigits(latestOrd.phone || latestOrd.customerPhone || latestOrd.shippingPhone || latestOrd.customer?.phone || latestOrd.shipping?.phone || latestOrd.shippingAddress?.phone);
          const rawAddr = latestOrd.address || latestOrd.shippingAddress || latestOrd.shipping?.address || latestOrd.customerAddress || latestOrd.billingAddress;
          const ordCity = latestOrd.city || latestOrd.shippingAddress?.city || latestOrd.shipping?.city || '';
          const ordState = latestOrd.state || latestOrd.shippingAddress?.state || latestOrd.shipping?.state || '';
          const ordPin = latestOrd.pincode || latestOrd.postalCode || latestOrd.shippingAddress?.pincode || latestOrd.shippingAddress?.postalCode || '';
          const fullAddr = formatAddress(rawAddr, ordCity, ordState, ordPin);
          const spend = ordList.reduce((sum, o) => sum + Number(o.finalPayable || o.total || o.subtotal || 0), 0);

          let fullFlacons = 0;
          ordList.forEach(o => {
            (Array.isArray(o.items) ? o.items : []).forEach(it => {
              if (Number(it.size || 50) >= 50) fullFlacons += Number(it.quantity || 1);
            });
          });

          enrichedUsers.push({
            uid: latestOrd.userId || `guest_${ordPhone || ordEmail.replace(/[^a-z0-9]/g, '_') || latestOrd.id}`,
            isGuestOrder: true,
            profile: {
              name: ordName,
              email: ordEmail,
              phone: ordPhone,
              address: typeof rawAddr === 'string' ? rawAddr : (rawAddr?.address || rawAddr?.line1 || ''),
              city: ordCity,
              state: ordState,
              pincode: ordPin,
              fullAddress: fullAddr,
              role: 'patron',
              isAdmin: false
            },
            loyalty: {
              spendable_mythos: Math.round(spend * 0.03),
              legacy_mythos: Math.round(spend * 0.03),
              full_bottles_purchased: fullFlacons
            },
            phone: ordPhone,
            address: typeof rawAddr === 'string' ? rawAddr : (rawAddr?.address || rawAddr?.line1 || ''),
            city: ordCity,
            state: ordState,
            pincode: ordPin,
            fullAddress: fullAddr,
            ordersCount: ordList.length,
            lifetimeSpend: spend,
            orders: ordList,
            fullFlaconsOrdered: fullFlacons,
            lastOrder: latestOrd
          });
        });

        data.users = enrichedUsers;
      } catch (enrichErr) {
        console.warn("[Mytholis Admin] Error enriching patron data:", enrichErr);
      }

      // 3. Products
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        prodSnap.forEach(d => {
          data.products.push({ id: d.id, ...d.data() });
        });
        if (data.products.length > 0 && this.store) {
          this.store.setProducts(data.products);
        }
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch products:", err.message);
      }

      // 4. Posts / Editorial
      try {
        const postsSnap = await getDocs(collection(db, "posts"));
        postsSnap.forEach(d => {
          data.posts.push({ id: d.id, ...d.data() });
        });
        data.posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch posts:", err.message);
      }

      // 5. Global Settings
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          data.settings = settingsSnap.data();
          if (this.store) {
            this.store.setGlobalSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch settings:", err.message);
      }

      return { success: true, data };
    } catch (err) {
      console.error("[Mytholis Admin] fetchAdminDashboardData error:", err);
      return { success: false, error: err.message };
    }
  }

  // 1-Click Catalog Seeder: Uploads local catalog to Firestore
  async seedProductsToFirestore(catalogList) {
    if (!Array.isArray(catalogList) || !catalogList.length) {
      return { success: false, error: "Empty catalog list provided." };
    }

    try {
      let seededCount = 0;
      for (const prod of catalogList) {
        const prodRef = doc(db, "products", prod.id);
        const existing = await getDoc(prodRef);
        if (!existing.exists()) {
          await setDoc(prodRef, {
            ...prod,
            sizes: prod.sizes || [
              { ml: 8, price: 899 },
              { ml: 50, price: 3999 },
              { ml: 100, price: 5999 }
            ],
            stock: prod.stock || 50,
            inStock: prod.inStock !== false,
            isFeatured: prod.isFeatured !== false,
            concentration: prod.concentration || "Extrait de Parfum (40% Concentration)",
            batchCode: prod.batchCode || `MYTH-2026-${prod.id.slice(0, 3).toUpperCase()}`,
            macerationDate: prod.macerationDate || "January 2026",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          seededCount++;
        } else {
          // Sync sizes and metadata to existing Firestore product if missing or incomplete
          const existingData = existing.data() || {};
          const updates = {};

          if (prod.id === 'mytholis-discovery-set') {
            updates.name = "Sixth Sense";
            updates.subtitle = "Sixth Sense";
            updates.collection = "Sixth Sense";
            updates.concentration = prod.concentration;
            updates.notes = prod.notes;
            updates.sizes = prod.sizes || [{ ml: 48, price: 3999 }];
            updates.tagline = prod.tagline;
            updates.accords = prod.accords;
            updates.description = prod.description;
          } else {
            if (prod.name && prod.name.includes('<br>')) {
              updates.name = prod.name;
            }
            if (existingData.sizes && existingData.sizes.some(s => s.ml === 8)) {
              updates.sizes = existingData.sizes.filter(s => s.ml !== 8);
            } else if (!existingData.sizes || !existingData.sizes.length || !existingData.sizes.some(s => s.ml === 50)) {
              updates.sizes = prod.sizes || [
                { ml: 50, price: 3999 },
                { ml: 100, price: 5999 }
              ];
            }
          }

          if (Object.keys(updates).length > 0) {
            await setDoc(prodRef, updates, { merge: true });
            seededCount++;
          }
        }
      }

      // Re-fetch products into store
      await this.fetchProductsFromFirestore();
      return { success: true, count: seededCount };
    } catch (err) {
      console.error("[Mytholis Admin] Error seeding catalog:", err);
      return { success: false, error: err.message };
    }
  }

  // Product CRUD
  async saveProduct(prodData) {
    if (!prodData || !prodData.id) {
      return { success: false, error: "Product ID/slug is required." };
    }

    try {
      const prodRef = doc(db, "products", prodData.id);
      await setDoc(prodRef, {
        ...prodData,
        price: Number(prodData.price) || 0,
        stock: Number(prodData.stock) || 0,
        inStock: Boolean(prodData.inStock),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await this.fetchProductsFromFirestore();
      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] saveProduct error:", err);
      return { success: false, error: err.message };
    }
  }

  async deleteProduct(productId) {
    try {
      await deleteDoc(doc(db, "products", productId));
      await this.fetchProductsFromFirestore();
      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] deleteProduct error:", err);
      return { success: false, error: err.message };
    }
  }

  async updateProductQuick(productId, updates) {
    try {
      await updateDoc(doc(db, "products", productId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      await this.fetchProductsFromFirestore();
      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] updateProductQuick error:", err);
      return { success: false, error: err.message };
    }
  }

  async fetchProductsFromFirestore() {
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = [];
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() };
        // Auto-heal discovery set / Sixth Sense if stale data exists in Firestore
        if (item.id === 'mytholis-discovery-set') {
          item.name = "Sixth Sense";
          item.subtitle = "Sixth Sense";
          item.sizes = [{ ml: 48, price: 3999 }];
          if (item.notes) {
            ['top', 'heart', 'base'].forEach(tier => {
              if (Array.isArray(item.notes[tier])) {
                item.notes[tier] = item.notes[tier].map(s => typeof s === 'string' ? s.replace(/10ml/g, '8ml') : s);
              }
            });
          }
        } else {
          // Format product name as: NAME <br><span class="product-concentration-sub">Extrait de Parfum</span>
          if (item.name) {
            const rawBase = item.name.replace(/<[^>]*>/g, '').replace(/Extrait\s*de\s*Parfum/gi, '').trim();
            item.name = `${rawBase} <br><span class="product-concentration-sub">Extrait de Parfum</span>`;
          }
          if (Array.isArray(item.sizes)) {
            // 8ml is not for sale individually, only 50ml and 100ml
            item.sizes = item.sizes.filter(s => s.ml !== 8);
          }
        }
        list.push(item);
      });
      if (list.length && this.store) {
        this.store.setProducts(list);
      }
      return list;
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not fetch products:", err.message);
      return [];
    }
  }

  // Order & COD Command
  // Update Live Order Status & Tracking (supports both doc ID and friendly orderId)
  async updateOrderStatus(orderId, updateFields = {}) {
    if (!orderId) return { success: false, error: "Missing order ID" };

    try {
      // 1. First try direct document lookup by doc ID
      let orderRef = doc(db, "orders", orderId);
      let orderSnap = await getDoc(orderRef).catch(() => null);

      // 2. If not found by doc ID, search by orderId (e.g. "MYTH-53567")
      if (!orderSnap || !orderSnap.exists()) {
        const q1 = query(collection(db, "orders"), where("orderId", "==", orderId), limit(1));
        const qSnap1 = await getDocs(q1).catch(() => null);
        if (qSnap1 && !qSnap1.empty) {
          orderSnap = qSnap1.docs[0];
          orderRef = orderSnap.ref;
        } else {
          // Fallback: search by id field inside document data
          const q2 = query(collection(db, "orders"), where("id", "==", orderId), limit(1));
          const qSnap2 = await getDocs(q2).catch(() => null);
          if (qSnap2 && !qSnap2.empty) {
            orderSnap = qSnap2.docs[0];
            orderRef = orderSnap.ref;
          }
        }
      }

      if (!orderSnap || !orderSnap.exists()) {
        return { success: false, error: `No document found in cloud database for: ${orderId}` };
      }

      await updateDoc(orderRef, {
        ...updateFields,
        updatedAt: serverTimestamp()
      });

      // If marked Delivered and Paid, check if COD loyalty needs settlement
      const orderData = { ...orderSnap.data(), ...updateFields };
      const isDelivered = (orderData.status || '').toLowerCase() === 'delivered';
      const isPaid = (orderData.paymentStatus || '').toLowerCase() === 'paid';
      
      if (isDelivered && isPaid && !orderData.rewardsCredited) {
        await this.settleCodOrderLoyalty(orderRef.id, orderData);
      }

      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] updateOrderStatus error:", err);
      return { success: false, error: err.message };
    }
  }

  // Save Shiprocket Shipping & Rebranded Label Metadata
  async saveShiprocketOrderDetails(orderId, details = {}) {
    return this.updateOrderStatus(orderId, {
      shiprocketOrderId: details.shiprocketOrderId || details.order_id || '',
      shipmentId: details.shipmentId || details.shipment_id || '',
      awbCode: details.awbCode || details.awb_code || details.trackingNumber || '',
      trackingNumber: details.awbCode || details.awb_code || details.trackingNumber || '',
      courierName: details.courierName || details.courier_name || 'BlueDart Express',
      labelUrl: details.labelUrl || details.label_url || '',
      rebrandedLabelUrl: details.rebrandedLabelUrl || '',
      rebrandedAt: details.rebrandedAt || new Date().toISOString(),
      company_name: 'MYTHOLIS LUXURY PARFUMS',
      reseller_name: 'MYTHOLIS LUXURY PARFUMS'
    });
  }

  // Settle COD order rewards with duplicate protection
  async settleCodOrderLoyalty(orderId, orderData = null) {
    try {
      let orderRef = doc(db, "orders", orderId);
      let data = orderData;
      if (!data) {
        let snap = await getDoc(orderRef).catch(() => null);
        if (!snap || !snap.exists()) {
          const q = query(collection(db, "orders"), where("orderId", "==", orderId), limit(1));
          const qSnap = await getDocs(q).catch(() => null);
          if (qSnap && !qSnap.empty) {
            snap = qSnap.docs[0];
            orderRef = snap.ref;
          }
        }
        if (!snap || !snap.exists()) return { success: false, error: "Order not found" };
        data = snap.data();
      }

      if (data.rewardsCredited) {
        return { success: true, message: "Rewards already credited." };
      }

      const uid = data.userId;
      if (!uid) {
        return { success: false, error: "No user UID associated with this order." };
      }

      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        return { success: false, error: "Patron account does not exist." };
      }

      const userDocData = userSnap.data();
      const currentLoyalty = userDocData.loyalty || {
        spendable_mythos: 0,
        legacy_mythos: 0,
        full_bottles_purchased: 0
      };

      // Calculate rewards
      const finalAmount = Number(data.finalPayable || data.total || data.subtotal || 0);
      const earnPct = this.store?.globalSettings?.mythosEarnPct || 3;
      const spendEarned = Math.floor(finalAmount / 100) * earnPct;

      let bottleCount = 0;
      let bottleBonus = 0;
      if (Array.isArray(data.items)) {
        data.items.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const sz = Number(item.size);
          if (sz === 50) {
            bottleCount += qty;
            bottleBonus += (300 * qty);
          } else if (sz === 100) {
            bottleCount += qty;
            bottleBonus += (500 * qty);
          }
        });
      }

      const legacyEarned = spendEarned + bottleBonus;

      const updatedLoyalty = {
        ...currentLoyalty,
        spendable_mythos: (Number(currentLoyalty.spendable_mythos) || 0) + spendEarned,
        legacy_mythos: (Number(currentLoyalty.legacy_mythos) || 0) + legacyEarned,
        full_bottles_purchased: (Number(currentLoyalty.full_bottles_purchased) || 0) + bottleCount
      };

      // Write updated loyalty to patron
      await setDoc(userDocRef, {
        loyalty: updatedLoyalty,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Mark order with rewardsCredited flag to prevent any double crediting
      await updateDoc(orderRef, {
        rewardsCredited: true,
        rewardsCreditedAt: serverTimestamp(),
        rewardsGranted: {
          spendEarned,
          legacyEarned,
          bottleCount
        }
      });

      console.log(`[Mytholis Admin] Succeeded crediting ${spendEarned}M to patron ${uid} for order ${orderId}`);
      return { 
        success: true, 
        spendEarned, 
        legacyEarned, 
        bottleCount 
      };
    } catch (err) {
      console.error("[Mytholis Admin] settleCodOrderLoyalty error:", err);
      return { success: false, error: err.message };
    }
  }

  // Editorial / Lore CRUD
  async savePost(postData) {
    if (!postData || !postData.title) {
      return { success: false, error: "Post title is required." };
    }

    try {
      const postId = postData.id || `post_${Date.now()}`;
      const postRef = doc(db, "posts", postId);
      await setDoc(postRef, {
        ...postData,
        id: postId,
        isPublished: Boolean(postData.isPublished),
        updatedAt: serverTimestamp(),
        createdAt: postData.createdAt || new Date().toISOString()
      }, { merge: true });

      return { success: true, id: postId };
    } catch (err) {
      console.error("[Mytholis Admin] savePost error:", err);
      return { success: false, error: err.message };
    }
  }

  async deletePost(postId) {
    try {
      await deleteDoc(doc(db, "posts", postId));
      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] deletePost error:", err);
      return { success: false, error: err.message };
    }
  }

  async fetchPublishedPosts() {
    try {
      const q = query(collection(db, "posts"), where("isPublished", "==", true));
      const snap = await getDocs(q);
      const posts = [];
      snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
      posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return posts;
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not fetch published posts:", err.message);
      return [];
    }
  }

  // Patron Management
  async adjustPatronMythos(uid, deltaSpendable, reason = '') {
    if (!uid) return { success: false, error: "Missing Patron UID." };

    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        return { success: false, error: "Patron document not found." };
      }

      const userData = userSnap.data();
      const currentLoyalty = userData.loyalty || { spendable_mythos: 0, legacy_mythos: 0 };
      const currentSpendable = Number(currentLoyalty.spendable_mythos) || 0;
      const newSpendable = Math.max(0, currentSpendable + Number(deltaSpendable));

      const auditEntry = {
        action: deltaSpendable >= 0 ? 'GRANT' : 'DEDUCT',
        delta: Number(deltaSpendable),
        reason: reason || 'Sovereign Admin adjustment',
        timestamp: new Date().toISOString(),
        adminUid: this.currentUser?.uid || 'sovereign_command'
      };

      const auditList = Array.isArray(currentLoyalty.audit_log) ? [...currentLoyalty.audit_log, auditEntry] : [auditEntry];

      await setDoc(userDocRef, {
        loyalty: {
          ...currentLoyalty,
          spendable_mythos: newSpendable,
          audit_log: auditList
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true, newBalance: newSpendable };
    } catch (err) {
      console.error("[Mytholis Admin] adjustPatronMythos error:", err);
      return { success: false, error: err.message };
    }
  }

  async overridePatronTier(uid, levelNum, fullBottles) {
    if (!uid) return { success: false, error: "Missing Patron UID." };

    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return { success: false, error: "Patron document not found in Firestore." };

      const userData = userSnap.data() || {};
      const currentLoyalty = userData.loyalty || {};
      const currentProfile = userData.profile || {};
      const newBottles = fullBottles !== undefined ? Number(fullBottles) : Number(currentLoyalty.full_bottles_purchased || 0);
      const targetLevel = levelNum ? Number(levelNum) : 1;

      const tiers = (this.store && this.store.LOYALTY_TIERS) || [
        { level: 1, name: "The Observer" },
        { level: 2, name: "The Curator" },
        { level: 3, name: "The Collector" },
        { level: 4, name: "The Archivist" },
        { level: 5, name: "The Patron" }
      ];
      const tierObj = tiers.find(t => t.level === targetLevel) || tiers[0];
      const tierLabel = `Level ${tierObj.level}: ${tierObj.name}`;

      await setDoc(userDocRef, {
        profile: {
          ...currentProfile,
          tier: tierLabel
        },
        loyalty: {
          ...currentLoyalty,
          full_bottles_purchased: newBottles,
          manual_tier_override: targetLevel
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      // If updating currently logged in patron, also sync locally
      if (this.currentUser && this.currentUser.uid === uid && this.store) {
        if (this.store.loyalty) {
          this.store.loyalty.full_bottles_purchased = newBottles;
          this.store.loyalty.manual_tier_override = targetLevel;
          this.store.saveLocalStorage('mytholis_loyalty', this.store.loyalty);
        }
        if (this.store.user) {
          this.store.user.tier = tierLabel;
          this.store.saveLocalStorage('mytholis_user', this.store.user);
        }
        this.store.notify();
      }

      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] overridePatronTier error:", err);
      return { success: false, error: err.message };
    }
  }

  async togglePatronAdmin(uid, makeAdmin) {
    if (!uid) return { success: false, error: "Missing Patron UID." };

    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        role: makeAdmin ? 'admin' : 'patron',
        isAdmin: Boolean(makeAdmin),
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] togglePatronAdmin error:", err);
      return { success: false, error: err.message };
    }
  }

  // Global Settings CRUD
  async saveGlobalSettings(settingsData) {
    // 1. Immediately persist to client store & localStorage
    if (this.store) {
      this.store.setGlobalSettings(settingsData);
    }

    try {
      const settingsRef = doc(db, "settings", "global");
      await setDoc(settingsRef, {
        ...settingsData,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(e => console.warn("[Mytholis Firebase] settings/global write notice:", e.message));

      // Also persist individual promo codes into reward_codes collection
      if (Array.isArray(settingsData.promoCodes)) {
        for (const pc of settingsData.promoCodes) {
          if (pc.code) {
            const codeRef = doc(db, "reward_codes", pc.code.toUpperCase());
            await setDoc(codeRef, {
              code: pc.code.toUpperCase(),
              type: pc.discountType || 'percent',
              amount: Number(pc.value) || 0,
              minOrder: Number(pc.minOrder) || 0,
              active: pc.active !== false,
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
        }
      }

      return { success: true };
    } catch (err) {
      console.warn("[Mytholis Admin] saveGlobalSettings cloud sync notice:", err.message);
      // Still return success: true because store and localStorage are updated!
      return { success: true, localOnly: true, warning: err.message };
    }
  }

  async fetchGlobalSettings() {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists() && this.store) {
        this.store.setGlobalSettings(snap.data());
        return snap.data();
      }
      return null;
    } catch (err) {
      console.warn("[Mytholis Firebase] Could not fetch global settings:", err.message);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();
export { db, auth, doc, getDoc, setDoc, getDocs, updateDoc, deleteDoc, collection };

if (typeof window !== 'undefined') {
  window.firebaseService = firebaseService;
  window.firebaseDb = db;
  window.ADMIN_EMAILS = ADMIN_EMAILS;
  window.checkIsAdmin = checkIsAdmin;
}
