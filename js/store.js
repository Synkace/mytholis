/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - STORE & STATE MANAGEMENT
   Manages Multi-Currency, Cart, Wishlist, User Account Session, and Routing.
   ========================================================================== */

const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1.0, name: 'INR (₹)', flag: 'INR' },
  USD: { symbol: '$', rate: 0.0116, name: 'USD ($)', flag: 'USD' },
  GBP: { symbol: '£', rate: 0.0092, name: 'GBP (£)', flag: 'GBP' },
  AED: { symbol: 'AED ', rate: 0.0425, name: 'AED (د.إ)', flag: 'AED' },
  CNY: { symbol: '¥', rate: 0.084, name: 'CNY (¥)', flag: 'CNY' },
  RUB: { symbol: '₽', rate: 1.06, name: 'RUB (₽)', flag: 'RUB' }
};

/* ==========================================================================
   THE CIRCLE OF LEGENDS - PHASE 1 ARCHITECTURE DEFINITIONS
   ========================================================================== */

const LOYALTY_TIERS = [
  {
    level: 1,
    name: "The Observer",
    tagline: "Initiate of the Outer Court",
    minLegacy: 0,
    minBottles: 0,
    multiplier: 1, // 1x = 3% return
    returnPct: "3%",
    cashbackPct: 3,
    shipping: "Free ship ₹3,000+",
    freeShippingMin: 3000,
    birthday: "30% Off 1 Item with purchase",
    birthdayPerk: "30% Off 1 Item with purchase",
    earlyAccess: "Standard Release",
    roman: "I"
  },
  {
    level: 2,
    name: "The Curator",
    tagline: "Keeper of the First Seal",
    minLegacy: 500,
    minBottles: 1,
    multiplier: 2, // 2x = 6% return
    returnPct: "6%",
    cashbackPct: 6,
    shipping: "Free ship ₹999+",
    freeShippingMin: 999,
    birthday: "50% Off 1 Item max ₹4,000",
    birthdayPerk: "50% Off 1 Item max ₹4,000",
    earlyAccess: "1-Day Early Access",
    roman: "II"
  },
  {
    level: 3,
    name: "The Collector",
    tagline: "Guardian of the Resonant Vault",
    minLegacy: 2500,
    minBottles: 3,
    multiplier: 3, // 3x = 9% return
    returnPct: "9%",
    cashbackPct: 9,
    shipping: "Free ship ₹999+",
    freeShippingMin: 999,
    birthday: "Free 15ml Bottle + 400M with order",
    birthdayPerk: "Free 15ml Bottle + 400M with order",
    earlyAccess: "3-Day Early Access",
    roman: "III"
  },
  {
    level: 4,
    name: "The Archivist",
    tagline: "Master of the Scent Codex",
    minLegacy: 8000,
    minBottles: 6,
    multiplier: 4, // 4x = 12% return
    returnPct: "12%",
    cashbackPct: 12,
    shipping: "Free Express Shipping",
    freeShippingMin: 0,
    birthday: "Free 50ml Bottle + 500M with order",
    birthdayPerk: "Free 50ml Bottle + 500M with order",
    earlyAccess: "1-Week Early Access",
    roman: "IV"
  },
  {
    level: 5,
    name: "The Patron",
    tagline: "High Sovereign of Mythos",
    minLegacy: 20000,
    minBottles: 12,
    multiplier: 5, // 5x = 15% return
    returnPct: "15%",
    cashbackPct: 15,
    shipping: "Free Priority Armored Shipping",
    freeShippingMin: 0,
    birthday: "Free 100ml Bottle + 750M with order",
    birthdayPerk: "Free 100ml Bottle + 750M with order",
    earlyAccess: "1-Month Private Reserve Access",
    roman: "V"
  }
];

