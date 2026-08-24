/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION CONTROLLER & ROUTER
   Handles routing, event listeners, 3D tilt effects, ambiance, and toasts.
   ========================================================================== */

class MytholisApp {
  constructor() {
    this.selectedSize = 100;
    this.selectedPrice = 340;
    this.heroIndex = 0;
    this.isSwiping = false;
  }

  init() {
    // Initialize Canvas Background
    this.bgAnimation = new MytholisBackground('bg-canvas');

    // Subscribe store
    store.subscribe(() => {
      this.updateBadges();
      this.renderCartModalContent();
      this.renderWishlistModalContent();
      this.renderProfileModalContent();
    });

    // Hash router listener
    window.addEventListener('hashchange', () => this.handleHashRoute());

    // Scroll Header effect
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header-nav');
      if (header) {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });

    // Close mobile nav & currency dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const navContainer = document.querySelector('.header-nav');
      const links = document.getElementById('main-nav-links');
      if (links && links.classList.contains('mobile-open') && navContainer && !navContainer.contains(e.target)) {
        links.classList.remove('mobile-open');
      }

      const currDropdown = document.getElementById('currency-dropdown-wrap');
      const currMenu = document.getElementById('currency-dropdown-menu');
      if (currMenu && currMenu.classList.contains('active') && currDropdown && !currDropdown.contains(e.target)) {
        currMenu.classList.remove('active');
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) {
        const links = document.getElementById('main-nav-links');
        if (links) links.classList.remove('mobile-open');
      }
    });

    // Keyboard navigation & ESC key handler
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
      if (store.currentView === 'home') {
        if (e.key === 'ArrowRight') this.nextHeroProduct();
        if (e.key === 'ArrowLeft') this.prevHeroProduct();
      }
    });

    // Cursor Glow tracking for mouse devices
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
      });
    }

    // Global interactive ripple wave effect on clicks
    document.addEventListener('pointerdown', (e) => {
      const targetBtn = e.target.closest('.btn, .quiz-option-card, .hero-page-pill, .icon-btn');
      if (targetBtn) {
        const rect = targetBtn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;
        targetBtn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }
    });

    // Mouse tilt & 3D Hero Cards setup
    this.initTiltEffects();
    this.initHeroCardsScroll();

    // Initial Route & Badges Setup
    this.handleHashRoute();
    this.updateBadges();
  }

  /* Routing Handler */
  handleHashRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    let view = hash;
    let paramId = null;

    if (hash.startsWith('product')) {
      view = 'product';
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      paramId = urlParams.get('id') || 'terra-petra';
    }

    this.navigateTo(view, paramId, false);
  }

  toggleMobileMenu() {
    const links = document.getElementById('main-nav-links');
    if (links) links.classList.toggle('mobile-open');
  }

  navigateTo(viewName, paramId = null, pushHash = true) {
    if (pushHash) {
      if (viewName === 'product') {
        window.location.hash = `product?id=${paramId || store.selectedProductId}`;
      } else {
        window.location.hash = viewName;
      }
    }

    store.currentView = viewName;
    if (paramId) store.selectedProductId = paramId;

    // Close mobile menu if open
    const links = document.getElementById('main-nav-links');
    if (links) links.classList.remove('mobile-open');

    // Update nav links active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const mainContainer = document.getElementById('main-content-view');
    if (!mainContainer) return;

    let contentHtml = '';
    switch (store.currentView) {
      case 'home':
        contentHtml = Components.renderHome();
        break;
      case 'collections':
        contentHtml = Components.renderCollections();
        break;
      case 'know-us':
        contentHtml = Components.renderKnowUs();
        break;
      case 'find-scent':
        contentHtml = Components.renderFindScent(1);
        break;
      case 'track-order':
        contentHtml = Components.renderTrackOrder();
        break;
      case 'faqs':
        contentHtml = Components.renderFaqs();
        break;
      case 'contact':
        contentHtml = Components.renderContact();
        break;
      case 'product':
        contentHtml = Components.renderProductDetail(store.selectedProductId);
        break;
      case 'wishlist':
        contentHtml = Components.renderWishlist();
        break;
      case 'profile':
        contentHtml = Components.renderProfile();
        break;
      default:
        contentHtml = Components.renderHome();
    }

    mainContainer.innerHTML = contentHtml;
    this.initTiltEffects();

    if (store.currentView === 'home') {
      this.initHeroSwipeGestures();
      if (this.activateCenterCard) {
        setTimeout(() => this.activateCenterCard(), 50);
      }
    }
  }

  /* ------------------------------------------------------------------------
     HERO PRODUCT SLIDER & REAL-TIME SWIPE PHYSICS
     ------------------------------------------------------------------------ */
  nextHeroProduct() {
    this.setHeroProduct(this.heroIndex + 1, 'right');
  }

  prevHeroProduct() {
    this.setHeroProduct(this.heroIndex - 1, 'left');
  }

  setHeroProduct(index, direction = 'right') {
    const total = MYTHOLIS_CATALOG.length;
    this.heroIndex = (index + total) % total;
    const product = MYTHOLIS_CATALOG[this.heroIndex];

    const bottleImg = document.getElementById('hero-bottle-img');
    const badgeEl = document.getElementById('hero-badge');
    const editionEl = document.getElementById('hero-edition');
    const fragNameEl = document.getElementById('hero-fragrance-name');
    const descEl = document.getElementById('hero-desc');
    const accordsEl = document.getElementById('hero-accords-list');
    const ctaBtn = document.getElementById('hero-cta-btn');
    const quickAddBtn = document.getElementById('hero-quickadd-btn');
    const textContent = document.getElementById('hero-text-content');

    if (bottleImg) {
      bottleImg.classList.remove('slide-in-right', 'slide-in-left', 'dragging');
      bottleImg.style.transform = '';
      // Force DOM reflow
      void bottleImg.offsetWidth;
      bottleImg.src = product.image;
      bottleImg.alt = product.name;
      bottleImg.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
    }

    // Staggered text cascade animation
    if (textContent) {
      textContent.classList.remove('hero-text-anim');
      void textContent.offsetWidth;
      textContent.classList.add('hero-text-anim');
    }

    if (badgeEl) badgeEl.innerHTML = `✦ ${product.tag} • ${product.collection}`;
    if (editionEl) editionEl.innerHTML = `No. 0${this.heroIndex + 1} of 06`;
    if (fragNameEl) fragNameEl.innerText = product.name;
    if (descEl) descEl.innerText = product.description;

    if (accordsEl) {
      accordsEl.innerHTML = product.accords.map(a => `<span class="hero-accord-tag">✦ ${a}</span>`).join('');
    }

    if (ctaBtn) {
      ctaBtn.innerText = `Discover ${product.name} ✦`;
      ctaBtn.onclick = () => this.openProductView(product.id);
    }

    if (quickAddBtn) {
      quickAddBtn.innerText = `Quick Add • ${store.formatPrice(product.price)}`;
      quickAddBtn.onclick = () => this.addProductToCart(product.id);
    }

    // Update pagination pills active state
    document.querySelectorAll('#hero-pagination-dots .hero-page-pill').forEach((pill, i) => {
      if (i === this.heroIndex) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.resetHeroAutoPlay();
    this.initTiltEffects();
  }

  /* Real-Time Touch & Mouse Drag Physics */
  initHeroSwipeGestures() {
    const viewport = document.getElementById('hero-bottle-viewport');
    const bottleImg = document.getElementById('hero-bottle-img');
    const heroSection = document.getElementById('hero-section');
    if (!viewport || !bottleImg) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;

    const onStart = (clientX, clientY) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      currentX = clientX;
      bottleImg.classList.add('dragging');
      this.pauseHeroAutoPlay();
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      currentX = clientX;
      const deltaX = currentX - startX;
      const deltaY = clientY - startY;

      // Only horizontal drag
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const rotation = deltaX * 0.08;
        const scale = Math.max(0.92, 1 - Math.abs(deltaX) * 0.0008);
        bottleImg.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg) scale(${scale})`;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      bottleImg.classList.remove('dragging');
      const deltaX = currentX - startX;

      if (deltaX < -45) {
        this.nextHeroProduct();
      } else if (deltaX > 45) {
        this.prevHeroProduct();
      } else {
        // Spring smoothly back to center
        bottleImg.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bottleImg.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
        setTimeout(() => {
          bottleImg.style.transition = '';
        }, 400);
      }
      this.resetHeroAutoPlay();
    };

    // Touch events
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    viewport.addEventListener('touchend', onEnd);
    viewport.addEventListener('touchcancel', onEnd);

    // Mouse drag events
    viewport.addEventListener('mousedown', (e) => {
      onStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        onMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        onEnd();
      }
    });

    // Auto-play management
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => this.pauseHeroAutoPlay());
      heroSection.addEventListener('mouseleave', () => this.resetHeroAutoPlay());
    }

    this.resetHeroAutoPlay();
  }

  resetHeroAutoPlay() {
    this.pauseHeroAutoPlay();
    if (store.currentView === 'home') {
      this.heroAutoPlayTimer = setTimeout(() => {
        this.nextHeroProduct();
      }, 7000);
    }
  }

  pauseHeroAutoPlay() {
    if (this.heroAutoPlayTimer) {
      clearTimeout(this.heroAutoPlayTimer);
      this.heroAutoPlayTimer = null;
    }
  }

  openProductView(productId) {
    this.navigateTo('product', productId);
  }

  renderQuizStep(step) {
    const mainContainer = document.getElementById('main-content-view');
    if (mainContainer) {
      mainContainer.innerHTML = Components.renderFindScent(step);
    }
  }

  /* FAQ Accordion Toggle */
  toggleFaq(idx) {
    const answer = document.getElementById(`faq-answer-${idx}`);
    const icon = document.getElementById(`faq-icon-${idx}`);
    if (answer) {
      const isVisible = answer.style.display === 'block';
      answer.style.display = isVisible ? 'none' : 'block';
      if (icon) icon.innerText = isVisible ? '+' : '−';
    }
  }

  /* Track Order Search */
  searchTrackOrder() {
    const input = document.getElementById('track-order-input');
    const val = input ? input.value.trim() : '';
    if (val) {
      this.showToast(`Tracking status updated for ${val} ✦`);
    } else {
      this.showToast("Please enter an Order ID or Tracking Number");
    }
  }

  /* Contact Form Submit */
  submitContactForm() {
    this.showToast("Inquiry dispatched! Concierge will respond within 2 hours ✦");
    this.navigateTo('home');
  }

  /* Size Selector on Product Page with Dynamic Metrology Update */
  selectProductSize(ml, price) {
    this.selectedSize = ml;
    this.selectedPrice = price;

    document.querySelectorAll('#size-selector-group .btn').forEach(btn => {
      if (parseInt(btn.getAttribute('data-ml')) === ml) {
        btn.className = 'btn btn-gold';
      } else {
        btn.className = 'btn btn-glass';
      }
    });

    const priceEl = document.getElementById('detail-product-price');
    if (priceEl) {
      priceEl.innerText = store.formatPrice(price);
    }

    const unitPrice = (price / ml).toFixed(2);
    const mrpTag = document.getElementById('detail-mrp-tag');
    if (mrpTag) {
      mrpTag.innerText = `MRP (Incl. of all taxes) • ₹${unitPrice}/ml`;
    }

    const netQtyEl = document.getElementById('metrology-net-qty');
    if (netQtyEl) {
      netQtyEl.innerText = `${ml} ml / ${(ml * 0.0338).toFixed(1)} fl. oz.`;
    }

    const metrologyMrpEl = document.getElementById('metrology-mrp');
    if (metrologyMrpEl) {
      metrologyMrpEl.innerText = `${store.formatPrice(price)} (₹${unitPrice}/ml)`;
    }
  }

  /* Cart & Toast */
  addProductToCart(productId) {
    const engravingEl = document.getElementById('engraving-text');
    const engraving = engravingEl ? engravingEl.value.trim() : '';

    store.addToCart(productId, this.selectedSize || 100, engraving, 1);
    this.showToast("Fragrance added to your scent vault ✦");
    this.openCartModal();
  }

  /* --------------------------------------------------------------------------
     BUY BUTTONS: WHATSAPP CONCIERGE & RAZORPAY / UPI
     -------------------------------------------------------------------------- */

  buyNowWhatsApp(productId) {
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const size = this.selectedSize || (product.sizes[product.sizes.length - 1] ? product.sizes[product.sizes.length - 1].ml : 100);
    const price = this.selectedPrice || (product.sizes.find(s => s.ml === size) ? product.sizes.find(s => s.ml === size).price : product.price);
    const engravingEl = document.getElementById('engraving-text');
    const engraving = engravingEl ? engravingEl.value.trim() : '';

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to order:\n✦ *${product.name}*\n✦ Volume: ${size}ml\n✦ Total Price: ${store.formatPrice(price)} (Incl. all taxes)\n${engraving ? `✦ Complimentary Engraving: "${engraving}"\n` : ''}✦ Shipping: Pan-India Express Armored Delivery\n\nPlease share payment details (UPI / Bank Transfer) to confirm my order.`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`, '_blank');
  }

  checkoutCartWhatsApp() {
    if (store.cart.length === 0) return;
    const total = store.getCartTotal();
    const itemsList = store.cart.map(i => `• ${i.name} (${i.size}ml × ${i.quantity}) ${i.engraving ? `[Engraved: "${i.engraving}"]` : ''} - ${store.formatPrice(i.price * i.quantity)}`).join('\n');

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to checkout my Mytholis Vault Cart:\n\n${itemsList}\n\n*Total Amount:* ${store.formatPrice(total)} (Incl. 18% GST)\n*Delivery:* Free Express Armored Shipping across India\n\nPlease assist with UPI / Razorpay payment instructions.`;

    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`, '_blank');
  }

  buyNowRazorpay(productId) {
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    this.openRazorpayModal(product);
  }

  openRazorpayModal(productOrCart = null) {
    this.closeAllModals(false);
    const target = productOrCart || (store.cart.length ? { id: null } : MYTHOLIS_CATALOG[0]);
    const modalBody = document.getElementById('razorpay-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderRazorpayModal(target);
    }
    const overlay = document.getElementById('razorpay-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeRazorpayModal() {
    const overlay = document.getElementById('razorpay-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  selectPaymentMethod(el, method) {
    document.querySelectorAll('.razorpay-method-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  completeRazorpayPayment(amount) {
    this.closeRazorpayModal();
    this.showToast(`✦ Payment of ${store.formatPrice(amount)} Authorized via Razorpay Secure! Order Confirmed.`);
    if (store.cart.length > 0) {
      store.cart = [];
      store.saveLocalStorage('mytholis_cart', []);
      store.notify();
    }
    this.navigateTo('track-order');
  }

  /* --------------------------------------------------------------------------
     LEGAL & POLICY MODAL CONTROLLER
     -------------------------------------------------------------------------- */

  openPolicyModal(policyType) {
    this.closeAllModals(false);
    const modalBody = document.getElementById('policy-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderPolicyModal(policyType);
    }
    const overlay = document.getElementById('policy-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closePolicyModal() {
    const overlay = document.getElementById('policy-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* --------------------------------------------------------------------------
     UNIFORM MODAL CONTROLLERS: CART, WISHLIST, PROFILE
     -------------------------------------------------------------------------- */

  /* Cart Modal */
  openCartModal() {
    this.closeAllModals(false);
    this.renderCartModalContent();
    const overlay = document.getElementById('cart-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeCartModal() {
    const overlay = document.getElementById('cart-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  renderCartModalContent() {
    const modalBody = document.getElementById('cart-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderCartModal();
    }
  }

  /* Wishlist Modal */
  openWishlistModal() {
    this.closeAllModals(false);
    this.renderWishlistModalContent();
    const overlay = document.getElementById('wishlist-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeWishlistModal() {
    const overlay = document.getElementById('wishlist-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  renderWishlistModalContent() {
    const modalBody = document.getElementById('wishlist-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderWishlistModal();
    }
  }

  /* VIP Profile Modal */
  openProfileModal() {
    this.closeAllModals(false);
    this.renderProfileModalContent();
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeProfileModal() {
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  renderProfileModalContent() {
    const modalBody = document.getElementById('profile-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderProfileModal();
    }
  }

  /* Close All Modals */
  closeAllModals(restoreScroll = true) {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    if (restoreScroll) {
      document.body.style.overflow = '';
    }
  }

  /* Backward Compatibility Aliases */
  openCartDrawer() { this.openCartModal(); }
  closeCartDrawer() { this.closeCartModal(); }
  renderCartDrawerContent() { this.renderCartModalContent(); }

  updateBadges() {
    const cartBadge = document.getElementById('cart-count-badge');
    if (cartBadge) cartBadge.innerText = store.getCartCount();

    const wishlistBadge = document.getElementById('wishlist-count-badge');
    if (wishlistBadge) wishlistBadge.innerText = store.wishlist.length;
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  simulateCheckout() {
    this.showToast("Order placed! Generating Mytholis VIP Certificate...");
    store.cart = [];
    store.saveLocalStorage('mytholis_cart', []);
    store.notify();
    this.closeCartModal();
  }

  searchTrackOrderModal() {
    const input = document.getElementById('modal-track-input');
    const val = input ? input.value.trim() : '';
    this.showToast(`Consignment ${val || 'MYTH-89021'} telemetry verified ✦`);
  }

  /* 3D Tilt Effect on Bottles and Liquid Glass Cards */
  initTiltEffects() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const elements = document.querySelectorAll('.tilt-element');
    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  }

  /* 3D Hero Cards Mobile Scroll & Touch Observer */
  initHeroCardsScroll() {
    let ticking = false;
    let activeCard = null;

    const activateCenterCard = () => {
      const isMobile = window.innerWidth <= 768;
      const cards = document.querySelectorAll('.hero-card-row .card');
      if (!cards.length) return;

      if (!isMobile) {
        if (activeCard) {
          cards.forEach((card) => card.classList.remove('is-active'));
          activeCard = null;
        }
        return;
      }

      const viewportCenter = window.innerHeight * 0.52;
      let closestCard = null;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + (rect.height * 0.5);
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestCard = card;
        }
      }

      // Avoid DOM thrashing: Only update class if the focused card has changed
      if (closestCard && closestCard !== activeCard) {
        for (let i = 0; i < cards.length; i++) {
          cards[i].classList.remove('is-active');
        }
        closestCard.classList.add('is-active');
        activeCard = closestCard;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          activateCenterCard();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    this.activateCenterCard = activateCenterCard;

    // Instant touch response on mobile
    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.hero-card-row .card');
      if (card && window.innerWidth <= 768 && card !== activeCard) {
        const cards = document.querySelectorAll('.hero-card-row .card');
        for (let i = 0; i < cards.length; i++) {
          cards[i].classList.remove('is-active');
        }
        card.classList.add('is-active');
        activeCard = card;
      }
    }, { passive: true });
  }

  /* Currency Controller Methods */
  setCurrency(code) {
    store.setCurrency(code);
    this.renderProfileModalContent();
    this.renderCartModalContent();
    this.renderWishlistModalContent();
    this.renderCurrentView();
    this.showToast(`Currency updated to ${code} ✦`);
  }
}

const app = new MytholisApp();
window.addEventListener('DOMContentLoaded', () => app.init());
