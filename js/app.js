/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION CONTROLLER & ROUTER
   Handles routing, event listeners, 3D tilt effects, ambiance, and toasts.
   ========================================================================== */

import gsap from 'gsap';
import { AdminComponents } from './adminComponents.js';
import { firebaseService, db, collection, getDocs, doc, getDoc, setDoc, firebaseConfig } from './firebase.js';
import { 
  LABEL_PRESETS, 
  rebrandShiprocketLabelPdf, 
  downloadPdfBlob, 
  printPdfBlob, 
  generateShiprocketOrderPayload,
  generateSampleThermalLabelPdf
} from './labelRebrander.js';

if (typeof window !== 'undefined') {
  window.gsap = gsap;
}

class MytholisApp {
  constructor() {
    this.selectedSize = null;
    this.selectedPrice = null;
    this.heroIndex = 0;
    this.isSwiping = false;
    this.mobileHeroIndex = 2; // Petralux as initial center hero
    this.isIntroAnimating = false;
    this.activePyramidScent = 'petralux';
    this.adminActiveTab = 'orders';
    this.activeAuthTab = 'phone';
    this.activeDossierTab = 'overview';
    this.phoneOtpSent = false;
    this.authPhoneNumber = '';
    this.adminData = {
      orders: [],
      users: [],
      inventory: {},
      codes: []
    };
    this.adminLoading = false;
    this.backendDiagnostics = {
      running: false,
      clientConfig: { status: 'untested', label: 'Vite Config (Ready to Verify)' },
      authState: { status: 'untested', label: 'Auth State (Ready to Verify)' },
      firestoreClient: { status: 'untested', label: 'Firestore Lite (Ready to Verify)' },
      serverlessApi: { status: 'untested', label: 'Serverless /api/health (Ready to Verify)' }
    };
    this.currentRebranderPdfBytes = null;
    this.activeRebrandedResult = null;
    this.targetRebranderOrder = null;
  }

  init() {
    // Initialize Canvas Background
    this.bgAnimation = new MytholisBackground('bg-canvas');

    // Subscribe store
    store.subscribe(() => {
      this.updateBadges();
      this.updateNavAuth();
      this.renderCartModalContent();
      this.renderWishlistModalContent();
      this.renderProfileModalContent();

      // Gracefully sync local customer modifications up to Firestore cloud if authenticated
      if (typeof firebaseService !== 'undefined' && firebaseService.currentUser && !firebaseService.isSyncing) {
        firebaseService.pushLocalStateToCloud();
      }
    });

    // Initialize Firebase Auth & Realtime Firestore Sync
    if (typeof firebaseService !== 'undefined') {
      firebaseService.init(store, this);
    }

    // Initialize Navbar Auth State
    this.updateNavAuth();

    // Hash & History router listeners for Deep-Linking and Browser Back-Button
    window.addEventListener('hashchange', () => this.handleHashRoute());
    window.addEventListener('popstate', () => this.handleHashRoute());

    // Fastrr / Shiprocket 1-Click Checkout Event Bridge & Safety Listeners
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data) return;

      // When Fastrr sends hide-pre-loader, immediately reveal iframe and enable interactions
      if (data.trigger === 'hide-pre-loader') {
        const preloader = document.getElementById('fastrr-pre-loader');
        if (preloader) preloader.style.display = 'none';
        const mainContainer = document.getElementById('fastrr-main-container');
        if (mainContainer) mainContainer.style.pointerEvents = 'auto';
      }