const LOYALTY_REWARDS = [
  {
    id: "DISC_200",
    title: "₹200 Off Voucher",
    desc: "Redeemable on orders of ₹1,500 or more.",
    minLevel: 1,
    cost: 200,
    type: "discount",
    amount: 200,
    minOrder: 1500,
    badge: "Concession"
  },
  {
    id: "DISC_400",
    title: "₹400 Off Voucher",
    desc: "Redeemable on orders of ₹1,500 or more.",
    minLevel: 1,
    cost: 400,
    type: "discount",
    amount: 400,
    minOrder: 1500,
    badge: "Concession"
  },
  {
    id: "FREE_8ML",
    title: "Free 8ml Deluxe Travel Spray",
    desc: "Ships complimentary with your next flacon acquisition.",
    minLevel: 2,
    cost: 500,
    type: "gift",
    giftItem: "8ml Deluxe Travel Atomizer",
    badge: "Complimentary"
  },
  {
    id: "DISC_800",
    title: "₹800 Off Voucher",
    desc: "Elite concession credit across the full house catalog.",
    minLevel: 3,
    cost: 800,
    type: "discount",
    amount: 800,
    minOrder: 0,
    badge: "Concession"
  },
  {
    id: "FREE_15ML",
    title: "Exclusive 15ml Vault Flacon",
    desc: "Handcrafted miniature flacon with gold seal wax cap.",
    minLevel: 3,
    cost: 1100,
    type: "gift",
    giftItem: "15ml Vault Flacon Miniature",
    badge: "Complimentary"
  },
  {
    id: "DISC_2500",
    title: "₹2,500 Off Voucher",
    desc: "Archivist reserve concession on major acquisitions.",
    minLevel: 4,
    cost: 2500,
    type: "discount",
    amount: 2500,
    minOrder: 0,
    badge: "Concession"
  },
  {
    id: "FREE_50ML",
    title: "Free 50ml Extrait Bottle",
    desc: "Sovereign tribute: Any full 50ml flacon of your choice.",
    minLevel: 5,
    cost: 3500,
    type: "gift",
    giftItem: "Full 50ml Signature Extrait",
    badge: "Complimentary Flacon"
  },
  {
    id: "FREE_100ML",
    title: "Free 100ml Extrait Bottle",
    desc: "High Sovereign tribute: Any full 100ml Masterpiece flacon.",
    minLevel: 5,
    cost: 5000,
    type: "gift",
    giftItem: "Full 100ml Masterpiece Extrait",
    badge: "Complimentary Flacon"
  }
];

const CORE_SCENT_IDS = ['king-scar', 'petralux', 'oud-rion', 'spark', 'wood-sera', 'ash'];

