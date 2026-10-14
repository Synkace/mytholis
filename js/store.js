/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - STORE & STATE MANAGEMENT
   Manages Multi-Currency, Cart, Wishlist, User Account Session, and Routing.
   ========================================================================== */

const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1.0, name: 'INR (₹)', flag: '🇮🇳' },
  USD: { symbol: '$', rate: 0.0116, name: 'USD ($)', flag: '🇺🇸' },
  GBP: { symbol: '£', rate: 0.0092, name: 'GBP (£)', flag: '🇬🇧' },
  AED: { symbol: 'AED ', rate: 0.0425, name: 'AED (د.إ)', flag: '🇦🇪' },
  CNY: { symbol: '¥', rate: 0.084, name: 'CNY (¥)', flag: '🇨🇳' },
  RUB: { symbol: '₽', rate: 1.06, name: 'RUB (₽)', flag: '🇷🇺' }
};

class MytholisStore {
  constructor() {
    let savedCurrency = this.loadLocalStorage('mytholis_currency', 'INR');
    if (!CURRENCY_CONFIG[savedCurrency]) {
      savedCurrency = 'INR';
    }
    this.currency = savedCurrency;
    this.cart = this.loadLocalStorage('mytholis_cart', []);
    this.wishlist = this.loadLocalStorage('mytholis_wishlist', []);
    this.user = this.loadLocalStorage('mytholis_user', {
      isLoggedIn: true,
      name: "Lord Alexander",
      email: "alexander@mytholis.com",
      tier: "Obsidian Circle VIP",
      points: 1450,
      orders: [
        {
          id: "MYTH-89021",
          date: "2026-07-28",
          items: "Petralux Extrait de Parfum (100ml)",
          total: 3699,
          status: "Delivered",
          tracking: "MYTH-VIP-99420"
        },
        {
          id: "MYTH-78412",
          date: "2026-05-14",
          items: "Oud Rion Extrait de Parfum (100ml)",
          total: 3999,
          status: "Delivered",
          tracking: "MYTH-VIP-88124"
        }
      ]
    });

    this.currentView = 'home';
    this.selectedProductId = 'terra-petra';
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.listeners = [];
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
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId);
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

  logout() {
    this.user.isLoggedIn = false;
    this.saveLocalStorage('mytholis_user', this.user);
    this.notify();
  }
}

const store = new MytholisStore();

if (typeof window !== 'undefined') {
  window.CURRENCY_CONFIG = CURRENCY_CONFIG;
  window.MytholisStore = MytholisStore;
  window.store = store;
}
