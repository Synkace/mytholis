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
  if (email && ADMIN_EMAILS.includes(email)) return true;
  if (profile?.isAdmin === true || profile?.role === 'admin') return true;
  return false;
}

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

    // Boot-time cloud hydrate for products and settings
    this.fetchGlobalSettings().catch(() => {});
    this.fetchProductsFromFirestore().catch(() => {});

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        console.log("[Mytholis Firebase] Client authenticated:", user.email || user.uid);
        await this.syncUserDataOnLogin(user);
      } else {
        console.log("[Mytholis Firebase] Client signed out.");
        if (this.store) {
          this.store.firebaseUser = null;
          this.store.user.isAdmin = false;
          this.store.user.role = 'patron';
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
      let cloudData = null;

      if (userDocSnap.exists()) {
        cloudData = userDocSnap.data();

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
          name: user.displayName || this.store.user.name || 'Mytholis Patron',
          email: user.email,
          phone: this.store.user.phone || '',
          address: this.store.user.address || '',
          pincode: this.store.user.pincode || '',
          city: this.store.user.city || '',
          role: 'patron',
          isAdmin: false,
          createdAt: serverTimestamp()
        };

        await setDoc(userDocRef, {
          profile: initialProfile,
          loyalty: initialLoyalty,
          role: 'patron',
          isAdmin: false,
          updatedAt: serverTimestamp()
        }, { merge: true });

        this.store.loyalty = initialLoyalty;
        this.store.saveLocalStorage('mytholis_loyalty', initialLoyalty);
      }

      // Check Admin Privileges
      const isUserAdmin = checkIsAdmin(user, cloudData?.profile || cloudData);
      this.store.user.isAdmin = isUserAdmin;
      this.store.user.role = isUserAdmin ? 'admin' : (cloudData?.role || 'patron');

      // If user qualifies as admin by email whitelist but Firestore doesn't mark it yet, persist it
      if (isUserAdmin && (!cloudData || cloudData.role !== 'admin' || !cloudData.isAdmin)) {
        await setDoc(userDocRef, {
          role: 'admin',
          isAdmin: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
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

      this.store.user.isLoggedIn = true;
      this.store.user.email = user.email;
      if (user.displayName && !this.store.user.name) this.store.user.name = user.displayName;
      this.store.saveLocalStorage('mytholis_user', this.store.user);

      this.store.firebaseUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || this.store.user.name,
        photoURL: user.photoURL,
        role: this.store.user.role,
        isAdmin: this.store.user.isAdmin
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

      // 2. Users
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach(d => {
          data.users.push({ uid: d.id, ...d.data() });
        });
      } catch (err) {
        console.warn("[Mytholis Admin] Could not fetch users:", err.message);
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
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
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
  async updateOrderStatus(orderId, updateFields = {}) {
    if (!orderId) return { success: false, error: "Missing order ID" };

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        ...updateFields,
        updatedAt: serverTimestamp()
      });

      // If marked Delivered and Paid, check if COD loyalty needs settlement
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const isDelivered = (orderData.status || '').toLowerCase() === 'delivered';
        const isPaid = (orderData.paymentStatus || '').toLowerCase() === 'paid';
        
        if (isDelivered && isPaid && !orderData.rewardsCredited) {
          await this.settleCodOrderLoyalty(orderId, orderData);
        }
      }

      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] updateOrderStatus error:", err);
      return { success: false, error: err.message };
    }
  }

  // Settle COD order rewards with duplicate protection
  async settleCodOrderLoyalty(orderId, orderData = null) {
    try {
      const orderRef = doc(db, "orders", orderId);
      let data = orderData;
      if (!data) {
        const snap = await getDoc(orderRef);
        if (!snap.exists()) return { success: false, error: "Order not found" };
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
      if (!userSnap.exists()) return { success: false, error: "Patron not found" };

      const currentLoyalty = userSnap.data().loyalty || {};
      const newBottles = fullBottles !== undefined ? Number(fullBottles) : currentLoyalty.full_bottles_purchased;

      await setDoc(userDocRef, {
        loyalty: {
          ...currentLoyalty,
          full_bottles_purchased: newBottles,
          manual_tier_override: levelNum ? Number(levelNum) : null
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

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
    try {
      const settingsRef = doc(db, "settings", "global");
      await setDoc(settingsRef, {
        ...settingsData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (this.store) {
        this.store.setGlobalSettings(settingsData);
      }

      return { success: true };
    } catch (err) {
      console.error("[Mytholis Admin] saveGlobalSettings error:", err);
      return { success: false, error: err.message };
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