class MytholisStore {
  constructor() {
    let savedCurrency = this.loadLocalStorage('mytholis_currency', 'INR');
    if (!CURRENCY_CONFIG[savedCurrency]) {
      savedCurrency = 'INR';
    }
    this.currency = savedCurrency;
    this.cart = this.loadLocalStorage('mytholis_cart', []);
    this.wishlist = this.loadLocalStorage('mytholis_wishlist', []);
    
    // Fresh guest initial loyalty: The Circle of Legends (clean slate)
    const defaultLoyalty = {
      spendable_mythos: 0,
      legacy_mythos: 0,
      full_bottles_purchased: 0,
      initiation_completed: false,
      codex_unlocked: [],
      trinity_claimed: false,
      pantheon_claimed: false,
      reviewed_scents: [],
      active_reward_codes: [],
      applied_reward_code: null
    };

    const loadedLoyalty = this.loadLocalStorage('mytholis_loyalty', defaultLoyalty);
    this.loyalty = Object.assign({}, defaultLoyalty, loadedLoyalty);
    if (!Array.isArray(this.loyalty.codex_unlocked)) this.loyalty.codex_unlocked = [];
    if (!Array.isArray(this.loyalty.active_reward_codes)) this.loyalty.active_reward_codes = [];
    if (!Array.isArray(this.loyalty.reviewed_scents)) this.loyalty.reviewed_scents = [];
    if (typeof this.loyalty.spendable_mythos !== 'number') this.loyalty.spendable_mythos = 0;
    if (typeof this.loyalty.legacy_mythos !== 'number') this.loyalty.legacy_mythos = 0;
    if (typeof this.loyalty.full_bottles_purchased !== 'number') this.loyalty.full_bottles_purchased = 0;

    const defaultUser = {
      isLoggedIn: false,
      name: "",
      email: "",
      phone: "",
      address: "",
      pincode: "",
      city: "",
      role: "patron",
      isAdmin: false,
      tier: "Level 1: The Initiate",
      points: 0,
      orders: []
    };

    this.user = this.loadLocalStorage('mytholis_user', defaultUser);

    // Dynamic products catalog with local fallback
    this.products = (typeof MYTHOLIS_CATALOG !== 'undefined') ? [...MYTHOLIS_CATALOG] : [];

    // Global Economy & Store Settings synced to Firestore settings/global
    this.globalSettings = this.loadLocalStorage('mytholis_global_settings', {
      mythosEarnPct: 3,
      redemptionRatio: 1,
      maxMythosRedemptionPct: 30,
      signupBonusMythos: 100,
      codEnabled: true,
      codFee: 0,
      maxCodAmount: 15000,
      freeShippingThreshold: 3000,
      standardShippingFee: 150,
      promoCodes: [
        { code: 'LEGEND10', discountType: 'percent', value: 10, minOrder: 1999, active: true },
        { code: 'ROYAL500', discountType: 'flat', value: 500, minOrder: 3999, active: true }
      ]
    });

    // Auto-purge any legacy mock "Lord Alexander" data from existing client localStorage
    if (this.user.email === 'alexander@mytholis.com' || this.user.name === 'Lord Alexander') {
      this.user = Object.assign({}, defaultUser);
      this.saveLocalStorage('mytholis_user', this.user);
      this.loyalty = Object.assign({}, defaultLoyalty);
      this.saveLocalStorage('mytholis_loyalty', this.loyalty);
    }

    // Ensure user tier & points mirror loyalty state
    this.syncUserWithLoyalty();

    this.currentView = 'home';
    this.selectedProductId = 'king-scar';
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.listeners = [];
  }

  /* Admin Authorization Gate */
  isAdmin() {
    const whitelist = (typeof window !== 'undefined' && window.ADMIN_EMAILS) || [
      'gunhegarr@gmail.com',
      'admin@mytholis.com',
      'alexander@mytholis.com',
      'founder@mytholis.com'
    ];
    const fbUser = (typeof firebaseService !== 'undefined' && firebaseService?.currentUser) || null;
    const userEmail = (
      (this.firebaseUser && this.firebaseUser.email) || 
      (fbUser && fbUser.email) ||
      (this.user && this.user.email) || 
      ''
    ).toLowerCase().trim();

    if (userEmail && (whitelist.some(e => e.toLowerCase() === userEmail) || userEmail.includes('gunhegarr'))) return true;
    if (this.user && (this.user.isAdmin === true || this.user.role === 'admin')) return true;
    if (this.firebaseUser && (this.firebaseUser.isAdmin === true || this.firebaseUser.role === 'admin')) return true;
    if (fbUser && (fbUser.isAdmin === true || fbUser.role === 'admin')) return true;
    return false;
  }

  setProducts(list) {
    if (Array.isArray(list) && list.length > 0) {
      this.products = list;
      if (typeof window !== 'undefined') {
        window.MYTHOLIS_CATALOG = list;
      }
      this.notify();
    }
  }

  getProducts() {
    return (this.products && this.products.length) ? this.products : (typeof MYTHOLIS_CATALOG !== 'undefined' ? MYTHOLIS_CATALOG : []);
  }

