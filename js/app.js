/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION CONTROLLER & ROUTER
   Handles routing, event listeners, 3D tilt effects, ambiance, and toasts.
   ========================================================================== */

import gsap from 'gsap';
import { db, collection, getDocs, doc, getDoc, setDoc, firebaseConfig } from './firebase.js';

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

      // Gracefully sync local customer modifications up to Firestore cloud if authenticated
      if (typeof firebaseService !== 'undefined' && firebaseService.currentUser && !firebaseService.isSyncing) {
        firebaseService.pushLocalStateToCloud();
      }
    });

    // Initialize Firebase Auth & Realtime Firestore Sync
    if (typeof firebaseService !== 'undefined') {
      firebaseService.init(store, this);
    }

    // Hash & History router listeners for Deep-Linking and Browser Back-Button
    window.addEventListener('hashchange', () => this.handleHashRoute());
    window.addEventListener('popstate', () => this.handleHashRoute());

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

    // Support #admin (Sanctum Command Founder Desk)
    if (rawHash === 'admin') {
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
      const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
      const currentUser = (typeof firebaseService !== 'undefined' && firebaseService.currentUser) || store.firebaseUser;
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const isAuthorized = Boolean(configuredAdminEmail && userEmail && (userEmail === configuredAdminEmail));
      if (isAuthorized && !this.adminLoading && (!this.adminData.orders.length && !this.adminData.users.length)) {
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
  searchTrackOrder() {
    const input = document.getElementById('track-order-input');
    const val = input ? input.value.trim() : '';
    if (val) {
      this.showToast(`Tracking status updated for ${val}`);
    } else {
      this.showToast("Please enter an Order ID or Tracking Number");
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

  /* Mobile Sticky Bottom Buy Bar Trigger */
  stickyBuyAction() {
    if (store.currentView === 'product' && store.selectedProductId) {
      this.addProductToCart(store.selectedProductId);
    } else {
      // If on home/collections, quick add the coffret or top featured
      this.quickAddToCart('mytholis-discovery-set');
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

    // Check payment method
    const activeMethodPill = document.querySelector('.razorpay-method-pill.active');
    const paymentMethod = activeMethodPill ? activeMethodPill.textContent.trim() : 'Razorpay 1-Tap';
    const isCOD = paymentMethod.toLowerCase().includes('cash on delivery') || paymentMethod.toLowerCase().includes('cod');

    const rzpKey = (import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) || '';

    // If Razorpay SDK is available and live key is provided
    if (window.Razorpay && rzpKey && !isCOD) {
      const options = {
        key: rzpKey,
        amount: Math.round(Number(amount) * 100),
        currency: store.currency || 'INR',
        name: 'Mytholis Haute Parfumerie',
        description: 'Luxury Extrait Consignment',
        image: 'https://mytholis.com/favicon.png',
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
        return;
      } catch (err) {
        console.warn("Razorpay invocation failed, proceeding with direct authorization fallback:", err);
      }
    }

    // Direct authorization or COD
    this.finalizeOrderPlacement(amount, {
      customerName,
      customerPhone,
      customerAddress,
      customerPincode,
      paymentMethod: isCOD ? 'Cash on Delivery (COD)' : 'Razorpay Direct Auth',
      paymentId: isCOD ? 'COD-PENDING' : `AUTH-${Date.now()}`
    });
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

    // 1. Sync order to Firebase Firestore cloud database
    if (typeof firebaseService !== 'undefined') {
      firebaseService.recordOrderInCloud(orderRecord);
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
    this.showToast(`Consignment ${val || 'MYTH-89021'} telemetry verified.`);
  }

  /* User Profile Account Management */
  updateUserProfile(event) {
    if (event) event.preventDefault();
    const nameEl = document.getElementById('profile-edit-name');
    const phoneEl = document.getElementById('profile-edit-phone');
    const addrEl = document.getElementById('profile-edit-address');

    if (nameEl && nameEl.value.trim()) {
      store.user.name = nameEl.value.trim();
    }
    if (phoneEl) {
      store.user.phone = phoneEl.value.trim();
    }
    if (addrEl) {
      store.user.address = addrEl.value.trim();
    }

    store.saveLocalStorage('mytholis_user', store.user);
    if (typeof firebaseService !== 'undefined') {
      firebaseService.pushLocalStateToCloud();
    }
    store.notify();
    this.showToast("Client profile & dispatch coordinates saved.");
    this.closeProfileModal();
    if (store.currentView === 'profile' || store.currentView === 'user-profile') {
      this.renderCurrentView();
    }
  }

  /* Firebase Authentication Handlers */
  async handleGoogleSignIn() {
    if (typeof firebaseService === 'undefined') return;
    this.showToast('Connecting to Google VIP Sign-In...');
    const result = await firebaseService.signInWithGoogle();
    if (result.success) {
      this.showToast(`Welcome to House Mytholis, ${result.user.displayName || result.user.email}!`);
      this.renderProfileModalContent();
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
      this.renderProfileModalContent();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      this.showToast(result.error);
    }
  }

  async handleEmailSignUp() {
    if (typeof firebaseService === 'undefined') return;
    const emailEl = document.getElementById('auth-email-input');
    const passEl = document.getElementById('auth-password-input');
    const email = emailEl ? emailEl.value.trim() : '';
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
    const result = await firebaseService.signUpWithEmail(email, pass, store.user.name || '');
    if (result.success) {
      this.showToast(`VIP Dossier Account Activated for ${result.user.email}!`);
      this.renderProfileModalContent();
      if (store.currentView === 'profile') this.renderCurrentView();
    } else {
      this.showToast(result.error);
    }
  }

  async handleFirebaseSignOut() {
    if (typeof firebaseService === 'undefined') return;
    await firebaseService.signOut();
    this.showToast('Signed out of House Mytholis.');
    this.renderProfileModalContent();
    if (store.currentView === 'profile') this.renderCurrentView();
  }

  logoutUser() {
    store.logout();
    this.closeProfileModal();
    this.showToast("Signed out of your client session.");
    this.navigateTo('home');
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
     SANCTUM COMMAND - FOUNDER OPERATIONS & DISPATCH DESK CONTROLLER
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
      const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
      const userEmail = (res.user.email || '').trim().toLowerCase();
      if (configuredAdminEmail && userEmail === configuredAdminEmail) {
        this.showToast('Sanctum Command: Sovereign Founder Authenticated.');
        await this.loadAdminDashboard();
      } else {
        this.showToast('Authenticated, but this account lacks Sanctum Command privileges.');
        this.renderCurrentView();
      }
    } else {
      this.showToast(`Authentication failed: ${res.error || 'User cancelled'}`);
    }
  }

  async callAdminApi(action, payload = {}) {
    const user = (typeof firebaseService !== 'undefined' && firebaseService.currentUser);
    if (!user) {
      throw new Error('Not authenticated with verified Google account');
    }
    const token = await user.getIdToken();

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, payload })
      });

      if (response.ok) {
        return await response.json();
      }

      // If 404 (local dev with pure Vite server without Vercel Serverless Function runner)
      if (response.status === 404) {
        console.warn("[Sanctum Command] /api/admin returned 404. Running direct Firestore fallback in development.");
        return await this.fallbackDirectFirestoreAdminAction(action, payload);
      }

      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('404'))) {
        return await this.fallbackDirectFirestoreAdminAction(action, payload);
      }
      throw err;
    }
  }

  /* Development / Offline Direct Firestore Fallback */
  async fallbackDirectFirestoreAdminAction(action, payload) {
    if (typeof firebaseService === 'undefined' || !firebaseService.currentUser) {
      throw new Error('Firebase unavailable');
    }

    switch (action) {
      case 'GET_DASHBOARD_DATA': {
        const ordersSnap = await getDocs(collection(db, 'orders')).catch(() => ({ docs: [] }));
        const usersSnap = await getDocs(collection(db, 'users')).catch(() => ({ docs: [] }));
        const invSnap = await getDoc(doc(db, 'settings', 'inventory')).catch(() => ({ exists: () => false }));
        const codesSnap = await getDocs(collection(db, 'reward_codes')).catch(() => ({ docs: [] }));

        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        const inventory = invSnap.exists() ? invSnap.data() : {};
        const codes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return { success: true, data: { orders, users, inventory, codes } };
      }

      case 'UPDATE_ORDER_STATUS': {
        const { orderId, status, courier, awb_number } = payload;
        await setDoc(doc(db, 'orders', orderId), {
          status,
          courier,
          awb_number,
          updated_at: new Date().toISOString()
        }, { merge: true });
        return { success: true };
      }

      case 'ADJUST_USER_MYTHOS': {
        const { targetUid, spendableDelta = 0, legacyDelta = 0, addBottleCount = 0, unlockScent } = payload;
        const userRef = doc(db, 'users', targetUid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists ? userSnap.data() : { profile: {}, loyalty: {} };
        const loyalty = Object.assign({}, userData.loyalty || {});

        loyalty.spendable_mythos = Math.max(0, (loyalty.spendable_mythos || 0) + Number(spendableDelta || 0));
        loyalty.legacy_mythos = Math.max(0, (loyalty.legacy_mythos || 0) + Number(legacyDelta || 0));
        loyalty.full_bottles_purchased = Math.max(0, (loyalty.full_bottles_purchased || 0) + Number(addBottleCount || 0));

        if (unlockScent) {
          const codex = Array.isArray(loyalty.codex_unlocked) ? [...loyalty.codex_unlocked] : [];
          if (!codex.includes(unlockScent)) codex.push(unlockScent);
          loyalty.codex_unlocked = codex;
        }

        const LOYALTY_TIERS = [
          { level: 1, name: "The Initiate", minLegacy: 0, minBottles: 0 },
          { level: 2, name: "The Curator", minLegacy: 500, minBottles: 1 },
          { level: 3, name: "The Collector", minLegacy: 2500, minBottles: 3 },
          { level: 4, name: "The Archivist", minLegacy: 8000, minBottles: 6 },
          { level: 5, name: "The Patron", minLegacy: 20000, minBottles: 12 }
        ];
        let newTier = "Level 1: The Initiate";
        for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
          if (loyalty.legacy_mythos >= LOYALTY_TIERS[i].minLegacy && loyalty.full_bottles_purchased >= LOYALTY_TIERS[i].minBottles) {
            newTier = `Level ${LOYALTY_TIERS[i].level}: ${LOYALTY_TIERS[i].name}`;
            break;
          }
        }

        const profile = Object.assign({}, userData.profile || {}, { tier: newTier, points: loyalty.spendable_mythos });
        await setDoc(userRef, { loyalty, profile, updatedAt: new Date().toISOString() }, { merge: true });
        return { success: true, tier: newTier };
      }

      case 'TOGGLE_INVENTORY': {
        const { skuKey, status } = payload;
        await setDoc(doc(db, 'settings', 'inventory'), {
          [skuKey]: status,
          updated_at: new Date().toISOString()
        }, { merge: true });
        return { success: true };
      }

      case 'CREATE_VIP_CODE': {
        const { code, title, type = 'discount', amount = 500, minOrder = 1500, maxUses = 1, targetEmail = null, note = '' } = payload;
        const normalizedCode = String(code).trim().toUpperCase();
        await setDoc(doc(db, 'reward_codes', normalizedCode), {
          code: normalizedCode,
          title: title || 'VIP Sanctum Concession',
          type,
          amount: Number(amount) || 0,
          minOrder: Number(minOrder) || 0,
          used: false,
          maxUses: Number(maxUses) || 1,
          usesCount: 0,
          targetEmail: targetEmail ? String(targetEmail).trim().toLowerCase() : null,
          note: note || '',
          createdAt: new Date().toISOString()
        });
        return { success: true };
      }

      default:
        throw new Error(`Unsupported fallback action: ${action}`);
    }
  }

  async loadAdminDashboard() {
    this.adminLoading = true;
    try {
      const res = await this.callAdminApi('GET_DASHBOARD_DATA');
      if (res && res.success && res.data) {
        this.adminData = res.data;
        this.renderCurrentView();
      }
    } catch (err) {
      console.error("[Sanctum Command] Error loading dashboard:", err);
      this.showToast(`Sanctum Command notice: ${err.message}`);
    } finally {
      this.adminLoading = false;
    }
  }

  async refreshAdminDashboard() {
    this.showToast('Refreshing live cloud ledger...');
    await this.loadAdminDashboard();
    this.showToast('Sanctum Command: Live cloud ledger synchronized.');
  }

  async saveAndDispatchOrder(orderId, phone) {
    const courierEl = document.getElementById(`courier-${orderId}`);
    const awbEl = document.getElementById(`awb-${orderId}`);
    const statusEl = document.getElementById(`status-${orderId}`);

    const courier = courierEl ? courierEl.value.trim() : 'BlueDart Express';
    const awb_number = awbEl ? awbEl.value.trim() : '';
    const status = statusEl ? statusEl.value : 'Dispatched';

    try {
      await this.callAdminApi('UPDATE_ORDER_STATUS', {
        orderId,
        status,
        courier,
        awb_number
      });

      const order = this.adminData.orders.find(o => (o.orderId || o.id) === orderId);
      if (order) {
        order.status = status;
        order.courier = courier;
        order.awb_number = awb_number;
      }

      this.showToast(`Order ${orderId} updated to ${status}.`);

      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      const luxuryMsg = `Dear Patron, your Mytholis Haute Parfumerie consignment (Order ${orderId}) has been sealed with our obsidian wax seal and dispatched via ${courier}.\n\nYour armored tracking AWB is: ${awb_number || 'Pending'}.\nTrack live at: https://mytholis.com/#track-order\n\nWear your legend.\n— The Mytholis Sanctum`;

      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(luxuryMsg)}`, '_blank');
      } else {
        this.showToast(`Order status saved. (No phone attached for WhatsApp)`);
      }

      this.renderCurrentView();
    } catch (err) {
      console.error("[Sanctum Command] Error dispatching order:", err);
      this.showToast(`Dispatch failed: ${err.message}`);
    }
  }

  populateUserAdjustmentForm(uid) {
    const input = document.getElementById('adjust-uid-input');
    if (input) {
      input.value = uid;
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async submitUserMythosAdjustment() {
    const uidEl = document.getElementById('adjust-uid-input');
    const spendableEl = document.getElementById('adjust-spendable-input');
    const legacyEl = document.getElementById('adjust-legacy-input');
    const bottlesEl = document.getElementById('adjust-bottles-input');
    const codexEl = document.getElementById('adjust-codex-input');

    const targetUid = uidEl ? uidEl.value.trim() : '';
    const spendableDelta = spendableEl ? Number(spendableEl.value || 0) : 0;
    const legacyDelta = legacyEl ? Number(legacyEl.value || 0) : 0;
    const addBottleCount = bottlesEl ? Number(bottlesEl.value || 0) : 0;
    const unlockScent = codexEl ? codexEl.value.trim() : '';

    if (!targetUid) {
      this.showToast('Please provide a target patron UID or select one from below.');
      return;
    }

    try {
      const res = await this.callAdminApi('ADJUST_USER_MYTHOS', {
        targetUid,
        spendableDelta,
        legacyDelta,
        addBottleCount,
        unlockScent
      });

      this.showToast(`Patron ledger updated! Recalculated Tier: ${res.tier || 'Updated'}`);
      await this.loadAdminDashboard();
    } catch (err) {
      console.error("[Sanctum Command] Error adjusting user:", err);
      this.showToast(`Adjustment failed: ${err.message}`);
    }
  }

  filterAdminUsers(query) {
    const term = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.admin-user-card');
    cards.forEach(card => {
      const name = card.getAttribute('data-username') || '';
      const email = card.getAttribute('data-email') || '';
      if (!term || name.includes(term) || email.includes(term)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  async toggleInventorySku(skuKey, newStatus) {
    try {
      await this.callAdminApi('TOGGLE_INVENTORY', {
        skuKey,
        status: newStatus
      });

      if (!this.adminData.inventory) this.adminData.inventory = {};
      this.adminData.inventory[skuKey] = newStatus;

      this.showToast(`SKU ${skuKey} set to ${newStatus.replace('_', ' ').toUpperCase()}`);
      this.renderCurrentView();
    } catch (err) {
      console.error("[Sanctum Command] Error toggling inventory:", err);
      this.showToast(`Inventory update failed: ${err.message}`);
    }
  }

  async submitNewVipCode() {
    const codeEl = document.getElementById('mint-code-input');
    const titleEl = document.getElementById('mint-title-input');
    const amountEl = document.getElementById('mint-amount-input');
    const minOrderEl = document.getElementById('mint-minorder-input');
    const usesEl = document.getElementById('mint-uses-input');
    const emailEl = document.getElementById('mint-email-input');
    const noteEl = document.getElementById('mint-note-input');

    const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
    if (!code) {
      this.showToast('Please specify a voucher code (e.g. MYTH-VIP-ALEXANDER).');
      return;
    }

    try {
      await this.callAdminApi('CREATE_VIP_CODE', {
        code,
        title: titleEl ? titleEl.value.trim() : 'VIP Privilege',
        amount: amountEl ? Number(amountEl.value || 0) : 500,
        minOrder: minOrderEl ? Number(minOrderEl.value || 0) : 1500,
        maxUses: usesEl ? Number(usesEl.value || 1) : 1,
        targetEmail: emailEl ? emailEl.value.trim() : null,
        note: noteEl ? noteEl.value.trim() : ''
      });

      this.showToast(`Sanctum Code ${code} minted into the Vault ledger!`);
      await this.loadAdminDashboard();
    } catch (err) {
      console.error("[Sanctum Command] Error minting code:", err);
      this.showToast(`Minting code failed: ${err.message}`);
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