      // Fastrr modal close triggers from user clicking ✕ inside iframe
      if (data.trigger === 'headless-close' || data.trigger === 'headlessClose' || data.action === 'headlessClose') {
        document.getElementById('headless-container')?.remove();
        document.getElementById('fastrr-main-container')?.remove();
        document.getElementById('fastrr-pre-loader')?.remove();
        document.body.style.overflow = 'auto';
      }
    });

    // Scroll Header effect & Mobile Sticky Buy Bar updater (cached & RAF throttled)
    const header = document.querySelector('.header-nav');
    const stickyBuyBar = document.getElementById('mobile-sticky-buy-bar');
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          if (header) {
            if (window.scrollY > 40) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }
          }
          // Update mobile sticky buy bar visibility
          if (stickyBuyBar) {
            if (window.scrollY > 400 && window.innerWidth <= 768) {
              stickyBuyBar.classList.add('visible');
            } else {
              stickyBuyBar.classList.remove('visible');
            }
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

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

    // Handle window resize (only switch layout on actual mobile/desktop breakpoint change)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      const crossedBreakpoint = (lastWidth <= 768 && currentWidth > 768) || (lastWidth > 768 && currentWidth <= 768);
      lastWidth = currentWidth;

      if (currentWidth > 992) {
        const links = document.getElementById('main-nav-links');
        if (links) links.classList.remove('mobile-open');
      }
      if (crossedBreakpoint && !this.isIntroAnimating) {
        if (currentWidth <= 768) {
          this.renderMobileFlaconCarousel(false);
        } else {
          this.resetDesktopFlaconCards();
        }
      }
    });

    // Keyboard navigation & ESC key handler
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
      if (store.currentView === 'home') {
        if (window.innerWidth <= 768) {
          if (e.key === 'ArrowRight') this.stepMobileHeroCarousel(1);
          if (e.key === 'ArrowLeft') this.stepMobileHeroCarousel(-1);
        } else {
          if (e.key === 'ArrowRight') this.nextHeroProduct();
          if (e.key === 'ArrowLeft') this.prevHeroProduct();
        }
      }
    });

    // Cursor Glow tracking for mouse devices (GPU accelerated via RAF translate3d)
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
      let mouseX = -500, mouseY = -500;
      let glowTicking = false;
      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!glowTicking) {
          requestAnimationFrame(() => {
            cursorGlow.style.transform = `translate3d(${mouseX - 175}px, ${mouseY - 175}px, 0)`;
            glowTicking = false;
          });
          glowTicking = true;
        }
      }, { passive: true });
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

    // Prevent accidental multi-touch pinch zooming & gesture zooming on mobile
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // Prevent double tap to zoom on touch devices
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        if (!e.target.closest('input, textarea')) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Mouse tilt & 3D Hero Cards setup
    this.initTiltEffects();
    this.initHeroCardsScroll();
    this.initHeroCardBackgroundSwitch();

    // Initial Route & Badges Setup
    this.handleHashRoute();
    this.updateBadges();
  }

  /* Routing Handler with Deep-Linking & Browser Back Support */
  handleHashRoute() {
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
    if (!rawHash || rawHash === 'home') {
      this.navigateTo('home', null, false);
      return;
    }

    // Support #flacon/[id]
    if (rawHash.startsWith('flacon/')) {
      const flaconId = rawHash.replace('flacon/', '').trim();
      this.navigateTo('product', flaconId, false);
      return;
    }

    // Support legacy #product?id=[id]
    if (rawHash.startsWith('product')) {
      const urlParams = new URLSearchParams(rawHash.split('?')[1]);
      const flaconId = urlParams.get('id') || 'king-scar';
      this.navigateTo('product', flaconId, false);
      return;
    }

    // Support #coffret / #discovery-set
    if (rawHash === 'coffret' || rawHash === 'discovery-set') {
      this.navigateTo('product', 'mytholis-discovery-set', false);
      return;
    }

    // Support #quiz / #find-scent
    if (rawHash === 'quiz' || rawHash === 'find-scent') {
      this.navigateTo('find-scent', null, false);
      return;
    }

    // Support #dossier / #profile / #account
    if (rawHash === 'dossier' || rawHash === 'profile' || rawHash === 'account') {
      this.navigateTo('profile', null, false);
      return;
    }

    // Support #collections / #shop / #extraits
    if (rawHash === 'collections' || rawHash === 'shop' || rawHash === 'extraits') {
      this.navigateTo('collections', null, false);
      return;
    }

    // Support #faqs
    if (rawHash === 'faqs') {
      this.navigateTo('faqs', null, false);
      return;
    }

    // Support #contact
    if (rawHash === 'contact') {
      this.navigateTo('contact', null, false);
      return;
    }

    // Support #admin (Sovereign Command Operations Desk)
    if (rawHash === 'admin' || rawHash === 'sanctum-command') {
      this.navigateTo('admin', null, false);
      return;
    }

    // Fallback for registered views: circle-of-legends, circle-of-legends-rules, know-us, track-order
    this.navigateTo(rawHash, null, false);
  }

  toggleMobileMenu() {
    const links = document.getElementById('main-nav-links');
    if (links) links.classList.toggle('mobile-open');
  }

  navigateTo(viewName, paramId = null, pushHash = true) {

    if (pushHash) {
      let targetHash = viewName;
      if (viewName === 'product') {
        if (paramId === 'mytholis-discovery-set') {
          targetHash = 'coffret';
        } else {
          targetHash = `flacon/${paramId || store.selectedProductId || 'king-scar'}`;
        }
      } else if (viewName === 'find-scent') {
        targetHash = 'quiz';
      } else if (viewName === 'profile' || viewName === 'dossier') {
        targetHash = 'dossier';
      } else if (viewName === 'admin') {
        targetHash = 'admin';
      }

      if (window.location.hash !== `#${targetHash}`) {
        window.location.hash = targetHash;
      }
    }

    store.currentView = viewName;
    if (paramId) {
      store.selectedProductId = paramId;
      const product = MYTHOLIS_CATALOG.find(p => p.id === paramId);
      if (product && product.sizes && product.sizes.length > 0) {
        const defaultSize = product.sizes[product.sizes.length - 1] || product.sizes[0];
        this.selectedSize = defaultSize.ml;
        this.selectedPrice = defaultSize.price;
      }
    }

    // Close any open modals when navigating
    this.closeAllModals();

    // Close mobile menu if open
    const links = document.getElementById('main-nav-links');
    if (links) links.classList.remove('mobile-open');

    // Update nav links active state
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      const isMatch = (linkView === viewName) ||
                      (viewName === 'find-scent' && linkView === 'find-scent') ||
                      (viewName === 'profile' && linkView === 'profile') ||
                      (viewName === 'circle-of-legends' && linkView === 'circle-of-legends');
      if (isMatch) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Brand Logo Click Handler (Replays Intro Falling Animation) */
  clickBrandLogo() {
    sessionStorage.removeItem('mytholis_intro_seen');
    if (store.currentView === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.initFanHero(true);
    } else {
      this.navigateTo('home', null, true);
    }
  }

  /* Instant Discovery Coffret Purchase Action */
  acquireCoffretNow() {
    const coffret = MYTHOLIS_CATALOG.find(p => p.id === 'mytholis-discovery-set');
    if (coffret) {
      store.addToCart(coffret.id, 60, '', 1);
      this.openCartModal();
    }
  }

  /* Interactive Olfactory Notes Pyramid Scent Selector */
  selectPyramidScent(scentId) {
    this.activePyramidScent = scentId;
    const scent = MYTHOLIS_CATALOG.find(p => p.id === scentId);
    if (!scent) return;

    const shortName = scent.name.replace(' Extrait de Parfum', '').trim();

    // Update active tab button styles
    document.querySelectorAll('.pyramid-tab-btn').forEach(btn => {
      if (btn.dataset.scentId === scentId) {
        btn.classList.add('active');
        btn.style.background = 'var(--gold-primary)';
        btn.style.color = '#020C08';
        btn.style.borderColor = 'var(--gold-light)';
        btn.style.fontWeight = '600';
      } else {
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.fontWeight = '';
      }
    });

    const cardsContainer = document.getElementById('pyramid-resonance-cards');
    const topNotesEl = document.getElementById('pyramid-top-notes');
    const heartNotesEl = document.getElementById('pyramid-heart-notes');
    const baseNotesEl = document.getElementById('pyramid-base-notes');
    const ctaBtn = document.getElementById('pyramid-cta-btn');

    if (cardsContainer && topNotesEl && heartNotesEl && baseNotesEl && ctaBtn) {
      cardsContainer.style.opacity = '0.3';
      cardsContainer.style.transform = 'translateY(6px)';
      setTimeout(() => {
        topNotesEl.innerHTML = scent.notes.top.join(' · ');
        heartNotesEl.innerHTML = scent.notes.heart.join(' · ');
        baseNotesEl.innerHTML = scent.notes.base.join(' · ');
        ctaBtn.innerHTML = `Acquire ${shortName} →`;
        ctaBtn.setAttribute('onclick', `app.openProductView('${scent.id}')`);
        cardsContainer.style.opacity = '1';
        cardsContainer.style.transform = 'translateY(0)';
      }, 150);
    }
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
      case 'user-profile':
      case 'dossier':
        contentHtml = Components.renderProfile();
        break;
      case 'circle-of-legends':
      case 'loyalty':
      case 'vault':
        contentHtml = Components.renderCircleOfLegends();
        break;
      case 'circle-of-legends-rules':
      case 'loyalty-rules':
      case 'mythos-society-rules':
        contentHtml = Components.renderLoyaltyRules();
        break;
      case 'admin':
      case 'sanctum-command':
        contentHtml = Components.renderAdmin();
        break;
      default:
        contentHtml = Components.renderHome();
    }

    mainContainer.innerHTML = contentHtml;
    this.initTiltEffects();

    // If on admin view, load data if authenticated as admin
    if (store.currentView === 'admin' || store.currentView === 'sanctum-command') {
      if (store.isAdmin() && !this.adminLoading && (!this.adminData.orders.length && !this.adminData.users.length)) {
        this.loadAdminDashboard();
      }
    }

    if (store.currentView === 'home') {
      mainContainer.classList.add('home-view');
      this.initFanHero();
      this.initHeroSwipeGestures();
      this.initHeroCardBackgroundSwitch();
      if (this.activateCenterCard) {
        setTimeout(() => this.activateCenterCard(), 50);
      }
    } else {
      mainContainer.classList.remove('home-view');
    }

    // Update sticky buy bar metadata if on product view
    if (store.currentView === 'product') {
      const prod = MYTHOLIS_CATALOG.find(p => p.id === store.selectedProductId) || MYTHOLIS_CATALOG[0];
      const stickyImg = document.getElementById('sticky-buy-img');
      const stickyName = document.getElementById('sticky-buy-name');
      const stickyPrice = document.getElementById('sticky-buy-price');
      if (stickyImg) stickyImg.src = prod.image;
      if (stickyName) stickyName.innerText = prod.name;
      if (stickyPrice) stickyPrice.innerText = store.formatPrice(this.selectedPrice || prod.price);
    }
  }

  /* ------------------------------------------------------------------------
     3D FAN ARRAY FLACON HERO SECTION (DESKTOP FAN / MOBILE INFINITE CAROUSEL)
     ------------------------------------------------------------------------ */
  initFanHero(forceIntro = false) {
    const heroEl = document.querySelector('.hero, #hero-section');
    if (!heroEl) return;

    const cards = heroEl.querySelectorAll('#cardsRow .flacon-card, #cardsRow .card');
    if (!cards || cards.length === 0) return;

    // Ensure rest rotation dataset is populated
    cards.forEach((card) => {
      const rot = parseFloat(card.dataset.rot) || 0;
      card.dataset.restRot = rot;
    });

    const isMobile = window.innerWidth <= 768;
    const introSeen = sessionStorage.getItem('mytholis_intro_seen');
    const shouldRunIntro = forceIntro || !introSeen;

    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
      const kicker = heroEl.querySelector('.hero-kicker');
      const words = heroEl.querySelectorAll('.small-team .word > span');
      const letters = heroEl.querySelectorAll('.big-results .letter');
      const subline = heroEl.querySelector('#subline');

      if (shouldRunIntro) {
        sessionStorage.setItem('mytholis_intro_seen', 'true');
        this.isIntroAnimating = true;

        // 1. Initial states: flacon bottles start off-screen above
        cards.forEach((card) => {
          const rot = parseFloat(card.dataset.restRot) || 0;
          gsap.set(card, { y: -850, rotation: rot + 18, opacity: 0, scale: 0.8, visibility: 'visible' });
        });

        if (kicker) gsap.set(kicker, { opacity: 0, y: -15 });
        if (words.length) gsap.set(words, { y: '105%' });
        if (letters.length) gsap.set(letters, { y: 60, opacity: 0 });
        if (subline) gsap.set(subline, { opacity: 0, y: 25 });

        // 2. Intro timeline: Kicker -> Title -> ONE HOUSE -> BOTTLES DROP FALL -> Subline
        const intro = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            this.isIntroAnimating = false;
          }
        });

        if (kicker) intro.to(kicker, { opacity: 1, y: 0, duration: 0.7 }, 0.2);
        if (words.length) intro.to(words, { y: '0%', duration: 0.95, stagger: 0.08, ease: 'power3.out' }, 0.35);
        if (letters.length) intro.to(letters, { y: 0, opacity: 1, duration: 0.95, stagger: 0.04, ease: 'back.out(1.5)' }, 0.55);

        if (isMobile) {
          // Mobile: scaled-up flacons drop into their overlapping carousel slots
          cards.forEach((card, i) => {
            const slot = this.getMobileSlotParams(i, this.mobileHeroIndex);
            intro.to(card, {
              x: slot.x,
              y: slot.y,
              scale: slot.scale,
              rotation: slot.rotation,
              opacity: slot.opacity,
              zIndex: slot.zIndex,
              duration: 1.15,
              ease: 'back.out(1.35)'
            }, 0.75 + i * 0.05);
          });
        } else {
          // Desktop: signature fan array drop
          intro.to(cards, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
            duration: 1.15,
            stagger: { each: 0.07, from: 'center' },
            ease: 'back.out(1.35)'
          }, 0.75);
        }

        if (subline) intro.to(subline, { opacity: 1, y: 0, duration: 0.85 }, 1.55);
      } else {
        // Fast 300ms transition for returning to Home during same session
        this.isIntroAnimating = false;

        if (kicker) gsap.set(kicker, { opacity: 1, y: 0 });
        if (words.length) gsap.set(words, { y: '0%' });
        if (letters.length) gsap.set(letters, { y: 0, opacity: 1 });
        if (subline) gsap.set(subline, { opacity: 1, y: 0 });

        if (isMobile) {
          cards.forEach((card, i) => {
            const slot = this.getMobileSlotParams(i, this.mobileHeroIndex);
            gsap.to(card, {
              x: slot.x,
              y: slot.y,
              scale: slot.scale,
              rotation: slot.rotation,
              opacity: slot.opacity,
              zIndex: slot.zIndex,
              visibility: 'visible',
              duration: 0.3,
              ease: 'power2.out'
            });
          });
        } else {
          gsap.to(cards, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            visibility: 'visible',
            rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      }

      // 3. Continuous floating animation
      cards.forEach((card, i) => {
        const rot = parseFloat(card.dataset.restRot) || 0;
        gsap.to(card, {
          y: `+=${6 + (i % 3) * 4}`,
          rotation: rot + (i % 2 === 0 ? 1.2 : -1.2),
          duration: 3.2 + (i % 4) * 0.5,
          delay: (shouldRunIntro ? 1.8 : 0.3) + i * 0.12,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      });

      // 4. Hover 3D tilt on individual cards (desktop only)
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          if (window.innerWidth <= 768) return;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;

          gsap.to(card, {
            rotateX: -py * 16,
            rotateY: px * 16,
            scale: 1.1,
            zIndex: 25,
            duration: 0.35,
            ease: 'power2.out',
            transformPerspective: 800,
            overwrite: 'auto'
          });
        });

        card.addEventListener('mouseleave', () => {
          if (window.innerWidth <= 768) return;
          const rot = parseFloat(card.dataset.restRot) || 0;
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            rotation: rot,
            scale: 1,
            zIndex: card.style.zIndex || '',
            duration: 0.75,
            ease: 'elastic.out(1, 0.6)',
            overwrite: 'auto'
          });
        });
      });
    } else {
      // Fallback without GSAP
      if (isMobile) {
        this.renderMobileFlaconCarousel(false);
      } else {
        cards.forEach((card) => {
          const rot = parseFloat(card.dataset.rot) || 0;
          card.style.opacity = '1';
          card.style.transform = `rotate(${rot}deg)`;
        });
      }
      const spans = heroEl.querySelectorAll('.small-team .word > span');
      spans.forEach(s => s.style.transform = 'translateY(0)');
    }

    if (isMobile) {
      this.renderMobileFlaconCarousel(false);
    }

    // 5. Mouse parallax across cards (desktop only)
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMouseMove = (e) => {
      const r = heroEl.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onMouseLeave = () => {
      mx = 0;
      my = 0;
    };

    if (heroEl._onParallaxMove) {
      heroEl.removeEventListener('mousemove', heroEl._onParallaxMove);
      heroEl.removeEventListener('mouseleave', heroEl._onParallaxLeave);
    }
    heroEl._onParallaxMove = onMouseMove;
    heroEl._onParallaxLeave = onMouseLeave;
    heroEl.addEventListener('mousemove', onMouseMove);
    heroEl.addEventListener('mouseleave', onMouseLeave);

    if (!window._fanHeroParallaxActive) {
      window._fanHeroParallaxActive = true;
      const loop = () => {
        tx += (mx - tx) * 0.05;
        ty += (my - ty) * 0.05;
        if (window.innerWidth > 768) {
          document.querySelectorAll('#cardsRow .flacon-card, #cardsRow .card').forEach((card) => {
            const d = parseFloat(card.dataset.depth) || 8;
            card.style.translate = `${tx * d}px ${ty * d * 0.5}px`;
          });
        } else {
          document.querySelectorAll('#cardsRow .flacon-card, #cardsRow .card').forEach((card) => {
            if (card.style.translate && card.style.translate !== '0px 0px') {
              card.style.translate = '0px 0px';
            }
          });
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    // 6. Mobile Touch & Drag Gestures (Infinite Swipable Carousel)
    const cardsRow = heroEl.querySelector('#cardsRow');
    if (cardsRow && !cardsRow._mobileSwipeBound) {
      cardsRow._mobileSwipeBound = true;
      let startX = 0, startY = 0, startTime = 0;
      let isTouching = false;
      let isDragging = false;

      // Real Touch gestures on mobile
      cardsRow.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return;
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        isTouching = true;
      }, { passive: true });

      cardsRow.addEventListener('touchmove', (e) => {
        if (!isTouching || window.innerWidth > 768) return;
        if (!e.touches || e.touches.length === 0) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });

      cardsRow.addEventListener('touchend', (e) => {
        if (!isTouching || window.innerWidth > 768) return;
        isTouching = false;
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;

        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          if (dx < 0) {
            this.stepMobileHeroCarousel(1);
          } else {
            this.stepMobileHeroCarousel(-1);
          }
        }
      }, { passive: true });

      // Mouse drag simulation for desktop testing
      cardsRow.addEventListener('mousedown', (e) => {
        if (window.innerWidth > 768) return;
        startX = e.clientX;
        startY = e.clientY;
        startTime = Date.now();
        isDragging = true;
      });

      window.addEventListener('mouseup', (e) => {
        if (!isDragging || window.innerWidth > 768) return;
        isDragging = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) {
            this.stepMobileHeroCarousel(1);
          } else {
            this.stepMobileHeroCarousel(-1);
          }
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     MOBILE FLACON OVERLAPPING 3D CAROUSEL CONTROLLER
     ------------------------------------------------------------------------ */
  getMobileSlotParams(cardIndex, activeIndex) {
    let diff = cardIndex - activeIndex;
    while (diff > 3) diff -= 6;
    while (diff < -2) diff += 6;

    const isNarrow = window.innerWidth <= 480;
    // Elegant proportional spacing for scaled-up bottles with 3D overlap
    const spacing = isNarrow ? Math.min(window.innerWidth * 0.19, 74) : Math.min(window.innerWidth * 0.23, 92);

    if (diff === 0) {
      // Center active bottle (front, prominently scaled up, glowing)
      return {
        x: 0,
        y: 0,
        scale: isNarrow ? 1.22 : 1.28,
        rotation: 0,
        zIndex: 20,
        opacity: 1
      };
    } else if (diff === -1) {
      // Immediate left overlapping behind center
      return {
        x: -spacing,
        y: 16,
        scale: 0.98,
        rotation: -7,
        zIndex: 14,
        opacity: 0.92
      };
    } else if (diff === 1) {
      // Immediate right overlapping behind center
      return {
        x: spacing,
        y: 16,
        scale: 0.98,
        rotation: 7,
        zIndex: 14,
        opacity: 0.92
      };
    } else if (diff === -2) {
      // Outer left
      return {
        x: -spacing * 1.84,
        y: 32,
        scale: 0.82,
        rotation: -14,
        zIndex: 8,
        opacity: 0.55
      };
    } else if (diff === 2) {
      // Outer right
      return {
        x: spacing * 1.84,
        y: 32,
        scale: 0.82,
        rotation: 14,
        zIndex: 8,
        opacity: 0.55
      };
    } else {
      // Hidden behind in the circle (diff === 3 or -3)
      return {
        x: 0,
        y: 45,
        scale: 0.5,
        rotation: 0,
        zIndex: 1,
        opacity: 0
      };
    }
  }

  renderMobileFlaconCarousel(animate = true) {
    if (window.innerWidth > 768) return;
    const heroEl = document.querySelector('.hero, #hero-section');
    if (!heroEl) return;
    const cards = heroEl.querySelectorAll('#cardsRow .flacon-card, #cardsRow .card');
    if (!cards || cards.length === 0) return;

    cards.forEach((card, i) => {
      const slot = this.getMobileSlotParams(i, this.mobileHeroIndex);

      let diff = i - this.mobileHeroIndex;
      while (diff > 3) diff -= 6;
      while (diff < -2) diff += 6;

      if (diff === 0) {
        card.classList.add('is-mobile-center');
      } else {
        card.classList.remove('is-mobile-center');
      }

      if (animate && typeof gsap !== 'undefined') {
        gsap.to(card, {
          x: slot.x,
          y: slot.y,
          scale: slot.scale,
          rotation: slot.rotation,
          opacity: slot.opacity,
          zIndex: slot.zIndex,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      } else {
        card.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0) scale(${slot.scale}) rotate(${slot.rotation}deg)`;
        card.style.opacity = slot.opacity;
        card.style.zIndex = slot.zIndex;
      }
    });

    // Update dots indicator
    document.querySelectorAll('#mobileFlaconDots .m-dot').forEach((dot, idx) => {
      if (idx === this.mobileHeroIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update subline text with active fragrance name & notes
    const activeCard = cards[this.mobileHeroIndex];
    if (activeCard) {
      const name = activeCard.dataset.name || 'Master Extrait';
      const note = activeCard.dataset.note || '40% Pure Concentration';
      const nameEl = document.getElementById('heroSublineName');
      if (nameEl) {
        nameEl.innerHTML = `<strong>${name}</strong> · ${note}`;
      }
    }
  }

  stepMobileHeroCarousel(dir) {
    window._justSwipedHero = true;
    setTimeout(() => { window._justSwipedHero = false; }, 320);
    this.mobileHeroIndex = ((this.mobileHeroIndex + dir) % 6 + 6) % 6;
    this.renderMobileFlaconCarousel(true);
  }

  setMobileFlaconIndex(index) {
    this.mobileHeroIndex = ((index % 6) + 6) % 6;
    this.renderMobileFlaconCarousel(true);
  }

  handleFlaconCardClick(index, productId) {
    if (window._justSwipedHero) return;
    if (window.innerWidth <= 768) {
      if (this.mobileHeroIndex !== index) {
        this.setMobileFlaconIndex(index);
        return;
      }
    }
    this.openProductView(productId);
  }

  resetDesktopFlaconCards() {
    if (this.isIntroAnimating) return;
    const cards = document.querySelectorAll('#cardsRow .flacon-card, #cardsRow .card');
    cards.forEach((card) => {
      const rot = parseFloat(card.dataset.restRot) || 0;
      card.classList.remove('is-mobile-center');
      if (typeof gsap !== 'undefined') {
        gsap.set(card, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: rot,
          opacity: 1,
          clearProps: 'zIndex,transform'
        });
      } else {
        card.style.transform = `rotate(${rot}deg)`;
        card.style.opacity = '1';
        card.style.zIndex = '';
      }
    });
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
    const heroCatalog = MYTHOLIS_CATALOG.slice(0, 6);
    const total = heroCatalog.length;
    this.heroIndex = ((index % total) + total) % total;
    const product = heroCatalog[this.heroIndex];

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
      bottleImg.style.transition = '';
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

    if (badgeEl) badgeEl.innerHTML = `${product.subtitle}`;
    if (editionEl) editionEl.innerHTML = `No. 0${this.heroIndex + 1} of 06`;
    if (fragNameEl) fragNameEl.innerText = product.name;
    if (descEl) descEl.innerText = `"${product.tagline}" ${product.description}`;

    if (accordsEl) {
      accordsEl.innerHTML = product.accords.map(a => `<span class="hero-accord-tag">${a}</span>`).join('');
    }

    if (ctaBtn) {
      ctaBtn.innerText = `Discover ${product.name.replace(' Extrait de Parfum', '')}`;
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
    let currentY = 0;
    let isDragging = false;
    let hasMoved = false;

    const onStart = (clientX, clientY) => {
      isDragging = true;
      hasMoved = false;
      startX = clientX;
      startY = clientY;
      currentX = clientX;
      currentY = clientY;
      bottleImg.classList.add('dragging');
      bottleImg.style.transition = 'none';
      this.pauseHeroAutoPlay();
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      currentX = clientX;
      currentY = clientY;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      if (Math.abs(deltaX) > 8) {
        hasMoved = true;
      }

      // Horizontal swipe responsiveness
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const rotation = deltaX * 0.07;
        const scale = Math.max(0.9, 1 - Math.abs(deltaX) * 0.0006);
        bottleImg.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg) scale(${scale})`;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      bottleImg.classList.remove('dragging');
      const deltaX = currentX - startX;

      if (deltaX < -40) {
        this.nextHeroProduct();
      } else if (deltaX > 40) {
        this.prevHeroProduct();
      } else {
        if (hasMoved) {
          // Snap back smoothly
          bottleImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
          bottleImg.style.transform = 'translateX(0px) rotate(0deg) scale(1)';
          setTimeout(() => {
            const currentImg = document.getElementById('hero-bottle-img');
            if (currentImg) currentImg.style.transition = '';
          }, 350);
        } else {
          // Simple tap/click on the flacon advances to next
          this.nextHeroProduct();
        }
      }
      this.resetHeroAutoPlay();
    };

    // Cleanly bind touch events on viewport
    viewport.ontouchstart = (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    viewport.ontouchmove = (e) => {
      if (isDragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    viewport.ontouchend = () => onEnd();
    viewport.ontouchcancel = () => onEnd();

    // Mouse drag events
    viewport.onmousedown = (e) => {
      if (e.target.closest('.hero-arrow-btn, .hero-page-pill')) return;
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    };

    window.onmousemove = (e) => {
      if (isDragging) {
        onMove(e.clientX, e.clientY);
      }
    };

    window.onmouseup = () => {
      if (isDragging) {
        onEnd();
      }
    };

    // Auto-play management
    if (heroSection) {
      heroSection.onmouseenter = () => this.pauseHeroAutoPlay();
      heroSection.onmouseleave = () => this.resetHeroAutoPlay();
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
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const defaultSize = product.sizes[product.sizes.length - 1] || product.sizes[0];
    this.selectedSize = defaultSize.ml;
    this.selectedPrice = defaultSize.price;
    this.navigateTo('product', productId);
  }

  renderQuizStep(step) {
    if (step > 2 && !store.loyalty.initiation_completed) {
      store.completeInitiation('quiz');
    }
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
  async searchTrackOrder() {
    const input = document.getElementById('track-order-input');
    const resultBox = document.getElementById('track-result-box');
    const queryTerm = input ? input.value.trim() : '';

    if (!queryTerm) {
      this.showToast("Please enter an Order ID or Tracking Number");
      return;
    }

    if (resultBox) {
      resultBox.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <div style="color: var(--gold-light); font-size: 0.9rem; margin-bottom: 0.5rem;">
            Searching sovereign cloud ledger for <strong>${queryTerm}</strong>...
          </div>
          <span style="display:inline-block; animation: spin 1s linear infinite; color: var(--gold-primary);">⟳</span>
        </div>
      `;
    }

    try {
      // 1. Search in local memory first (patron orders or admin orders)
      let foundOrder = (store.user?.orders || []).find(o => 
        (o.id && o.id.toLowerCase() === queryTerm.toLowerCase()) ||
        (o.orderId && o.orderId.toLowerCase() === queryTerm.toLowerCase()) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === queryTerm.toLowerCase()) ||
        (o.awb_number && o.awb_number.toLowerCase() === queryTerm.toLowerCase())
      );

      // 2. Search in Firestore
      if (!foundOrder && typeof db !== 'undefined') {
        const { getDoc, doc, getDocs, collection, query, where } = await import('firebase/firestore');
        // Check doc ID
        const docSnap = await getDoc(doc(db, 'orders', queryTerm)).catch(() => null);
        if (docSnap && docSnap.exists()) {
          foundOrder = { id: docSnap.id, ...docSnap.data() };
        } else {
          // Check orderId field
          const qSnap = await getDocs(query(collection(db, 'orders'), where('orderId', '==', queryTerm))).catch(() => null);
          if (qSnap && !qSnap.empty) {
            foundOrder = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
          } else {
            // Check trackingNumber
            const awbSnap = await getDocs(query(collection(db, 'orders'), where('trackingNumber', '==', queryTerm))).catch(() => null);
            if (awbSnap && !awbSnap.empty) {
              foundOrder = { id: awbSnap.docs[0].id, ...awbSnap.docs[0].data() };
            }
          }
        }
      }

      if (!foundOrder) {
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1.5rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px;">
              <div style="color: #FCA5A5; font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem;">Consignment Not Found</div>
              <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 500px; margin: 0 auto; line-height: 1.5;">
                No consignment matching <strong>${queryTerm}</strong> was found in our active dispatch ledger. Please verify your Order ID from your confirmation email or WhatsApp notification.
              </p>
            </div>
          `;
        }
        this.showToast(`No consignment found for ${queryTerm}.`);
        return;
      }

      // Render Dynamic Live Result
      const st = (foundOrder.status || 'Pending').toLowerCase();
      const awb = foundOrder.trackingNumber || foundOrder.awb_number || '';
      const courier = foundOrder.courierName || foundOrder.courier || 'BlueDart Express';
      const trackingUrl = foundOrder.trackingUrl || (awb ? `https://shiprocket.co/tracking/${awb}` : '');
      const estDate = foundOrder.estimatedDelivery || '3-5 Business Days';
      const itemsDesc = Array.isArray(foundOrder.items) 
        ? foundOrder.items.map(i => `${i.name || i.id} (${i.size || '50ml'}) × ${i.quantity || i.qty || 1}`).join(', ')
        : (foundOrder.items || 'Extrait de Parfum Flacons');

      const isPlaced = true;
      const isPacked = ['packed', 'shipped', 'out for delivery', 'delivered'].includes(st);
      const isShipped = ['shipped', 'out for delivery', 'delivered'].includes(st);
      const isOut = ['out for delivery', 'delivered'].includes(st);
      const isDelivered = st === 'delivered';

      if (resultBox) {
        resultBox.innerHTML = `
          <div class="track-order-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 1.2rem; margin-bottom: 1.5rem;">
            <div>
              <span class="glass-pill" style="font-size: 0.68rem; color: var(--gold-light);">Order #${foundOrder.orderId || foundOrder.id}</span>
              <h3 class="track-order-product-name" style="color: var(--gold-light); margin: 0.4rem 0 0.2rem; font-size: 1.15rem;">${itemsDesc}</h3>
              <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">Courier: <strong style="color: var(--text-main);">${courier}</strong> ${awb ? `• AWB: <strong style="color: var(--gold-light);">${awb}</strong>` : ''}</p>
            </div>
            <div class="track-delivery-est" style="text-align: right;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Estimated Delivery:</span>
              <p style="font-weight: 700; color: var(--gold-primary); font-size: 1rem; margin: 0.2rem 0 0;">${estDate}</p>
            </div>
          </div>

          <!-- Progress Tracker -->
          <div class="tracker-steps-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 2rem;">
            <div class="tracker-step-item">
              <div class="tracker-icon-circle ${isPlaced ? 'completed' : ''}" style="margin: 0 auto 0.5rem; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isPlaced ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)'}; color: #041812;">
                ✓
              </div>
              <h5 style="font-size: 0.8rem; margin: 0 0 0.15rem; color: var(--text-main);">Order Placed</h5>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Confirmed</span>
            </div>

            <div class="tracker-step-item">
              <div class="tracker-icon-circle ${isPacked ? 'completed' : ''}" style="margin: 0 auto 0.5rem; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isPacked ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)'}; color: #041812;">
                ${isPacked ? '✓' : '2'}
              </div>
              <h5 style="font-size: 0.8rem; margin: 0 0 0.15rem; color: var(--text-main);">Wax Sealed</h5>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Vault Packed</span>
            </div>

            <div class="tracker-step-item">
              <div class="tracker-icon-circle ${isShipped ? 'completed' : ''}" style="margin: 0 auto 0.5rem; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isShipped ? 'var(--gold-primary)' : 'rgba(255,255,255,0.05)'}; color: #041812;">
                ${isShipped ? '✓' : '3'}
              </div>
              <h5 style="font-size: 0.8rem; margin: 0 0 0.15rem; color: var(--text-main);">In Transit</h5>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${courier}</span>
            </div>

            <div class="tracker-step-item">
              <div class="tracker-icon-circle ${isDelivered ? 'completed' : (isOut ? 'active' : '')}" style="margin: 0 auto 0.5rem; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isDelivered ? 'var(--gold-primary)' : (isOut ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)')}; color: ${isDelivered ? '#041812' : 'var(--gold-light)'}; border: 1px solid var(--gold-primary);">
                ${isDelivered ? '✓' : '4'}
              </div>
              <h5 style="font-size: 0.8rem; margin: 0 0 0.15rem; color: var(--text-main);">${isDelivered ? 'Delivered' : 'Delivery'}</h5>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${isDelivered ? 'Received' : 'Pending'}</span>
            </div>
          </div>

          <div style="background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 1rem; margin-bottom: 1.2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem;">
              <div>
                <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">Live Consignment Telemetry</span>
                <p style="font-size: 0.84rem; color: var(--text-main); margin: 0.35rem 0 0;">
                  ${foundOrder.lastActivity || foundOrder.shiprocketRawStatus || `Status: ${foundOrder.status || 'Dispatched'}`}
                  ${foundOrder.lastLocation ? ` &bull; Location: <strong style="color: var(--gold-light);">${foundOrder.lastLocation}</strong>` : ''}
                </p>
              </div>
              ${trackingUrl ? `
                <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-gold" style="font-size: 0.78rem; padding: 0.5rem 1rem; text-decoration: none;">
                  Track on ${courier} ↗
                </a>
              ` : ''}
            </div>
          </div>
        `;
      }

      this.showToast(`Loaded live telemetry for #${foundOrder.orderId || foundOrder.id}`);
    } catch (err) {
      console.error("[Mytholis Track Order] Search error:", err);
      this.showToast(`Tracking inquiry error: ${err.message}`);
    }
  }

  /* Contact Form Submit */
  submitContactForm() {
    this.showToast("Inquiry dispatched. Concierge will respond within 2 hours.");
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
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const activeSizeObj = product.sizes.find(s => s.ml === this.selectedSize) || product.sizes[product.sizes.length - 1] || product.sizes[0];
    const engravingEl = document.getElementById('engraving-text');
    const engraving = engravingEl ? engravingEl.value.trim() : '';

    store.addToCart(productId, activeSizeObj.ml, engraving, 1);
    this.showToast("Fragrance added to your cart.");
    this.openCartModal();
  }

  /* Instant Quick Add from Catalog Card or Quiz Outcome */
  quickAddToCart(productId, ml = null, price = null) {
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const targetSize = ml 
      ? (product.sizes.find(s => s.ml === ml) || product.sizes[0])
      : (product.sizes[product.sizes.length - 1] || product.sizes[0]);
    
    store.addToCart(productId, targetSize.ml, '', 1);
    this.showToast(`${product.name} (${targetSize.ml}ml) added to your cart.`);
    this.openCartModal();
  }

  /* Select Size on Catalog Card without opening full modal */
  selectCardSize(event, productId, ml, price) {
    if (event) event.stopPropagation();
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId);
    if (!product) return;

    // Update active pill styling on this card
    const cardEl = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (cardEl) {
      cardEl.querySelectorAll('.card-size-pill').forEach(pill => {
        if (pill.innerText.includes(`${ml}ml`)) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
      const priceEl = document.getElementById(`card-price-${productId}`);
      if (priceEl) {
        priceEl.innerText = store.formatPrice(price);
      }
      const buyBtn = document.getElementById(`card-buy-btn-${productId}`);
      if (buyBtn) {
        buyBtn.setAttribute('onclick', `event.stopPropagation(); app.quickAddToCart('${productId}', ${ml}, ${price})`);
      }
    }
  }

  /* Mobile Sticky Bottom Buy Bar Trigger - 1-Click Fastrr Checkout */
  stickyBuyAction(event) {
    if (store.currentView === 'product' && store.selectedProductId) {
      return this.buyNowFastrr(store.selectedProductId, event);
    } else {
      return this.buyNowFastrr('mytholis-discovery-set', event);
    }
  }

  /* --------------------------------------------------------------------------
     BUY BUTTONS: WHATSAPP CONCIERGE & RAZORPAY / UPI
     -------------------------------------------------------------------------- */

  buyNowWhatsApp(productId) {
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const activeSizeObj = product.sizes.find(s => s.ml === this.selectedSize) || product.sizes[product.sizes.length - 1] || product.sizes[0];
    const size = activeSizeObj.ml;
    const price = activeSizeObj.price;
    const engravingEl = document.getElementById('engraving-text');
    const engraving = engravingEl ? engravingEl.value.trim() : '';

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to order:\n*${product.name}*\nVolume: ${size}ml\nTotal Price: ${store.formatPrice(price)} (Incl. all taxes)\n${engraving ? `Complimentary Engraving: "${engraving}"\n` : ''}Shipping: Pan-India Express Armored Delivery\n\nPlease share payment details (UPI / Bank Transfer) to confirm my order.`;

    window.open(`https://wa.me/917770009170?text=${encodeURIComponent(text)}`, '_blank');
  }

  checkoutCartWhatsApp() {
    if (store.cart.length === 0) return;
    const baseSubtotal = store.getCartTotal();
    const discount = store.getDiscountAmount(baseSubtotal);
    const finalAmount = Math.max(0, baseSubtotal - discount);
    const appliedReward = store.getAppliedReward();

    const itemsList = store.cart.map(i => `• ${i.name} (${i.size}ml × ${i.quantity}) ${i.engraving ? `[Engraved: "${i.engraving}"]` : ''} - ${store.formatPrice(i.price * i.quantity)}`).join('\n');

    let rewardLine = '';
    if (appliedReward) {
      if (appliedReward.type === 'discount') {
        rewardLine = `\n*Mythos Concession (${appliedReward.code}):* -${store.formatPrice(discount)}\n`;
      } else if (appliedReward.type === 'gift') {
        rewardLine = `\n*Complimentary Vault Gift:* ${appliedReward.giftItem} (₹0)\n`;
      }
    }

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to checkout my Mytholis Vault Cart:\n\n${itemsList}${rewardLine}\n*Total Amount:* ${store.formatPrice(finalAmount)} (Incl. 18% GST)\n*Delivery:* Free Express Armored Shipping across India\n\nPlease assist with UPI / Razorpay payment instructions.`;

    window.open(`https://wa.me/917770009170?text=${encodeURIComponent(text)}`, '_blank');
  }

  /* Fastrr / Shiprocket 1-Click Checkout Gateway Integration */
  async buyNowFastrr(productId, event) {
    if (event) event.preventDefault();
    const product = (typeof MYTHOLIS_CATALOG !== 'undefined' ? MYTHOLIS_CATALOG.find(p => p.id === productId) : null) || { id: productId };
    const size = this.selectedSize || 50;
    const items = [{
      productId: product.id,
      size: size,
      quantity: 1
    }];
    await this.initiateFastrrCheckout(items, event, window.location.origin + '/#track-order?product=' + product.id);
  }

  async checkoutCartFastrr(event) {
    if (event) event.preventDefault();
    if (!store.cart || store.cart.length === 0) {
      this.showToast('Your cart is empty.');
      return;
    }
    const items = store.cart.map(item => ({
      productId: item.id || item.productId,
      size: item.size || 50,
      quantity: item.quantity || 1
    }));
    await this.initiateFastrrCheckout(items, event, window.location.origin + '/#track-order');
  }

  buildFastrrWidgetUrl(token, fallbackUrl) {
    const sellerDomain = document.getElementById('sellerDomain')?.value || 'mytholis.com';
    const checkoutBuyer = window.checkoutBuyer || 'https://fastrr-boost-ui.pickrr.com/';
    const channel = btoa(encodeURIComponent(JSON.stringify({
      shop_name: 'company-logo',
      shop_url: sellerDomain,
      redirectUrl: fallbackUrl,
      credInstalled: false,
      gpayInstalled: false
    })));
    const cartBase64 = btoa(encodeURIComponent(JSON.stringify([])));
    return `${checkoutBuyer}?platform=CUSTOM&customCheckoutToken=${token}&type=cart&channel=${channel}#cart=${cartBase64}`;
  }

  async generateFastrrTokenClient(items, redirectUrl) {
    try {
      const VARIANT_MAP = {
        'king-scar': { 8: '10011', 50: '10012', 100: '10013', default: '10012' },
        'petralux': { 8: '10021', 50: '10022', 100: '10023', default: '10022' },
        'oud-rion': { 8: '10031', 50: '10032', 100: '10033', default: '10032' },
        'spark': { 8: '10041', 50: '10042', 100: '10043', default: '10042' },
        'wood-sera': { 8: '10051', 50: '10052', 100: '10053', default: '10052' },
        'ash': { 8: '10061', 50: '10062', 100: '10063', default: '10062' },
        'mytholis-discovery-set': { 60: '10071', default: '10071' }
      };

      const fastrrItems = items.map(item => {
        let variantId = item.variant_id;
        if (!variantId && item.productId) {
          const sizeMap = VARIANT_MAP[item.productId] || {};
          const parsedSize = parseInt(item.size, 10);
          variantId = sizeMap[item.size] || sizeMap[parsedSize] || sizeMap[50] || sizeMap.default || '10022';
        }
        return {
          variant_id: String(variantId || '10022'),
          quantity: parseInt(item.quantity, 10) || 1
        };
      });

      const payload = {
        cart_data: { items: fastrrItems },
        redirect_url: redirectUrl,
        timestamp: new Date().toISOString()
      };

      const rawBody = JSON.stringify(payload);
      const secret = 'bgHG23KYS9CZi8Pvo2UgmuyBWlacgKqo';
      const apiKey = 'GkmYB8JVVgvPFLiN';

      const enc = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
      const hmacBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

      const resp = await fetch('https://checkout-api.shiprocket.com/api/v1/access-token/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Api-HMAC-SHA256': hmacBase64
        },
        body: rawBody
      });

      const resJson = await resp.json().catch(() => ({}));
      if (resJson.ok && resJson.result?.token) {
        return {
          success: true,
          token: resJson.result.token,
          order_id: resJson.result?.data?.order_id,
          redirect_url: redirectUrl
        };
      }
      return { success: false, error: resJson.error?.message || 'Token generation failed' };
    } catch (err) {
      console.warn('[Fastrr Direct Token Generation]:', err);
      return { success: false, error: err.message };
    }
  }

  async initiateFastrrCheckout(items, event, fallbackUrl = window.location.origin + '/#track-order') {
    this.showToast('Connecting to Fastrr 1-Click Checkout...');

    // Clear any previous Fastrr containers to prevent CHECKOUT_ALREADY_INIT collision
    document.getElementById('fastrr-main-container')?.remove();
    document.getElementById('headless-container')?.remove();
    document.getElementById('fastrr-pre-loader')?.remove();

    try {
      let res = null;

      // 1. Try local or remote API endpoint
      try {
        const response = await fetch('/api/fastrr/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            redirect_url: fallbackUrl
          })
        });

        if (response.ok) {
          res = await response.json().catch(() => null);
        }
      } catch (netErr) {
        console.warn('[Fastrr] Server endpoint fetch failed, falling back to direct token generator...');
      }

      // 2. Client-side direct fallback if server endpoint is 404/unavailable (e.g. preview mode or local testing)
      if (!res || !res.token) {
        res = await this.generateFastrrTokenClient(items, fallbackUrl);
      }

      if (res && res.success && res.token) {
        this.closeAllModals(false);
        this.showToast('Launching Fastrr 1-Click Checkout...');

        const widgetUrl = this.buildFastrrWidgetUrl(res.token, res.redirect_url || fallbackUrl);

        if (typeof window.HeadlessCheckout !== 'undefined' && typeof window.HeadlessCheckout.addToCart === 'function') {
          try {
            window.HeadlessCheckout.addToCart(event, res.token, {
              fallbackUrl: res.redirect_url || fallbackUrl
            });

            // Watchdog: If preloader doesn't hide within 3.5s, auto-hide preloader and make container interactive
            setTimeout(() => {
              const preloader = document.getElementById('fastrr-pre-loader');
              if (preloader) preloader.style.display = 'none';
              const mainContainer = document.getElementById('fastrr-main-container');
              if (mainContainer) mainContainer.style.pointerEvents = 'auto';
            }, 3500);
          } catch (sdkErr) {
            console.warn('[Fastrr Headless SDK notice]:', sdkErr);
            this.openFastrrIframeModal(widgetUrl, res.redirect_url || fallbackUrl);
          }
        } else {
          // If SDK is not ready, blocked by client ad-blocker, or on native WebView, mount direct Fastrr iframe
          this.openFastrrIframeModal(widgetUrl, res.redirect_url || fallbackUrl);
        }
      } else {
        console.warn('[Fastrr Checkout API Notice]:', res);
        this.showToast('Opening payment desk...');
        this.openRazorpayModal();
      }
    } catch (err) {
      console.error('[Fastrr Checkout Error]:', err);
      this.showToast('Opening payment desk...');
      this.openRazorpayModal();
    }
  }

  openFastrrIframeModal(iframeSrc, fallbackUrl) {
    let container = document.getElementById('headless-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'headless-container';
      container.innerHTML = `
        <div class="headless-modal" style="position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);">
          <div class="headless-modal-content" style="position: relative; width: 100%; max-width: 480px; height: 92vh; max-height: 850px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">
            <button id="headless-close-btn" onclick="document.getElementById('headless-container')?.remove(); document.body.style.overflow='auto';" style="position: absolute; top: 12px; right: 12px; z-index: 100000; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; width: 34px; height: 34px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
            <div class="headless-modal-body" style="width: 100%; height: 100%;">
              <iframe id="headless-iframe" src="${iframeSrc}" allow="geolocation; clipboard-read; clipboard-write; web-share" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      document.body.style.overflow = 'hidden';
    } else {
      const iframe = document.getElementById('headless-iframe');
      if (iframe) iframe.src = iframeSrc;
      container.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  buyNow(productId, event) {
    return this.buyNowFastrr(productId, event);
  }

  buyNowRazorpay(productId, event) {
    return this.buyNowFastrr(productId, event);
  }

  checkoutCart(event) {
    return this.checkoutCartFastrr(event);
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

    const codNotice = document.getElementById('cod-guardrail-notice');
    if (codNotice) {
      if (method === 'cod') {
        codNotice.style.display = 'block';
      } else {
        codNotice.style.display = 'none';
      }
    }
  }

  completeRazorpayPayment(amount) {
    const nameInput = document.getElementById('checkout-name');
    const phoneInput = document.getElementById('checkout-phone');
    const pincodeInput = document.getElementById('checkout-pincode');
    const addressInput = document.getElementById('checkout-address');

    const customerName = nameInput ? nameInput.value.trim() : (store.user.name || 'Mytholis Patron');
    const customerPhone = phoneInput ? phoneInput.value.trim() : (store.user.phone || '');
    const customerAddress = addressInput ? addressInput.value.trim() : (store.user.address || '');
    const customerPincode = pincodeInput ? pincodeInput.value.trim() : (store.user.pincode || '');

    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      this.showToast('Please provide a valid 10-digit mobile number for order delivery.');
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!customerAddress || customerAddress.length < 5) {
      this.showToast('Please provide your complete delivery address.');
      if (addressInput) addressInput.focus();
      return;
    }

    // Check payment method
    const activeMethodPill = document.querySelector('.razorpay-method-pill.active');
    const paymentMethod = activeMethodPill ? activeMethodPill.textContent.trim() : 'Razorpay 1-Tap';
    const isCOD = paymentMethod.toLowerCase().includes('cash on delivery') || paymentMethod.toLowerCase().includes('cod');

    // Retrieve live Razorpay Key from Firestore globalSettings, Vite env, or window global
    const rzpKey = (store.globalSettings && store.globalSettings.razorpayKeyId && store.globalSettings.razorpayKeyId.trim()) ||
                   (import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID && import.meta.env.VITE_RAZORPAY_KEY_ID.trim()) ||
                   (typeof window !== 'undefined' && window.RAZORPAY_KEY_ID) || '';

    // If Cash on Delivery is chosen
    if (isCOD) {
      this.finalizeOrderPlacement(amount, {
        customerName,
        customerPhone,
        customerAddress,
        customerPincode,
        paymentMethod: 'Cash on Delivery (COD)',
        paymentId: 'COD-PENDING'
      });
      return;
    }

    // Prepaid Order: Mandate valid Razorpay Key to prevent mocked orders
    if (!rzpKey) {
      console.warn("[Mytholis Payment] Razorpay Key ID not configured. Order will not be mocked.");
      this.showToast('Razorpay Gateway Inactive: Please configure your Razorpay Key ID in Sovereign Admin Settings (or select Cash on Delivery).');
      return;
    }

    if (!window.Razorpay) {
      this.showToast('Payment gateway library is loading. Please try again in a moment.');
      return;
    }

    // Launch official Razorpay standard payment modal with UPI, Cards, NetBanking
    const options = {
      key: rzpKey,
      amount: Math.round(Number(amount) * 100),
      currency: store.currency || 'INR',
      name: 'Mytholis Haute Parfumerie',
      description: 'Luxury Extrait Consignment',
      image: 'https://www.mytholis.com/favicon.png',
      prefill: {
        name: customerName,
        email: store.user.email || (typeof firebaseService !== 'undefined' && firebaseService.currentUser?.email) || '',
        contact: customerPhone
      },
      theme: {
        color: '#041812'
      },
      modal: {
        ondismiss: () => {
          this.showToast('Payment window closed.');
        }
      },
      handler: (response) => {
        console.log("[Razorpay] Payment successful:", response);
        this.finalizeOrderPlacement(amount, {
          customerName,
          customerPhone,
          customerAddress,
          customerPincode,
          paymentMethod: 'Razorpay UPI / Gateway',
          paymentId: response.razorpay_payment_id || `PAY-${Date.now()}`
        });
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        this.showToast(`Payment declined: ${resp.error?.description || 'Transaction unsuccessful'}`);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay invocation failed:", err);
      this.showToast(`Unable to launch Razorpay: ${err.message}`);
    }
  }

  finalizeOrderPlacement(amount, details = {}) {
    this.closeRazorpayModal();
    const purchasedItems = [...store.cart];
    const loyaltyResult = store.recordLoyaltyPurchase(purchasedItems, amount);

    let toastMsg = `Order of ${store.formatPrice(amount)} Placed! Earned +${loyaltyResult.spendEarned} Spendable & +${loyaltyResult.totalLegacyEarned} Legacy Mythos.`;
    if (loyaltyResult.milestoneMsg) {
      toastMsg += ' ' + loyaltyResult.milestoneMsg;
    }
    this.showToast(toastMsg);

    const generatedOrderId = `MYTH-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderRecord = {
      orderId: generatedOrderId,
      items: purchasedItems.map(i => ({ id: i.id, name: i.name, size: i.size, price: i.price, qty: i.quantity || 1 })),
      total: amount,
      status: details.paymentMethod?.includes('COD') ? 'Placed (COD)' : 'Payment Authorized',
      name: details.customerName,
      phone: details.customerPhone,
      address: details.customerAddress,
      pincode: details.customerPincode,
      paymentMethod: details.paymentMethod || 'Razorpay',
      paymentId: details.paymentId || '',
      date: new Date().toLocaleDateString('en-IN')
    };

    // Auto-persist customer delivery address & contact coordinates to profile for 1-tap checkout
    if (details.customerAddress) {
      store.user.address = details.customerAddress;
    }
    if (details.customerPhone && (!store.user.phone || store.user.phone.length < 5)) {
      store.user.phone = details.customerPhone;
    }
    if (details.customerPincode) {
      store.user.pincode = details.customerPincode;
    }
    if (details.customerName && (!store.user.name || store.user.name === 'Mytholis Patron')) {
      store.user.name = details.customerName;
    }
    store.saveLocalStorage('mytholis_user', store.user);

    // 1. Sync order to Firebase Firestore cloud database
    if (typeof firebaseService !== 'undefined') {
      firebaseService.recordOrderInCloud(orderRecord);
      firebaseService.updatePatronProfile({
        name: store.user.name,
        phone: store.user.phone,
        address: store.user.address,
        pincode: store.user.pincode
      }).catch(() => {});
    }

    // 2. Call serverless complete-order endpoint (with silent fallback)
    fetch('/api/complete-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData: orderRecord })
    }).catch(() => {});

    if (store.cart.length > 0) {
      store.cart = [];
      store.saveLocalStorage('mytholis_cart', []);
      store.notify();
    }
    this.navigateTo('track-order');
  }

  /* --------------------------------------------------------------------------
     THE CIRCLE OF LEGENDS - LOYALTY ACTION DISPATCHERS
     -------------------------------------------------------------------------- */

  redeemReward(rewardId) {
    const res = store.redeemMythosReward(rewardId);
    if (res.success) {
      this.showToast(`Concession ${res.code} added to your Active Vault Codes.`);
      this.renderProfileModalContent();
      this.renderCartModalContent();
    } else {
      this.showToast(res.error);
    }
  }

  applyCartRewardCode(code) {
    const res = store.applyRewardCode(code);
    if (res.success) {
      this.showToast(`Code ${code} applied to checkout.`);
      this.renderCartModalContent();
      this.renderProfileModalContent();
      const razorpayBody = document.getElementById('razorpay-modal-body');
      if (razorpayBody) {
        razorpayBody.innerHTML = Components.renderRazorpayModal(store.cart.length ? { id: null } : MYTHOLIS_CATALOG[0]);
      }
    } else {
      this.showToast(res.error);
    }
  }

  removeCartRewardCode() {
    store.removeAppliedRewardCode();
    this.showToast("Reward code removed from checkout.");
    this.renderCartModalContent();
    this.renderProfileModalContent();
    const razorpayBody = document.getElementById('razorpay-modal-body');
    if (razorpayBody) {
      razorpayBody.innerHTML = Components.renderRazorpayModal(store.cart.length ? { id: null } : MYTHOLIS_CATALOG[0]);
    }
  }

  copyRewardCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast(`Code ${code} copied to clipboard.`);
      }).catch(() => {
        this.showToast(`Code: ${code}`);
      });
    } else {
      this.showToast(`Code: ${code}`);
    }
  }

  completeUserInitiation() {
    const res = store.completeInitiation('dossier');
    if (res.success) {
      this.showToast(`Scent Initiate Honorific Awarded: +150 Spendable & +100 Legacy Mythos.`);
      this.renderProfileModalContent();
    } else {
      this.showToast("You are already an initiated member of The Circle of Legends.");
    }
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

  /* Dynamic Navbar Auth Updater */
  updateNavAuth() {
    const slot = document.getElementById('nav-auth-slot');
    if (!slot) return;

    const isLogged = store.isUserLoggedIn();
    const user = store.firebaseUser || store.user || (typeof firebaseService !== 'undefined' && firebaseService?.currentUser);
    const isAdminUser = store.isAdmin();

    if (isLogged && user) {
      const displayName = user.displayName || user.name || user.email || 'Patron';
      const initial = displayName.charAt(0).toUpperCase();
      const photoURL = user.photoURL || null;
      const adminCrown = isAdminUser ? `
        <button class="icon-btn sovereign-nav-admin-btn" onclick="app.navigateTo('admin')" title="👑 Open Sovereign Command Desk" style="margin-right: 0.4rem; color: var(--gold-primary); border: 1px solid rgba(212, 175, 55, 0.45); background: rgba(212, 175, 55, 0.15); border-radius: 50%; width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease;">
          <span style="font-size: 1.05rem;">👑</span>
        </button>
      ` : '';

      slot.innerHTML = `
        <div style="display: flex; align-items: center;">
          ${adminCrown}
          <button class="icon-btn vip-profile-btn" onclick="app.openProfileModal()" title="Client Profile (${displayName})" style="padding: 0; overflow: hidden; width: 38px; height: 38px; border-radius: 50%;">
            ${photoURL ? `
              <img src="${photoURL}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
            ` : `
              <span class="nav-avatar-initial">${initial}</span>
            `}
            <span class="vip-dot"></span>
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button class="nav-signin-btn" onclick="app.openAuthModal('signin')" title="Sign In / Register">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
          <span class="nav-signin-label">Sign In</span>
        </button>
      `;
    }

    const mobileAccountLink = document.getElementById('mobile-nav-account-link');
    if (mobileAccountLink) {
      if (isLogged) {
        if (isAdminUser) {
          mobileAccountLink.innerHTML = "👑 Sovereign Admin Desk";
          mobileAccountLink.setAttribute("onclick", "app.navigateTo('admin'); app.closeMobileMenu();");
        } else {
          mobileAccountLink.textContent = "Client Account & Orders";
          mobileAccountLink.setAttribute("onclick", "app.navigateTo('profile'); app.closeMobileMenu();");
        }
      } else {
        mobileAccountLink.textContent = "Sign In / Register";
        mobileAccountLink.setAttribute("onclick", "app.openAuthModal('signin'); app.closeMobileMenu();");
      }
    }
  }

  handleMobileAccountClick() {
    this.closeMobileMenu();
    if (store.isUserLoggedIn()) {
      this.navigateTo('profile');
    } else {
      this.openAuthModal('signin');
    }
  }

  /* Dedicated Auth Modal (Sign In / Register) */
  openAuthModal(tab = 'signin') {
    this.closeAllModals(false);
    this.activeAuthTab = tab;
    const modalBody = document.getElementById('profile-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderAuthModal(this.activeAuthTab);
    }
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  switchAuthTab(tab) {
    this.activeAuthTab = tab;
    this.phoneOtpSent = false;
    if (typeof firebaseService !== 'undefined') {
      firebaseService.clearRecaptcha();
    }
    const modalBody = document.getElementById('profile-modal-body');
    if (modalBody) {
      modalBody.innerHTML = Components.renderAuthModal(this.activeAuthTab);
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
    if (typeof firebaseService !== 'undefined') {
      firebaseService.clearRecaptcha();
    }
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  renderProfileModalContent() {
    const modalBody = document.getElementById('profile-modal-body');
    if (modalBody) {
      if (!store.isUserLoggedIn()) {
        modalBody.innerHTML = Components.renderAuthModal(this.activeAuthTab || 'phone');
      } else {
        modalBody.innerHTML = Components.renderProfileModal();
      }
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
    toast.innerHTML = `<span class="toast-text">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  simulateCheckout() {
    const purchased = [...store.cart];
    const total = store.getCartTotal();
    const result = store.recordLoyaltyPurchase(purchased, total);
    let msg = `Order placed. Earned +${result.spendEarned} Spendable & +${result.totalLegacyEarned} Legacy Mythos.`;
    if (result.milestoneMsg) msg += ' ' + result.milestoneMsg;
    this.showToast(msg);

    // Sync order to Firebase Firestore cloud database
    if (typeof firebaseService !== 'undefined') {
      firebaseService.recordOrderInCloud({
        orderId: `MYTH-${Math.floor(10000 + Math.random() * 90000)}`,
        items: purchased.map(i => ({ id: i.id, name: i.name, size: i.size, price: i.price, qty: i.quantity || 1 })),
        total: total,
        status: 'Order Placed'
      });
    }

    store.cart = [];
    store.saveLocalStorage('mytholis_cart', []);
    store.notify();
    this.closeCartModal();
  }

  searchTrackOrderModal() {
    const input = document.getElementById('modal-track-input');
    const val = input ? input.value.trim() : '';
    this.closeProfileModal();
    this.navigateTo('track-order');
    setTimeout(() => {
      const pageInput = document.getElementById('track-order-input');
      if (pageInput && val) {
        pageInput.value = val;
        this.searchTrackOrder();
      }
    }, 150);
  }

  /* User Profile Account Management & Patron Dossier Controller */
  setDossierTab(tab) {
    this.activeDossierTab = tab;
    this.renderProfileModalContent();
    if (store.currentView === 'profile' || store.currentView === 'user-profile') {
      this.renderCurrentView();
    }
  }

  async handleProfilePhotoUpload(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('Image size exceeds 10MB limit.');
      return;
    }

    this.showToast('Processing patron portrait...');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const targetDim = 256;
            canvas.width = targetDim;
            canvas.height = targetDim;
            const ctx = canvas.getContext('2d');

            // Center square crop
            const minSide = Math.min(img.width, img.height);
            const startX = (img.width - minSide) / 2;
            const startY = (img.height - minSide) / 2;
            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetDim, targetDim);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            // Update store
            store.user.photoURL = compressedDataUrl;
            if (store.firebaseUser) {
              store.firebaseUser.photoURL = compressedDataUrl;
            }
            store.saveLocalStorage('mytholis_user', store.user);
            store.notify();

            // Persist to Firebase Auth & Firestore
            if (typeof firebaseService !== 'undefined') {
              await firebaseService.updatePatronProfile({ photoURL: compressedDataUrl });
            }

            this.updateNavAuth();
            this.renderProfileModalContent();
            if (store.currentView === 'profile' || store.currentView === 'user-profile') {
              this.renderCurrentView();
            }
            this.showToast('Patron portrait updated successfully.');
          } catch (procErr) {
            console.error('[ProfilePhoto] Processing failed:', procErr);
            this.showToast('Failed to process image portrait.');
          }
        };
        img.onerror = () => {
          this.showToast('Unable to decode image file.');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[ProfilePhoto] File read error:', err);
      this.showToast('Error reading image file.');
    }
  }

  async handleRemoveProfilePhoto() {
    store.user.photoURL = null;
    if (store.firebaseUser) {
      store.firebaseUser.photoURL = null;
    }
    store.saveLocalStorage('mytholis_user', store.user);
    store.notify();

    if (typeof firebaseService !== 'undefined') {
      await firebaseService.updatePatronProfile({ photoURL: null });
    }

    this.updateNavAuth();
    this.renderProfileModalContent();
    if (store.currentView === 'profile' || store.currentView === 'user-profile') {
      this.renderCurrentView();
    }
    this.showToast('Patron portrait removed.');
  }

  async handleSaveDossierProfile(event) {
    if (event) event.preventDefault();

    // Look for inputs across both the Dedicated Profile View ('profile-edit-*') and the Modal Tabs ('dossier-*-input')
    const nameInput = document.getElementById('dossier-name-input') || document.getElementById('profile-edit-name');
    const phoneInput = document.getElementById('dossier-phone-input') || document.getElementById('profile-edit-phone');
    const addressInput = document.getElementById('dossier-address-input') || document.getElementById('profile-edit-address');
    const cityInput = document.getElementById('dossier-city-input') || document.getElementById('profile-edit-city');
    const stateInput = document.getElementById('dossier-state-input') || document.getElementById('profile-edit-state');
    const pincodeInput = document.getElementById('dossier-pincode-input') || document.getElementById('profile-edit-pincode');

    const name = nameInput ? nameInput.value.trim() : (store.user.name || '');
    const phone = phoneInput ? phoneInput.value.trim() : (store.user.phone || '');
    const address = addressInput ? addressInput.value.trim() : (store.user.address || '');
    const city = cityInput ? cityInput.value.trim() : (store.user.city || '');
    const state = stateInput ? stateInput.value.trim() : (store.user.state || '');
    const pincode = pincodeInput ? pincodeInput.value.trim() : (store.user.pincode || '');

    if (name) store.user.name = name;
    store.user.phone = phone;
    store.user.address = address;
    store.user.city = city;
    store.user.state = state;
    store.user.pincode = pincode;

    if (store.firebaseUser) {
      if (name) store.firebaseUser.displayName = name;
      store.firebaseUser.phone = phone;
    }

    store.saveLocalStorage('mytholis_user', store.user);
    store.notify();

    if (typeof firebaseService !== 'undefined') {
      await firebaseService.updatePatronProfile({
        name,
        phone,
        address,
        city,
        state,
        pincode
      });
    }

    this.showToast('Patron coordinates & profile saved.');
    this.updateNavAuth();
    this.setDossierTab('overview');
    this.renderProfileModalContent();
    if (store.currentView === 'profile' || store.currentView === 'user-profile') {
      this.renderCurrentView();
    }
  }

  async handleChangePassword(event) {
    if (event) event.preventDefault();

    const currPass = document.getElementById('security-curr-pass')?.value || '';
    const newPass = document.getElementById('security-new-pass')?.value || '';
    const confPass = document.getElementById('security-conf-pass')?.value || '';

    if (!newPass || newPass.length < 6) {
      this.showToast('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confPass) {
      this.showToast('New passwords do not match. Please verify.');
      return;
    }

    const btnEl = document.getElementById('btn-change-password');
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerText = 'Updating Master Password...';
    }

    try {
      const res = await firebaseService.updatePatronPassword(currPass, newPass);
      if (res.success) {
        this.showToast('Master password updated successfully.');
        const currEl = document.getElementById('security-curr-pass');
        const newEl = document.getElementById('security-new-pass');
        const confEl = document.getElementById('security-conf-pass');
        if (currEl) currEl.value = '';
        if (newEl) newEl.value = '';
        if (confEl) confEl.value = '';
        this.setDossierTab('overview');
      } else {
        this.showToast(res.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('[ChangePassword] Error:', err);
      this.showToast('Password update encountered an error.');
    } finally {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerText = 'Update Master Password';
      }
    }
  }

  async handleSendPasswordResetFromDossier() {
    const userEmail = store.firebaseUser?.email || store.user?.email;
    let targetEmail = userEmail;

    if (!targetEmail || targetEmail.endsWith('@phone.mytholis.com')) {
      targetEmail = prompt('Enter your personal email address to receive password setup instructions:');
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      this.showToast('Please provide a valid email address.');
      return;
    }

    this.showToast(`Dispatching password instructions to ${targetEmail}...`);
    try {
      const res = await firebaseService.sendPasswordReset(targetEmail);
      if (res.success) {
        this.showToast(`Password link dispatched to ${targetEmail}. Please check your inbox.`);
      } else {
        this.showToast(res.error || 'Failed to dispatch password link.');
      }
    } catch (err) {
      this.showToast('Error sending reset link.');
    }
  }

  async handleLinkEmailPassword(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('security-link-email')?.value?.trim();
    const pass = document.getElementById('security-link-pass')?.value;

    if (!email || !email.includes('@')) {
      this.showToast('Please enter a valid email address.');
      return;
    }
    if (!pass || pass.length < 6) {
      this.showToast('Password must be at least 6 characters.');
      return;
    }

    const btnEl = document.getElementById('btn-link-email-pass');
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerText = 'Linking Credentials...';
    }

    try {
      const res = await firebaseService.linkEmailPasswordToPhone(email, pass);
      if (res.success) {
        this.showToast(`Email ${email} linked! You can now sign in via SMS OTP or Password.`);
        this.renderProfileModalContent();
      } else {
        this.showToast(res.error || 'Failed to link email & password.');
      }
    } catch (err) {
      console.error('[LinkEmailPassword] Error:', err);
      this.showToast('Encountered an error linking credentials.');
    } finally {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerText = 'Link Email & Password to Account';
      }
    }
  }

  updateUserProfile(event) {
    return this.handleSaveDossierProfile(event);
  }

  /* Firebase Authentication Handlers */
  async handleSendPhoneOtp() {
    if (typeof firebaseService === 'undefined') return;
    const countryCodeEl = document.getElementById('auth-country-code');
    const phoneEl = document.getElementById('auth-phone-number');
    const btnEl = document.getElementById('btn-send-phone-otp');

    const countryCode = countryCodeEl ? countryCodeEl.value : '+91';
    const rawNumber = phoneEl ? phoneEl.value.trim().replace(/[^0-9]/g, '') : '';

    if (!rawNumber || rawNumber.length < 7) {
      this.showToast('Please enter a valid mobile phone number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${rawNumber}`;
    this.authPhoneNumber = fullPhoneNumber;

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Dispatching SMS...`;
    }

    this.showToast(`Requesting SMS passcode for ${fullPhoneNumber}...`);
    const res = await firebaseService.sendPhoneOtp(fullPhoneNumber, 'recaptcha-container');

    if (res.success) {
      this.phoneOtpSent = true;
      this.showToast(`Passcode dispatched to ${fullPhoneNumber}!`);
      this.renderProfileModalContent();
      setTimeout(() => {
        const otpInput = document.getElementById('auth-phone-otp');
        if (otpInput) otpInput.focus();
      }, 100);
    } else {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = 'Request SMS Passcode';
      }
      this.showToast(res.error);
    }
  }

  async handleVerifyPhoneOtp() {
    if (typeof firebaseService === 'undefined') return;
    const otpInput = document.getElementById('auth-phone-otp');
    const btnEl = document.getElementById('btn-verify-phone-otp');
    const otp = otpInput ? otpInput.value.trim() : '';

    if (!otp || otp.length !== 6) {
      this.showToast('Please enter the complete 6-digit passcode.');
      return;
    }

    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Verifying...`;
    }

    this.showToast('Verifying Sanctum Passcode...');
    const res = await firebaseService.verifyPhoneOtp(otp);

    if (res.success) {
      this.showToast(`Welcome to House Mytholis! Signed in via Mobile.`);
      this.phoneOtpSent = false;
      this.authPhoneNumber = '';
      this.updateNavAuth();
      this.closeProfileModal();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = 'Verify & Enter Sanctum';
      }
      this.showToast(res.error);
    }
  }

  changeAuthPhoneNumber() {
    this.phoneOtpSent = false;
    this.renderProfileModalContent();
  }

  async resendAuthPhoneOtp() {
    if (!this.authPhoneNumber) {
      this.changeAuthPhoneNumber();
      return;
    }
    this.showToast(`Resending SMS passcode to ${this.authPhoneNumber}...`);
    const res = await firebaseService.sendPhoneOtp(this.authPhoneNumber, 'recaptcha-container');
    if (res.success) {
      this.showToast('New 6-digit passcode dispatched via SMS!');
    } else {
      this.showToast(res.error);
    }
  }

  async handleForgotPassword() {
    const emailEl = document.getElementById('auth-email-input');
    let email = emailEl ? emailEl.value.trim() : '';
    if (!email) {
      email = prompt('Enter your registered Patron email to receive a password reset link:');
    }
    if (!email) return;

    this.showToast(`Dispatching password reset link to ${email}...`);
    const res = await firebaseService.sendPasswordReset(email);
    if (res.success) {
      this.showToast(`Password reset link dispatched to ${email}. Check your inbox!`);
    } else {
      this.showToast(res.error);
    }
  }

  async handleGoogleSignIn() {
    if (typeof firebaseService === 'undefined') return;
    this.showToast('Connecting to Google VIP Sign-In...');
    const result = await firebaseService.signInWithGoogle();
    if (result.success) {
      this.showToast(`Welcome to House Mytholis, ${result.user.displayName || result.user.email}!`);
      this.updateNavAuth();
      this.closeProfileModal();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      this.showToast(`Sign-in error: ${result.error}`);
    }
  }

  async handleEmailSignIn() {
    if (typeof firebaseService === 'undefined') return;
    const emailEl = document.getElementById('auth-email-input');
    const passEl = document.getElementById('auth-password-input');
    const email = emailEl ? emailEl.value.trim() : '';
    const pass = passEl ? passEl.value : '';

    if (!email || !pass) {
      this.showToast('Please provide both patron email and password.');
      return;
    }

    this.showToast('Authenticating VIP Dossier...');
    const result = await firebaseService.signInWithEmail(email, pass);
    if (result.success) {
      this.showToast(`Welcome back, ${result.user.displayName || result.user.email}!`);
      this.updateNavAuth();
      this.closeProfileModal();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      this.showToast(result.error);
    }
  }

  async handleEmailSignUp() {
    if (typeof firebaseService === 'undefined') return;
    const nameEl = document.getElementById('signup-name-input');
    const emailEl = document.getElementById('signup-email-input') || document.getElementById('auth-email-input');
    const phoneEl = document.getElementById('signup-phone-input');
    const passEl = document.getElementById('signup-password-input') || document.getElementById('auth-password-input');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const pass = passEl ? passEl.value : '';

    if (!email || !pass) {
      this.showToast('Please provide both patron email and password.');
      return;
    }
    if (pass.length < 6) {
      this.showToast('Password must be at least 6 characters.');
      return;
    }

    this.showToast('Registering new VIP Patron Account...');
    const result = await firebaseService.signUpWithEmail(email, pass, name);
    if (result.success) {
      if (name) store.user.name = name;
      if (phone) store.user.phone = phone;
      store.user.email = email;
      store.user.isLoggedIn = true;
      store.saveLocalStorage('mytholis_user', store.user);
      store.notify();
      this.showToast(`VIP Dossier Account Activated for ${result.user.email}!`);
      this.updateNavAuth();
      this.closeProfileModal();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      this.showToast(result.error);
    }
  }

  async handleFirebaseSignOut() {
    await this.logoutUser();
  }

  async logoutUser() {
    if (typeof firebaseService !== 'undefined') {
      await firebaseService.signOut();
    }
    store.logout();
    this.closeProfileModal();
    this.updateNavAuth();
    this.showToast("Signed out of your client session.");
    if (store.currentView === 'profile' || store.currentView === 'user-profile') {
      this.navigateTo('home');
    }
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

  /* Preload Hero Card Backgrounds for Instant Display */
  initHeroCardBackgroundSwitch() {
    const bgFiles = [
      'assets/hero/kingscarbg.webp',
      'assets/hero/kingscarcard.webp',
      'assets/hero/oudrionbg.webp',
      'assets/hero/oudrioncard.webp',
      'assets/hero/sparkbg.webp',
      'assets/hero/sparkcard.webp'
    ];
    bgFiles.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  /* Currency Controller Methods */
  setCurrency(code) {
    store.setCurrency(code);
    this.renderProfileModalContent();
    this.renderCartModalContent();
    this.renderWishlistModalContent();
    this.renderCurrentView();
    this.showToast(`Currency updated to ${code}.`);
  }

  /* ==========================================================================
     SANCTUM COMMAND - SOVEREIGN OPERATIONS & DISPATCH DESK CONTROLLER
     ========================================================================== */
  setAdminTab(tabName) {
    this.adminActiveTab = tabName;
    this.renderCurrentView();
  }

  async handleAdminGoogleSignIn() {
    if (typeof firebaseService === 'undefined') {
      this.showToast('Firebase authentication module unavailable.');
      return;
    }
    const res = await firebaseService.signInWithGoogle();
    if (res.success && res.user) {
      if (store.isAdmin()) {
        this.showToast('Sovereign Command: High Sovereign Authenticated.');
        await this.loadAdminDashboard();
      } else {
        this.showToast('Authenticated, but this account lacks Sovereign Administrator privileges.');
        this.renderCurrentView();
      }
    } else {
      this.showToast(`Authentication failed: ${res.error || 'User cancelled'}`);
    }
  }

  async loadAdminDashboard() {
    if (!store.isAdmin()) {
      return;
    }
    this.adminLoading = true;
    try {
      if (typeof firebaseService !== 'undefined') {
        const res = await firebaseService.fetchAdminDashboardData();
        if (res && res.success && res.data) {
          this.adminData = res.data;
          this.renderCurrentView();
        }
      }
    } catch (err) {
      console.error("[Sovereign Command] Error loading dashboard:", err);
      this.showToast(`Sovereign Command notice: ${err.message}`);
    } finally {
      this.adminLoading = false;
    }
  }

  async refreshAdminDashboard() {
    this.showToast('Synchronizing Sovereign cloud ledger with Firestore...');
    await this.loadAdminDashboard();
    this.showToast('Sovereign Command: Live cloud ledger synchronized.');
  }

  // --- Module B: Order, Payment & COD Command Handlers ---
  filterAdminOrders() {
    const searchInput = document.getElementById('admin-order-search');
    const filterStatus = document.getElementById('admin-order-filter-status');
    const filterType = document.getElementById('admin-order-filter-type');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const statusVal = (filterStatus?.value || 'ALL').toUpperCase();
    const typeVal = (filterType?.value || 'ALL').toUpperCase();

    const orderCards = document.querySelectorAll('.sovereign-order-card');
    orderCards.forEach(card => {
      const cardId = (card.getAttribute('data-order-id') || '').toLowerCase();
      const cardPatron = (card.getAttribute('data-patron') || '').toLowerCase();
      const cardPhone = (card.getAttribute('data-phone') || '').toLowerCase();
      const cardStatus = (card.getAttribute('data-status') || '').toUpperCase();
      const cardType = (card.getAttribute('data-payment-type') || '').toUpperCase();

      const matchesSearch = !query || cardId.includes(query) || cardPatron.includes(query) || cardPhone.includes(query);
      const matchesStatus = statusVal === 'ALL' || cardStatus === statusVal;
      const matchesType = typeVal === 'ALL' || cardType === typeVal;

      if (matchesSearch && matchesStatus && matchesType) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  async updateAdminOrderStatus(orderId, newStatus) {
    try {
      if (typeof firebaseService === 'undefined') return;
      this.showToast(`Updating Order #${orderId} status to ${newStatus}...`);
      const res = await firebaseService.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        const order = (this.adminData.orders || []).find(o => (o.id || o.orderId) === orderId);
        if (order) order.status = newStatus;
        this.showToast(`Order #${orderId} status updated to ${newStatus}.`);
        this.renderCurrentView();
      } else {
        this.showToast(`Failed to update status: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] updateAdminOrderStatus error:", err);
      this.showToast(`Status update failed: ${err.message}`);
    }
  }

  async toggleAdminPaymentStatus(orderId, currentStatus) {
    try {
      if (typeof firebaseService === 'undefined') return;
      const isCurrentlyPaid = (currentStatus || '').toLowerCase() === 'paid';
      const newStatus = isCurrentlyPaid ? 'Pending' : 'Paid';

      this.showToast(`Switching payment status to ${newStatus}...`);
      const res = await firebaseService.updateOrderStatus(orderId, { paymentStatus: newStatus });
      if (res.success) {
        const order = (this.adminData.orders || []).find(o => (o.id || o.orderId) === orderId);
        if (order) order.paymentStatus = newStatus;

        if (newStatus === 'Paid') {
          this.showToast(`Order #${orderId} marked as Paid. Patron loyalty processed.`);
        } else {
          this.showToast(`Order #${orderId} marked as Pending.`);
        }
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Failed to toggle payment: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] toggleAdminPaymentStatus error:", err);
      this.showToast(`Payment toggle failed: ${err.message}`);
    }
  }

  async saveAdminOrderTracking(orderId) {
    const courierEl = document.getElementById(`courier-${orderId}`);
    const awbEl = document.getElementById(`awb-${orderId}`);
    const trackingUrlEl = document.getElementById(`tracking-url-${orderId}`);

    const courierName = courierEl ? courierEl.value.trim() : 'BlueDart Express';
    const trackingNumber = awbEl ? awbEl.value.trim() : '';
    const trackingUrl = trackingUrlEl ? trackingUrlEl.value.trim() : '';

    try {
      if (typeof firebaseService === 'undefined') return;
      const res = await firebaseService.updateOrderStatus(orderId, {
        courierName,
        trackingNumber,
        trackingUrl: trackingUrl || (trackingNumber ? `https://www.bluedart.com/tracking?handler=t&awb=awb&numbers=${trackingNumber}` : '')
      });

      if (res.success) {
        const order = (this.adminData.orders || []).find(o => (o.id || o.orderId) === orderId);
        if (order) {
          order.courierName = courierName;
          order.trackingNumber = trackingNumber;
          order.trackingUrl = trackingUrl;
        }
        this.showToast(`Consignment courier & AWB saved for #${orderId}.`);
      } else {
        this.showToast(`Failed saving courier details: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] saveAdminOrderTracking error:", err);
      this.showToast(`Courier update error: ${err.message}`);
    }
  }

  verifyCodWhatsApp(orderId, phone, total) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      this.showToast('No valid WhatsApp phone number found for this patron.');
      return;
    }
    const msg = `Dear Patron,\n\nThis is Mytholis Haute Parfumerie regarding your bespoke fragrance order #${orderId} with Cash on Delivery (Payable: ₹${total}).\n\nTo initiate hand-crafted bottling and obsidian wax sealing of your flacon, please reply *CONFIRM* to this message.\n\nWarmest regards,\nThe Sovereign Sanctum | Mytholis Haute Parfumerie`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  sendDispatchWhatsApp(orderId, phone) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      this.showToast('No valid WhatsApp phone number found for this patron.');
      return;
    }

    const order = (this.adminData.orders || []).find(o => (o.id || o.orderId) === orderId) || {};
    const courier = order.courierName || 'BlueDart Express';
    const awb = order.trackingNumber || 'Active in Transit';
    const trackingUrl = order.trackingUrl || 'https://mytholis.com/#track-order';

    const msg = `Dear Patron,\n\nYour Mytholis Haute Parfumerie consignment (Order #${orderId}) has been sealed with our obsidian wax crest and dispatched via ${courier}.\n\nArmored Tracking AWB: ${awb}\nTrack live at: ${trackingUrl}\n\nWear your legend.\n— The Mytholis Sovereign Desk`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // --- Module C: Fragrance Vault & Product CRUD Handlers ---
  async seedCatalogToFirestore() {
    if (typeof firebaseService === 'undefined') return;
    if (!confirm('Seed local default catalog (6 Extrait de Parfum creations at 40% concentration) to Firestore? Existing products will be preserved.')) {
      return;
    }

    this.showToast('Seeding default catalog to Firestore products collection...');
    const catalog = store.getProducts();
    const res = await firebaseService.seedProductsToFirestore(catalog);
    if (res.success) {
      this.showToast(`Catalog sync complete! ${res.count} products seeded to Firestore.`);
      await this.loadAdminDashboard();
    } else {
      this.showToast(`Catalog seeding failed: ${res.error}`);
    }
  }

  openProductEditorModal(productId = null) {
    let prod = null;
    if (productId) {
      prod = (this.adminData.products || store.getProducts()).find(p => p.id === productId);
    }
    const modalHtml = AdminComponents.renderProductModal(prod);
    this.injectAdminModal(modalHtml);
  }

  async saveAdminProduct(event) {
    event.preventDefault();
    try {
      const getVal = id => document.getElementById(id)?.value?.trim() || '';
      const getNum = id => Number(document.getElementById(id)?.value || 0);
      const getChecked = id => Boolean(document.getElementById(id)?.checked);

      const prodData = {
        id: getVal('prod-id'),
        name: getVal('prod-name'),
        tagline: getVal('prod-tagline'),
        category: getVal('prod-category'),
        price: getNum('prod-price'),
        compareAtPrice: getNum('prod-compare-price'),
        stock: getNum('prod-stock'),
        inStock: getChecked('prod-instock'),
        isFeatured: getChecked('prod-featured'),
        size: getVal('prod-size'),
        concentration: getVal('prod-concentration'),
        notes: {
          top: getVal('prod-notes-top'),
          heart: getVal('prod-notes-heart'),
          base: getVal('prod-notes-base'),
          accords: getVal('prod-notes-accords')
        },
        batchCode: getVal('prod-batch'),
        macerationDate: getVal('prod-maceration'),
        image: getVal('prod-image'),
        description: getVal('prod-description')
      };

      this.showToast('Saving fragrance to vault catalog...');
      const res = await firebaseService.saveProduct(prodData);
      if (res.success) {
        this.closeAdminModal();
        this.showToast(`Fragrance "${prodData.name}" saved to vault.`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Failed to save product: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] saveAdminProduct error:", err);
      this.showToast(`Error saving fragrance: ${err.message}`);
    }
  }

  async deleteAdminProduct(productId) {
    if (!confirm(`Are you certain you wish to purge "${productId}" from the vault catalog?`)) {
      return;
    }
    try {
      const res = await firebaseService.deleteProduct(productId);
      if (res.success) {
        this.showToast(`Fragrance ${productId} removed from catalog.`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Failed to delete: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] deleteAdminProduct error:", err);
      this.showToast(`Delete failed: ${err.message}`);
    }
  }

  async updateProductInline(productId, field, value) {
    try {
      let finalVal = value;
      if (field === 'price' || field === 'stock') {
        finalVal = Number(value);
      } else if (field === 'inStock') {
        finalVal = Boolean(value);
      }
      const res = await firebaseService.updateProductQuick(productId, { [field]: finalVal });
      if (res.success) {
        const prod = (this.adminData.products || []).find(p => p.id === productId);
        if (prod) prod[field] = finalVal;
        this.showToast(`Updated ${productId} ${field} to ${value}.`);
      } else {
        this.showToast(`Inline update failed: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] updateProductInline error:", err);
      this.showToast(`Update error: ${err.message}`);
    }
  }

  // --- Module D: Posts & Lore CRUD Handlers ---
  openPostEditorModal(postId = null) {
    let post = null;
    if (postId) {
      post = (this.adminData.posts || []).find(p => p.id === postId);
    }
    const modalHtml = AdminComponents.renderPostModal(post);
    this.injectAdminModal(modalHtml);
  }

  async saveAdminPost(event) {
    event.preventDefault();
    try {
      const getVal = id => document.getElementById(id)?.value?.trim() || '';
      const getChecked = id => Boolean(document.getElementById(id)?.checked);

      const postData = {
        id: getVal('post-id') || undefined,
        title: getVal('post-title'),
        subtitle: getVal('post-subtitle'),
        category: getVal('post-category'),
        coverImage: getVal('post-image'),
        linkedProductId: getVal('post-product-id'),
        body: getVal('post-body'),
        isPublished: getChecked('post-published')
      };

      this.showToast('Committing chronicle to lore archives...');
      const res = await firebaseService.savePost(postData);
      if (res.success) {
        this.closeAdminModal();
        this.showToast(`Chronicle "${postData.title}" archived successfully.`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Failed to archive chronicle: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] saveAdminPost error:", err);
      this.showToast(`Error archiving chronicle: ${err.message}`);
    }
  }

  async deleteAdminPost(postId) {
    if (!confirm('Are you certain you wish to purge this chronicle from the archives?')) {
      return;
    }
    try {
      const res = await firebaseService.deletePost(postId);
      if (res.success) {
        this.showToast('Chronicle purged from lore archives.');
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Purge failed: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] deleteAdminPost error:", err);
      this.showToast(`Delete failed: ${err.message}`);
    }
  }

  // --- Module E: Patrons, Mythos & Tiers Handlers ---
  filterAdminPatrons() {
    const input = document.getElementById('admin-patron-search');
    const query = (input?.value || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.sovereign-patron-card');
    rows.forEach(row => {
      const name = (row.getAttribute('data-name') || '').toLowerCase();
      const email = (row.getAttribute('data-email') || '').toLowerCase();
      const phone = (row.getAttribute('data-phone') || '').toLowerCase();
      if (!query || name.includes(query) || email.includes(query) || phone.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  openAdjustMythosModal(uid, name, currentPoints) {
    const modalHtml = AdminComponents.renderAdjustMythosModal(uid, name, currentPoints);
    this.injectAdminModal(modalHtml);
  }

  async submitAdjustMythos(event, argUid = null) {
    if (event) event.preventDefault();
    try {
      const uid = argUid || document.getElementById('adjust-mythos-uid')?.value;
      const deltaInput = document.getElementById('adjust-mythos-delta');
      const delta = Number(deltaInput?.value || 0);
      const reason = document.getElementById('adjust-mythos-reason')?.value?.trim() || 'Sovereign adjustment';

      if (!uid) {
        this.showToast('Error: Missing patron UID.');
        return;
      }
      if (!delta && delta !== 0) {
        this.showToast('Please enter a valid coin adjustment amount.');
        return;
      }

      this.showToast(`Adjusting Mythos balance (${delta > 0 ? '+' : ''}${delta}M)...`);
      const res = await firebaseService.adjustPatronMythos(uid, delta, reason);
      if (res.success) {
        this.closeAdminModal();
        this.showToast(`Mythos adjusted. New balance: ${res.newBalance}M.`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Adjustment failed: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] submitAdjustMythos error:", err);
      this.showToast(`Error adjusting coins: ${err.message}`);
    }
  }

  openOverrideTierModal(uid, name, currentLevel, currentBottles) {
    const modalHtml = AdminComponents.renderOverrideTierModal(uid, name, currentLevel, currentBottles);
    this.injectAdminModal(modalHtml);
  }

  async submitOverrideTier(event, argUid = null) {
    if (event) event.preventDefault();
    try {
      const uid = argUid || document.getElementById('override-tier-uid')?.value;
      const tierSelect = document.getElementById('override-tier-select') || document.getElementById('override-tier-level');
      const tier = tierSelect?.value || '1';
      const bottlesInput = document.getElementById('override-bottles-input') || document.getElementById('override-tier-bottles');
      const bottles = Number(bottlesInput?.value || 0);

      if (!uid) {
        this.showToast('Error: Missing patron UID.');
        return;
      }

      this.showToast(`Setting patron standing to Level ${tier}...`);
      const res = await firebaseService.overridePatronTier(uid, tier, bottles);
      if (res.success) {
        this.closeAdminModal();
        this.showToast(`Patron standing updated to Level ${tier}.`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Override failed: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] submitOverrideTier error:", err);
      this.showToast(`Error overriding tier: ${err.message}`);
    }
  }

  async togglePatronAdmin(uid, makeAdmin) {
    const label = makeAdmin ? 'Promote patron to Sovereign Administrator' : 'Revoke Sovereign Administrator privileges';
    if (!confirm(`Are you certain you wish to ${label.toLowerCase()}?`)) {
      return;
    }
    try {
      const res = await firebaseService.togglePatronAdmin(uid, makeAdmin);
      if (res.success) {
        this.showToast(`Permissions updated: ${makeAdmin ? 'Admin Granted' : 'Patron Standing'}`);
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Permission change failed: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] togglePatronAdmin error:", err);
      this.showToast(`Admin toggle error: ${err.message}`);
    }
  }

  // --- Module F: Global Settings & Promo Codes Handlers ---
  async saveGlobalSettings(event) {
    event.preventDefault();
    try {
      const getNum = id => {
        const el = document.getElementById(id);
        return el ? Number(el.value || 0) : null;
      };
      const getChecked = id => {
        const el = document.getElementById(id);
        return el ? Boolean(el.checked) : null;
      };
      const getStr = id => {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
      };

      const currentSettings = this.adminData.settings || store.globalSettings || {};

      const mythosEarn = getNum('setting-mythos-earn') ?? getNum('set-cashback-rate') ?? 3;
      const redemptionRatio = getNum('setting-redemption-ratio') ?? getNum('set-redemption-ratio') ?? 1;
      const maxRedeem = getNum('setting-max-redemption-pct') ?? getNum('set-max-cart-redeem') ?? 30;
      const signupBonus = getNum('setting-signup-bonus') ?? getNum('set-signup-bonus') ?? 100;
      const codEnabled = getChecked('setting-cod-enabled') ?? getChecked('set-cod-enabled') ?? true;
      const codFee = getNum('setting-cod-fee') ?? getNum('set-cod-fee') ?? 0;
      const maxCodAmount = getNum('setting-max-cod-amount') ?? getNum('set-max-cod-amount') ?? 15000;
      const freeShip = getNum('setting-free-ship-threshold') ?? getNum('set-free-shipping-threshold') ?? 3000;
      const shipFee = getNum('setting-standard-ship-fee') ?? getNum('set-shipping-fee') ?? 150;
      const razorpayKey = getStr('setting-razorpay-key-id') || currentSettings.razorpayKeyId || '';

      const settingsData = {
        ...currentSettings,
        mythosEarnPct: mythosEarn,
        cashbackRate: mythosEarn,
        redemptionRatio: redemptionRatio,
        maxMythosRedemptionPct: maxRedeem,
        maxCartRedeemPercent: maxRedeem,
        signupBonusMythos: signupBonus,
        signupBonus: signupBonus,
        codEnabled: codEnabled,
        codFee: codFee,
        maxCodAmount: maxCodAmount,
        freeShippingThreshold: freeShip,
        standardShippingFee: shipFee,
        shippingFee: shipFee,
        razorpayKeyId: razorpayKey
      };

      this.showToast('Synchronizing global commerce rules to Firestore...');
      const res = await firebaseService.saveGlobalSettings(settingsData);
      if (res.success) {
        this.showToast('Global economy & checkout rules saved.');
        await this.loadAdminDashboard();
      } else {
        this.showToast(`Failed saving settings: ${res.error}`);
      }
    } catch (err) {
      console.error("[Sovereign Command] saveGlobalSettings error:", err);
      this.showToast(`Settings save error: ${err.message}`);
    }
  }

  openAddPromoModal() {
    const modalHtml = AdminComponents.renderAddPromoModal();
    this.injectAdminModal(modalHtml);
  }

  async submitAddPromoCode(event) {
    if (event) event.preventDefault();
    try {
      const codeInput = document.getElementById('new-promo-code');
      const typeInput = document.getElementById('new-promo-type');
      const valInput = document.getElementById('new-promo-value');
      const minInput = document.getElementById('new-promo-minorder');

      const code = codeInput?.value?.trim().toUpperCase();
      const discountType = typeInput?.value || 'percent';
      const value = Number(valInput?.value || 0);
      const minOrder = Number(minInput?.value || 0);

      if (!code) {
        this.showToast('Voucher code is required.');
        return;
      }

      if (value <= 0) {
        this.showToast('Please enter a discount value greater than 0.');
        return;
      }

      const newEntry = { code, discountType, value, minOrder, active: true };

      // 1. Instantly mint into local Store & localStorage
      const updatedCodes = store.addPromoCode(newEntry);
      if (!this.adminData) this.adminData = {};
      if (!this.adminData.settings) this.adminData.settings = {};
      this.adminData.settings.promoCodes = updatedCodes;

      // 2. Immediately close modal and notify the founder
      this.closeAdminModal();
      this.showToast(`Sanctum Key ${code} minted into the Vault ledger!`);
      this.renderCurrentView();

      // 3. Persist to Cloud Firestore in background
      if (typeof firebaseService !== 'undefined') {
        const currentSettings = this.adminData.settings || store.globalSettings || {};
        await firebaseService.saveGlobalSettings({ ...currentSettings, promoCodes: updatedCodes });
      }
    } catch (err) {
      console.error("[Sovereign Command] submitAddPromoCode error:", err);
      this.showToast(`Mint key error: ${err.message}`);
    }
  }

  async togglePromoCode(target) {
    try {
      const updatedCodes = store.togglePromoCode(target);
      if (!this.adminData) this.adminData = {};
      if (!this.adminData.settings) this.adminData.settings = {};
      this.adminData.settings.promoCodes = updatedCodes;

      this.showToast('Promo Key status updated.');
      this.renderCurrentView();

      if (typeof firebaseService !== 'undefined') {
        const currentSettings = this.adminData.settings || store.globalSettings || {};
        await firebaseService.saveGlobalSettings({ ...currentSettings, promoCodes: updatedCodes });
      }
    } catch (err) {
      console.error("[Sovereign Command] togglePromoCode error:", err);
      this.showToast(`Toggle failed: ${err.message}`);
    }
  }

  async deletePromoCode(target) {
    if (!confirm(`Permanently revoke Sanctum Key?`)) return;
    try {
      const updatedCodes = store.deletePromoCode(target);
      if (!this.adminData) this.adminData = {};
      if (!this.adminData.settings) this.adminData.settings = {};
      this.adminData.settings.promoCodes = updatedCodes;

      this.showToast('Sanctum Key revoked.');
      this.renderCurrentView();

      if (typeof firebaseService !== 'undefined') {
        const currentSettings = this.adminData.settings || store.globalSettings || {};
        await firebaseService.saveGlobalSettings({ ...currentSettings, promoCodes: updatedCodes });
      }
    } catch (err) {
      console.error("[Sovereign Command] deletePromoCode error:", err);
      this.showToast(`Delete failed: ${err.message}`);
    }
  }

  // --- Modal Helpers for Sovereign Command ---
  injectAdminModal(html) {
    this.closeAdminModal();
    const container = document.createElement('div');
    container.id = 'sovereign-modal-backdrop';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  closeAdminModal() {
    const existing = document.getElementById('sovereign-modal-backdrop');
    if (existing) {
      existing.remove();
    }
  }
  
  /* ==========================================================================
     BACKEND INTEGRATION DIAGNOSTICS & HEALTH CHECK CONTROLLER
     ========================================================================== */
  renderAdminDiagnosticsBar() {
    const el = document.getElementById('admin-diagnostics-box');
    if (el && typeof Components !== 'undefined') {
      el.outerHTML = Components.renderBackendDiagnosticsBar();
    }
  }

  async testBackend() {
    this.backendDiagnostics = {
      running: true,
      clientConfig: { status: 'testing', label: 'Checking Vite client config...' },
      authState: { status: 'testing', label: 'Verifying Auth state...' },
      firestoreClient: { status: 'testing', label: 'Testing Client Firestore...' },
      serverlessApi: { status: 'testing', label: 'Pinging /api/health...' }
    };
    this.renderAdminDiagnosticsBar();
    this.showToast('Executing live backend health check across all 4 pillars...');

    // Pillar 1: Client Firebase Config
    try {
      const apiKey = (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey) || (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY);
      const projectId = (typeof firebaseConfig !== 'undefined' && firebaseConfig.projectId) || (import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID);

      if (apiKey && projectId) {
        this.backendDiagnostics.clientConfig = {
          status: 'ok',
          label: `Configured (${projectId})`
        };
      } else {
        this.backendDiagnostics.clientConfig = {
          status: 'error',
          label: 'Missing API Key / Project ID'
        };
      }
    } catch (e) {
      this.backendDiagnostics.clientConfig = { status: 'error', label: e.message };
    }

    // Pillar 2: Firebase Auth State
    try {
      const user = (typeof firebaseService !== 'undefined' && firebaseService.currentUser) || (typeof store !== 'undefined' && store.firebaseUser);
      if (user && user.email) {
        this.backendDiagnostics.authState = {
          status: 'ok',
          label: `Authenticated (${user.email})`
        };
      } else {
        this.backendDiagnostics.authState = {
          status: 'warn',
          label: 'Guest Mode (localStorage active)'
        };
      }
    } catch (e) {
      this.backendDiagnostics.authState = { status: 'error', label: e.message };
    }

    // Pillar 3: Client Firestore Lite Read
    try {
      await getDoc(doc(db, 'settings', 'inventory')).catch(async () => {
        return await getDoc(doc(db, '_diagnostics', 'health_check'));
      });
      this.backendDiagnostics.firestoreClient = {
        status: 'ok',
        label: 'Connected (Firestore Client Live)'
      };
    } catch (err) {
      this.backendDiagnostics.firestoreClient = {
        status: 'error',
        label: `Client error: ${err.code || err.message}`
      };
    }

    // Pillar 4: Serverless API & Admin SDK (/api/health)
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        const fsAdmin = data.status?.firestore_admin || 'ok';
        const authAdmin = data.status?.auth_admin || 'ok';
        this.backendDiagnostics.serverlessApi = {
          status: 'ok',
          label: `Live (Admin Firestore: ${fsAdmin}, Auth: ${authAdmin})`
        };
      } else if (res.status === 404) {
        this.backendDiagnostics.serverlessApi = {
          status: 'warn',
          label: '404 (Run "npx vercel dev" or deploy to Vercel for /api)'
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        this.backendDiagnostics.serverlessApi = {
          status: 'error',
          label: `Server error ${res.status}: ${errJson.error || 'Failed'}`
        };
      }
    } catch (err) {
      this.backendDiagnostics.serverlessApi = {
        status: 'warn',
        label: 'Offline (Vite dev active — run "npx vercel dev" to run /api locally)'
      };
    }

    this.backendDiagnostics.running = false;
    this.renderAdminDiagnosticsBar();
    this.showToast('Backend health diagnostics complete.');
    console.log('[Mytholis Backend Diagnostics Matrix]', this.backendDiagnostics);
    return this.backendDiagnostics;
  }

  /* ==========================================================================
     METHOD 3: SHIPROCKET PDF THERMAL LABEL REBRANDER CONTROLLER
     Client-side vector rebranding with 100% courier barcode integrity
     ========================================================================== */

  openLabelRebranderModal(targetOrder = null) {
    this.targetRebranderOrder = targetOrder;
    this.currentRebranderPdfBytes = null;
    this.activeRebrandedResult = null;

    let savedConfig = {};
    try {
      const localCfg = localStorage.getItem('mytholis_label_config');
      if (localCfg) savedConfig = JSON.parse(localCfg);
    } catch (e) {}

    if (typeof store !== 'undefined' && store.globalSettings && store.globalSettings.labelConfig) {
      savedConfig = { ...savedConfig, ...store.globalSettings.labelConfig };
    }

    const modalHtml = AdminComponents.renderLabelRebranderModal(targetOrder, savedConfig);
    this.injectAdminModal(modalHtml);
    this.setupLabelDropzone();

    // If order has an existing label URL, auto-load it
    if (targetOrder && targetOrder.labelUrl) {
      this.loadLabelFromUrl(targetOrder.labelUrl);
    }
  }

  openLabelRebranderForOrder(orderId) {
    const order = (this.adminData && this.adminData.orders) 
      ? this.adminData.orders.find(o => (o.orderId === orderId || o.id === orderId))
      : null;
    this.openLabelRebranderModal(order || { orderId });
  }

  setupLabelDropzone() {
    const dropzone = document.getElementById('label-dropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.processUploadedPdfFile(files[0]);
      }
    }, false);
  }

  handleLabelFileUpload(event) {
    const file = event.target?.files?.[0];
    if (file) {
      this.processUploadedPdfFile(file);
    }
  }

  async processUploadedPdfFile(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Please upload a valid PDF shipping label.');
      return;
    }

    this.updateRebranderStatus('Reading PDF label...', 'var(--gold-primary)');
    const dropLabel = document.getElementById('dropzone-label-text');
    if (dropLabel) {
      dropLabel.innerText = `📄 ${file.name} (${Math.round(file.size / 1024)} KB)`;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.currentRebranderPdfBytes = arrayBuffer;
      await this.triggerRebrandPreview();
      this.showToast('Shiprocket PDF loaded into Rebrander Studio.');
    } catch (err) {
      console.error('[LabelRebrander] Error reading file:', err);
      this.updateRebranderStatus('Error reading file', '#EF4444');
      this.showToast('Failed to load PDF file.');
    }
  }

  async loadLabelFromUrl(customUrl = null) {
    const url = customUrl || document.getElementById('rebrander-url-input')?.value?.trim();
    if (!url) {
      this.showToast('Please enter a valid PDF URL or upload a file.');
      return;
    }

    this.updateRebranderStatus('Fetching PDF from URL...', 'var(--gold-primary)');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      this.currentRebranderPdfBytes = arrayBuffer;

      const dropLabel = document.getElementById('dropzone-label-text');
      if (dropLabel) {
        dropLabel.innerText = `🔗 Label fetched from URL`;
      }

      await this.triggerRebrandPreview();
      this.showToast('Label fetched successfully.');
    } catch (err) {
      console.warn('[LabelRebrander] Fetch failed, likely CORS or invalid URL:', err);
      this.updateRebranderStatus('CORS/Network Block: Drag & Drop PDF instead', '#F59E0B');
      this.showToast('Direct URL blocked by courier CORS. Please drop the downloaded PDF file directly.');
    }
  }

  async loadSampleThermalLabel() {
    this.updateRebranderStatus('Generating sample 4x6 courier label...', 'var(--gold-primary)');
    try {
      const sampleBytes = await generateSampleThermalLabelPdf();
      this.currentRebranderPdfBytes = sampleBytes;

      const dropLabel = document.getElementById('dropzone-label-text');
      if (dropLabel) {
        dropLabel.innerText = `⚡ Sample 4x6 BlueDart Label Active`;
      }

      await this.triggerRebrandPreview();
      this.showToast('Sample 4x6 courier label generated. Notice the bottom "Sold By" box is now rebranded!');
    } catch (err) {
      console.error('[LabelRebrander] Failed to generate sample:', err);
      this.updateRebranderStatus('Error creating sample', '#EF4444');
    }
  }

  applyLabelPreset(presetKey) {
    const preset = LABEL_PRESETS[presetKey];
    if (!preset) return;

    const setVal = (id, badgeId, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
      const b = document.getElementById(badgeId);
      if (b) b.innerText = val;
    };

    setVal('slider-mask-x', 'val-mask-x', preset.maskX);
    setVal('slider-mask-y', 'val-mask-y', preset.maskY);
    setVal('slider-mask-w', 'val-mask-w', preset.maskWidth);
    setVal('slider-mask-h', 'val-mask-h', preset.maskHeight);
    setVal('slider-mask-font', 'val-mask-font', preset.fontSize);

    const topMaskCheck = document.getElementById('rebrander-top-mask');
    if (topMaskCheck) topMaskCheck.checked = !!preset.hasTopHeaderMask;

    this.triggerRebrandPreview();
  }

  updateMaskSliderVal(type, val) {
    const badge = document.getElementById(`val-mask-${type}`);
    if (badge) badge.innerText = val;

    const presetSelect = document.getElementById('rebrander-preset-select');
    if (presetSelect && presetSelect.value !== 'custom') {
      presetSelect.value = 'custom';
    }

    this.debounceTriggerRebrand();
  }

  debounceTriggerRebrand() {
    clearTimeout(this._rebrandDebounceTimer);
    this._rebrandDebounceTimer = setTimeout(() => {
      this.triggerRebrandPreview();
    }, 150);
  }

  getRebranderFormOptions() {
    const getNum = (id, def) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) : def;
    };
    const getStr = (id, def) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : def;
    };

    return {
      maskX: getNum('slider-mask-x', 14),
      maskY: getNum('slider-mask-y', 18),
      maskWidth: getNum('slider-mask-w', 260),
      maskHeight: getNum('slider-mask-h', 82),
      fontSize: getNum('slider-mask-font', 10),
      showLogo: document.getElementById('rebrander-show-logo')?.checked !== false,
      hasTopHeaderMask: document.getElementById('rebrander-top-mask')?.checked === true,
      topMaskX: 14,
      topMaskY: 375,
      topMaskWidth: 160,
      topMaskHeight: 45,
      brandTitle: getStr('rebrander-title', 'MYTHOLIS LUXURY PARFUMS'),
      brandSubtitle: getStr('rebrander-subtitle', 'Extrait de Parfum | Luxury Olfactory House'),
      returnAddressLine: getStr('rebrander-return', 'House of Mytholis • www.mytholis.com • concierge@mytholis.com'),
      logoUrl: '/logo.png'
    };
  }

  async triggerRebrandPreview() {
    if (!this.currentRebranderPdfBytes) return;

    this.updateRebranderStatus('Stamping vector brand...', 'var(--gold-primary)');
    try {
      const options = this.getRebranderFormOptions();
      const result = await rebrandShiprocketLabelPdf(this.currentRebranderPdfBytes, options);
      this.activeRebrandedResult = result;

      const iframe = document.getElementById('rebrander-preview-frame');
      const placeholder = document.getElementById('rebrander-preview-placeholder');

      if (iframe) {
        iframe.src = result.blobUrl;
        iframe.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }

      this.updateRebranderStatus('✓ Rebranded (100% Barcode Safe)', '#10B981');
    } catch (err) {
      console.error('[LabelRebrander] Rebranding failed:', err);
      this.updateRebranderStatus('Rebrand error: ' + err.message, '#EF4444');
    }
  }

  updateRebranderStatus(text, color = 'var(--gold-primary)') {
    const pill = document.getElementById('rebrander-status-pill');
    if (pill) {
      pill.innerText = text;
      pill.style.color = color;
      pill.style.borderColor = color;
    }
  }

  printRebrandedLabel() {
    if (!this.activeRebrandedResult || !this.activeRebrandedResult.blobUrl) {
      this.showToast('Please load a PDF label first before printing.');
      return;
    }
    this.showToast('Opening thermal print dialog...');
    printPdfBlob(this.activeRebrandedResult.blobUrl);
  }

  downloadRebrandedLabel(orderId = '') {
    if (!this.activeRebrandedResult || !this.activeRebrandedResult.blob) {
      this.showToast('Please load and rebrand a PDF label first.');
      return;
    }
    const filename = `MYTHOLIS-Label-${orderId || 'Rebranded'}.pdf`;
    downloadPdfBlob(this.activeRebrandedResult.blob, filename);
    this.showToast(`Downloaded ${filename}`);
  }

  async saveLabelCalibrationAsDefault() {
    const options = this.getRebranderFormOptions();
    const presetSelect = document.getElementById('rebrander-preset-select');
    options.preset = presetSelect ? presetSelect.value : 'custom';

    try {
      localStorage.setItem('mytholis_label_config', JSON.stringify(options));
    } catch (e) {}

    if (typeof firebaseService !== 'undefined' && firebaseService.saveGlobalSettings) {
      await firebaseService.saveGlobalSettings({ labelConfig: options });
    }

    this.showToast('Thermal calibration parameters saved as default.');
  }

  async saveRebrandedLabelToOrder(orderId) {
    if (!orderId) {
      this.showToast('No order associated with this session.');
      return;
    }
    if (!this.activeRebrandedResult) {
      this.showToast('Please generate a rebranded label preview first.');
      return;
    }

    this.showToast('Archiving rebrand metadata to Order #' + orderId + '...');
    try {
      const options = this.getRebranderFormOptions();
      if (typeof firebaseService !== 'undefined' && firebaseService.saveShiprocketOrderDetails) {
        await firebaseService.saveShiprocketOrderDetails(orderId, {
          rebrandedAt: new Date().toISOString(),
          rebrandedBy: firebaseService.currentUser?.email || 'admin',
          labelConfig: options
        });
      }
      this.showToast(`Order #${orderId} tagged with rebranded thermal label.`);
    } catch (err) {
      console.error('[LabelRebrander] Error saving to order:', err);
      this.showToast('Failed to save to order record.');
    }
  }
}

const app = new MytholisApp();

if (typeof window !== 'undefined') {
  window.MytholisApp = MytholisApp;
  window.app = app;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