  setGlobalSettings(settings) {
    if (settings && typeof settings === 'object') {
      this.globalSettings = Object.assign({}, this.globalSettings, settings);
      this.saveLocalStorage('mytholis_global_settings', this.globalSettings);
      this.notify();
    }
  }

  loadLocalStorage(key, defaultValue) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  saveLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("LocalStorage save failed", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  /* Currency Management */
  setCurrency(code) {
    if (CURRENCY_CONFIG[code]) {
      this.currency = code;
      this.saveLocalStorage('mytholis_currency', code);
      this.notify();
    }
  }

  formatPrice(inrAmount) {
    const amount = Number(inrAmount) || 0;
    const conf = CURRENCY_CONFIG[this.currency] || CURRENCY_CONFIG['INR'];
    if (this.currency === 'INR') {
      return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
    const converted = Math.max(1, Math.round(amount * conf.rate));
    const formattedNum = converted.toLocaleString('en-US');
    if (this.currency === 'AED') {
      return `AED ${formattedNum}`;
    }
    return `${conf.symbol}${formattedNum}`;
  }

  getCurrencyConfig() {
    return CURRENCY_CONFIG[this.currency] || CURRENCY_CONFIG['INR'];
  }

  /* Cart Methods */
  addToCart(productId, sizeMl = 100, engraving = '', quantity = 1) {
    const catalog = this.getProducts();
    const product = catalog.find(p => p.id === productId);
    if (!product) return;

    const sizeObj = product.sizes.find(s => s.ml === sizeMl) || product.sizes[0];
    const itemPrice = sizeObj.price;

    const existingIndex = this.cart.findIndex(
      item => item.id === productId && item.size === sizeMl && item.engraving === engraving
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: productId,
        name: product.name,
        image: product.image,
        size: sizeMl,
        price: itemPrice,
        engraving: engraving,
        quantity: quantity
      });
    }

    this.saveLocalStorage('mytholis_cart', this.cart);
    this.notify();
  }

  removeFromCart(index) {
    if (index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this.saveLocalStorage('mytholis_cart', this.cart);
      this.notify();
    }
  }

  updateCartQuantity(index, delta) {
    if (this.cart[index]) {
      this.cart[index].quantity += delta;
      if (this.cart[index].quantity <= 0) {
        this.cart.splice(index, 1);
      }
      this.saveLocalStorage('mytholis_cart', this.cart);
      this.notify();
    }
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  /* Wishlist Methods */
  toggleWishlist(productId) {
    const idx = this.wishlist.indexOf(productId);
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
    } else {
      this.wishlist.push(productId);
    }
    this.saveLocalStorage('mytholis_wishlist', this.wishlist);
    this.notify();
  }

  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  /* User Auth Methods */
  login(email, password) {
    this.user.isLoggedIn = true;
    this.user.email = email;
    this.user.name = email.split('@')[0].toUpperCase();
    this.saveLocalStorage('mytholis_user', this.user);
    this.notify();
  }

  isUserLoggedIn() {
    const fbUser = (typeof firebaseService !== 'undefined' && firebaseService?.currentUser) || null;
    return Boolean(
      (this.firebaseUser && this.firebaseUser.uid) || 
      (fbUser && fbUser.uid) ||
      (this.user && this.user.isLoggedIn && (this.user.email || this.user.phone || this.user.uid || this.user.name))
    );
  }

  logout() {
    this.firebaseUser = null;
    this.user = {
      isLoggedIn: false,
      name: "",
      email: "",
      phone: "",
      address: "",
      pincode: "",
      city: "",
      tier: "Level 1: The Initiate",
      points: 0,
      orders: []
    };
    this.saveLocalStorage('mytholis_user', this.user);

    this.loyalty = {
      spendable_mythos: 0,
      legacy_mythos: 0,
      full_bottles_purchased: 0,
      initiation_completed: false,
      codex_unlocked: [],
      trinity_claimed: false,
      pantheon_claimed: false,
      reviewed_scents: [],
      active_reward_codes: [],
      applied_reward_code: null
    };
    this.saveLocalStorage('mytholis_loyalty', this.loyalty);
    this.notify();
  }

  /* --------------------------------------------------------------------------
     THE CIRCLE OF LEGENDS - LOYALTY & REWARDS CORE CONTROLLER
     -------------------------------------------------------------------------- */

  syncUserWithLoyalty() {
    if (!this.loyalty) return;
    const tier = this.getCurrentTier();
    this.user.tier = `Level ${tier.level}: ${tier.name}`;
    this.user.points = this.loyalty.spendable_mythos;
    this.saveLocalStorage('mytholis_loyalty', this.loyalty);
    this.saveLocalStorage('mytholis_user', this.user);
  }

  getCurrentTier() {
    const legacy = this.loyalty ? this.loyalty.legacy_mythos : 0;
    const bottles = this.loyalty ? this.loyalty.full_bottles_purchased : 0;

    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      const tier = LOYALTY_TIERS[i];
      if (legacy >= tier.minLegacy && bottles >= tier.minBottles) {
        return tier;
      }
    }
    return LOYALTY_TIERS[0];
  }

  getNextTier() {
    const current = this.getCurrentTier();
    if (current.level >= LOYALTY_TIERS.length) return null;
    return LOYALTY_TIERS[current.level];
  }

  getTierProgress() {
    const currentTier = this.getCurrentTier();
    const nextTier = this.getNextTier();

    const currentLegacy = (this.loyalty && typeof this.loyalty.legacy_mythos === 'number') ? this.loyalty.legacy_mythos : 0;
    const currentBottles = (this.loyalty && typeof this.loyalty.full_bottles_purchased === 'number') ? this.loyalty.full_bottles_purchased : 0;

    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        legacyCurrent: currentLegacy,
        legacyRequired: currentTier.minLegacy || 0,
        legacyProgressPct: 100,
        legacyPct: 100,
        bottlesCurrent: currentBottles,
        bottlesRequired: currentTier.minBottles || 0,
        bottleProgressPct: 100,
        bottlesPct: 100,
        legacyNeeded: 0,
        bottlesNeeded: 0
      };
    }

    const legacyRange = nextTier.minLegacy - currentTier.minLegacy;
    const legacyGained = Math.max(0, currentLegacy - currentTier.minLegacy);
    const legacyProgressPct = legacyRange > 0 ? Math.min(100, Math.round((legacyGained / legacyRange) * 100)) : 100;

    const bottleRange = nextTier.minBottles - currentTier.minBottles;
    const bottlesGained = Math.max(0, currentBottles - currentTier.minBottles);
    const bottleProgressPct = bottleRange > 0 ? Math.min(100, Math.round((bottlesGained / bottleRange) * 100)) : 100;

    return {
      currentTier,
      nextTier,
      legacyCurrent: currentLegacy,
      legacyRequired: nextTier.minLegacy,
      legacyProgressPct,
      legacyPct: legacyProgressPct,
      bottlesCurrent: currentBottles,
      bottlesRequired: nextTier.minBottles,
      bottleProgressPct,
      bottlesPct: bottleProgressPct,
      legacyNeeded: Math.max(0, nextTier.minLegacy - currentLegacy),
      bottlesNeeded: Math.max(0, nextTier.minBottles - currentBottles)
    };
  }

  completeInitiation(source = 'general') {
    if (this.loyalty.initiation_completed) {
      return { alreadyCompleted: true };
    }
    this.loyalty.spendable_mythos += 150;
    this.loyalty.legacy_mythos += 100;
    this.loyalty.initiation_completed = true;
    this.syncUserWithLoyalty();
    this.notify();
    return { success: true, earnedSpendable: 150, earnedLegacy: 100 };
  }

  recordLoyaltyPurchase(items = [], subtotalBaseINR = 0) {
    const currentTier = this.getCurrentTier();
    const spendEarned = Math.floor(subtotalBaseINR / 100) * 3 * currentTier.multiplier;

    let bottleMilestoneBonus = 0;
    let newFullBottles = 0;
    const newlyUnlockedCodex = [];

    items.forEach(item => {
      const qty = item.quantity || 1;
      const size = Number(item.size);

      if (size === 50) {
        bottleMilestoneBonus += 300 * qty;
        newFullBottles += qty;
      } else if (size === 100) {
        bottleMilestoneBonus += 500 * qty;
        newFullBottles += qty;
      }

      if ((size === 50 || size === 100) && CORE_SCENT_IDS.includes(item.id)) {
        if (!this.loyalty.codex_unlocked.includes(item.id)) {
          this.loyalty.codex_unlocked.push(item.id);
          newlyUnlockedCodex.push(item.id);
        }
      }
    });

    this.loyalty.full_bottles_purchased += newFullBottles;
    this.loyalty.spendable_mythos += spendEarned;
    this.loyalty.legacy_mythos += (spendEarned + bottleMilestoneBonus);

    let milestoneBonus = 0;
    let milestoneMsg = '';

    if (this.loyalty.codex_unlocked.length >= 3 && !this.loyalty.trinity_claimed) {
      this.loyalty.spendable_mythos += 300;
      this.loyalty.legacy_mythos += 300;
      this.loyalty.trinity_claimed = true;
      milestoneBonus += 300;
      milestoneMsg += ' • Trinity Accord Claimed (+300M)';
    }

    if (this.loyalty.codex_unlocked.length >= 6 && !this.loyalty.pantheon_claimed) {
      this.loyalty.spendable_mythos += 1000;
      this.loyalty.legacy_mythos += 1000;
      this.loyalty.pantheon_claimed = true;
      milestoneBonus += 1000;
      milestoneMsg += ' • Pantheon Sovereign Claimed (+1,000M)';
    }

    // Automate ₹1,000 Discovery Coffret Voucher (MYTH-COFFRET-1000)
    let coffretVoucherAwarded = false;
    const hasCoffret = items.some(item => item.id === 'mytholis-discovery-set');
    if (hasCoffret) {
      const existingCoffretVoucher = this.loyalty.active_reward_codes.find(
        c => c.code === 'MYTH-COFFRET-1000' && !c.used
      );
      if (!existingCoffretVoucher) {
        this.loyalty.active_reward_codes.unshift({
          code: 'MYTH-COFFRET-1000',
          id: 'COFFRET_1000',
          title: '₹1,000 Off 100ml Flacon (Discovery Privilege)',
          type: 'discount',
          amount: 1000,
          minOrder: 4999,
          requires100ml: true,
          used: false,
          createdAt: new Date().toISOString()
        });
        coffretVoucherAwarded = true;
        milestoneMsg += ' • ₹1,000 Flacon Voucher Unlocked (MYTH-COFFRET-1000)';
      }
    }

    if (this.loyalty.applied_reward_code) {
      const activeCode = this.loyalty.active_reward_codes.find(
        c => c.code === this.loyalty.applied_reward_code
      );
      if (activeCode) {
        activeCode.used = true;
      }
      this.loyalty.applied_reward_code = null;
    }

    this.syncUserWithLoyalty();
    this.notify();

    return {
      spendEarned,
      bottleMilestoneBonus,
      totalLegacyEarned: spendEarned + bottleMilestoneBonus + milestoneBonus,
      newFullBottles,
      newlyUnlockedCodex,
      milestoneMsg,
      coffretVoucherAwarded
    };
  }

  redeemMythosReward(rewardId) {
    const reward = LOYALTY_REWARDS.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, error: "Concession voucher not found in Vault." };
    }

    const currentTier = this.getCurrentTier();
    if (currentTier.level < reward.minLevel) {
      return { 
        success: false, 
        error: `Requires Level ${reward.minLevel}: ${LOYALTY_TIERS[reward.minLevel - 1].name}.` 
      };
    }

    if (this.loyalty.spendable_mythos < reward.cost) {
      const deficit = reward.cost - this.loyalty.spendable_mythos;
      return { 
        success: false, 
        error: `Insufficient Spendable Mythos. Need ${deficit.toLocaleString()} more M.` 
      };
    }

    this.loyalty.spendable_mythos -= reward.cost;

    const uniqueCode = `MYTH-${reward.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRewardCode = {
      code: uniqueCode,
      id: reward.id,
      title: reward.title,
      type: reward.type,
      amount: reward.amount || 0,
      giftItem: reward.giftItem || '',
      minOrder: reward.minOrder || 0,
      used: false,
      createdAt: new Date().toISOString()
    };

    this.loyalty.active_reward_codes.unshift(newRewardCode);
    this.syncUserWithLoyalty();
    this.notify();

    return { success: true, code: uniqueCode, reward: newRewardCode };
  }

  applyRewardCode(rawCode) {
    if (!rawCode) return { success: false, error: "Please enter a voucher code." };
    const codeStr = rawCode.trim().toUpperCase();

    // Check Patron personalized Circle of Legends vouchers
    let existing = this.loyalty.active_reward_codes.find(
      c => c.code.toUpperCase() === codeStr
    );

    // If not found in personal vouchers, check store Global Promo Codes
    if (!existing && this.globalSettings && Array.isArray(this.globalSettings.promoCodes)) {
      const globalPromo = this.globalSettings.promoCodes.find(
        p => p.code && p.code.toUpperCase() === codeStr && p.active !== false
      );
      if (globalPromo) {
        existing = {
          code: globalPromo.code.toUpperCase(),
          title: `${globalPromo.code} Privilege`,
          type: globalPromo.discountType || 'discount',
          amount: Number(globalPromo.value) || 0,
          minOrder: Number(globalPromo.minOrder) || 0,
          isGlobalPromo: true,
          used: false
        };
      }
    }

    if (!existing) {
      return { success: false, error: "Unrecognized Mythos code or expired vault key." };
    }
    if (existing.used) {
      return { success: false, error: "This Mythos code has already been redeemed." };
    }

    const cartSubtotalINR = this.getCartTotal();
    if (existing.minOrder > 0 && cartSubtotalINR < existing.minOrder) {
      return { 
        success: false, 
        error: `Requires minimum order of ${this.formatPrice(existing.minOrder)}.` 
      };
    }

    if (existing.requires100ml) {
      const has100ml = this.cart.some(item => Number(item.size) === 100);
      if (!has100ml) {
        return { 
          success: false, 
          error: "This voucher is exclusively redeemable against a full 100ml flacon." 
        };
      }
    }

    this.loyalty.applied_reward_code = existing.code;
    this.syncUserWithLoyalty();
    this.notify();

    return { success: true, reward: existing };
  }

  removeAppliedRewardCode() {
    this.loyalty.applied_reward_code = null;
    this.syncUserWithLoyalty();
    this.notify();
  }

  getAppliedReward() {
    if (!this.loyalty || !this.loyalty.applied_reward_code) return null;
    const code = this.loyalty.applied_reward_code.toUpperCase();
    
    // Check personal active vouchers
    const personal = this.loyalty.active_reward_codes.find(
      c => c.code.toUpperCase() === code && !c.used
    );
    if (personal) return personal;

    // Check store global promo codes
    if (this.globalSettings && Array.isArray(this.globalSettings.promoCodes)) {
      const promo = this.globalSettings.promoCodes.find(
        p => p.code && p.code.toUpperCase() === code && p.active !== false
      );
      if (promo) {
        return {
          code: promo.code.toUpperCase(),
          title: `${promo.code} Privilege`,
          type: promo.discountType || 'discount',
          amount: Number(promo.value) || 0,
          minOrder: Number(promo.minOrder) || 0,
          isGlobalPromo: true,
          used: false
        };
      }
    }

    return null;
  }

  getDiscountAmount(subtotalINR = null) {
    const subtotal = subtotalINR !== null ? subtotalINR : this.getCartTotal();
    const reward = this.getAppliedReward();
    if (!reward) return 0;

    // Special privilege for Discovery Coffret voucher on full 100ml flacon
    if (reward.code === 'MYTH-COFFRET-1000') {
      return 1000;
    }

    let calculatedDiscount = 0;
    if (reward.type === 'percent') {
      calculatedDiscount = Math.floor(subtotal * (Number(reward.amount) / 100));
    } else if (reward.type === 'discount' || reward.type === 'flat') {
      calculatedDiscount = Number(reward.amount) || 0;
    }

    // Guardrail: Max 30% of cart subtotal (in base INR) or ₹2,500, whichever is lower
    const maxRedemptionPct = (this.globalSettings && this.globalSettings.maxMythosRedemptionPct) ? (this.globalSettings.maxMythosRedemptionPct / 100) : 0.30;
    const maxAllowed = Math.min(Math.floor(subtotal * maxRedemptionPct), 2500);
    return Math.min(calculatedDiscount, maxAllowed);
  }

  getAppliedGift() {
    const reward = this.getAppliedReward();
    if (!reward || reward.type !== 'gift') return null;
    return {
      name: reward.giftItem || reward.title,
      value: reward.cost || 500
    };
  }

  getEstimatedOrderLoyalty(subtotalBaseINR = 0, items = []) {
    const currentTier = this.getCurrentTier();
    const subtotal = subtotalBaseINR || this.getCartTotal();
    const cartItems = items && items.length ? items : (this.cart || []);
    const spendEarned = Math.floor(subtotal / 100) * 3 * (currentTier.multiplier || 1);

    let bottleMilestoneBonus = 0;
    cartItems.forEach(item => {
      const qty = item.quantity || 1;
      const size = Number(item.size);
      if (size === 50) {
        bottleMilestoneBonus += (300 * qty);
      } else if (size === 100) {
        bottleMilestoneBonus += (500 * qty);
      }
    });

    return {
      spendEarned,
      legacyEarned: spendEarned + bottleMilestoneBonus
    };
  }

  recordScentReview(scentId, hasMedia = false) {
    const currentTier = this.getCurrentTier();
    if (currentTier.level < 2) {
      return { success: false, error: "Dossier reviews unlock at Level 2: The Curator." };
    }
    if (this.loyalty.reviewed_scents.includes(scentId)) {
      return { success: false, error: "You have already inscribed your review for this extrait." };
    }

    const pts = hasMedia ? 100 : 50;
    this.loyalty.spendable_mythos += pts;
    this.loyalty.reviewed_scents.push(scentId);
    this.syncUserWithLoyalty();
    this.notify();

    return { success: true, points: pts };
  }
}

const store = new MytholisStore();
store.LOYALTY_TIERS = LOYALTY_TIERS;
store.LOYALTY_REWARDS = LOYALTY_REWARDS;
store.CORE_SCENT_IDS = CORE_SCENT_IDS;

if (typeof window !== 'undefined') {
  window.CURRENCY_CONFIG = CURRENCY_CONFIG;
  window.LOYALTY_TIERS = LOYALTY_TIERS;
  window.LOYALTY_REWARDS = LOYALTY_REWARDS;
  window.CORE_SCENT_IDS = CORE_SCENT_IDS;
  window.MytholisStore = MytholisStore;
  window.store = store;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    store,
    MytholisStore,
    CURRENCY_CONFIG,
    LOYALTY_TIERS,
    LOYALTY_REWARDS,
    CORE_SCENT_IDS
  };
}
