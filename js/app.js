/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION CONTROLLER & ROUTER
   Handles routing, event listeners, 3D tilt effects, ambiance, and toasts.
   ========================================================================== */

import gsap from 'gsap';

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

    // Scroll Header effect (cached & RAF throttled)
    const header = document.querySelector('.header-nav');
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
      mainContainer.classList.add('home-view');
      this.initFanHero();
      this.initHeroSwipeGestures();
      if (this.activateCenterCard) {
        setTimeout(() => this.activateCenterCard(), 50);
      }
    } else {
      mainContainer.classList.remove('home-view');
    }
  }

  /* ------------------------------------------------------------------------
     3D FAN ARRAY FLACON HERO SECTION (DESKTOP FAN / MOBILE INFINITE CAROUSEL)
     ------------------------------------------------------------------------ */
  initFanHero() {
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

    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
      this.isIntroAnimating = true;

      // 1. Initial states: flacon bottles start off-screen above
      cards.forEach((card) => {
        const rot = parseFloat(card.dataset.restRot) || 0;
        gsap.set(card, { y: -850, rotation: rot + 18, opacity: 0, scale: 0.8, visibility: 'visible' });
      });

      const kicker = heroEl.querySelector('.hero-kicker');
      const words = heroEl.querySelectorAll('.small-team .word > span');
      const letters = heroEl.querySelectorAll('.big-results .letter');
      const subline = heroEl.querySelector('#subline');

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

      // 3. Continuous floating animation
      cards.forEach((card, i) => {
        const rot = parseFloat(card.dataset.restRot) || 0;
        gsap.to(card, {
          y: `+=${6 + (i % 3) * 4}`,
          rotation: rot + (i % 2 === 0 ? 1.2 : -1.2),
          duration: 3.2 + (i % 4) * 0.5,
          delay: 1.8 + i * 0.12,
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
      const note = activeCard.dataset.note || '30% Pure Concentration';
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

    if (badgeEl) badgeEl.innerHTML = `✦ ${product.subtitle}`;
    if (editionEl) editionEl.innerHTML = `No. 0${this.heroIndex + 1} of 06`;
    if (fragNameEl) fragNameEl.innerText = product.name;
    if (descEl) descEl.innerText = `"${product.tagline}" ${product.description}`;

    if (accordsEl) {
      accordsEl.innerHTML = product.accords.map(a => `<span class="hero-accord-tag">✦ ${a}</span>`).join('');
    }

    if (ctaBtn) {
      ctaBtn.innerText = `Discover ${product.name.replace(' Extrait de Parfum', '')} ✦`;
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
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const activeSizeObj = product.sizes.find(s => s.ml === this.selectedSize) || product.sizes[product.sizes.length - 1] || product.sizes[0];
    const engravingEl = document.getElementById('engraving-text');
    const engraving = engravingEl ? engravingEl.value.trim() : '';

    store.addToCart(productId, activeSizeObj.ml, engraving, 1);
    this.showToast("Fragrance added to your scent vault ✦");
    this.openCartModal();
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

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to order:\n✦ *${product.name}*\n✦ Volume: ${size}ml\n✦ Total Price: ${store.formatPrice(price)} (Incl. all taxes)\n${engraving ? `✦ Complimentary Engraving: "${engraving}"\n` : ''}✦ Shipping: Pan-India Express Armored Delivery\n\nPlease share payment details (UPI / Bank Transfer) to confirm my order.`;

    window.open(`https://wa.me/917770009170?text=${encodeURIComponent(text)}`, '_blank');
  }

  checkoutCartWhatsApp() {
    if (store.cart.length === 0) return;
    const total = store.getCartTotal();
    const itemsList = store.cart.map(i => `• ${i.name} (${i.size}ml × ${i.quantity}) ${i.engraving ? `[Engraved: "${i.engraving}"]` : ''} - ${store.formatPrice(i.price * i.quantity)}`).join('\n');

    const text = `Hello Mytholis Fragrance Concierge,\n\nI would like to checkout my Mytholis Vault Cart:\n\n${itemsList}\n\n*Total Amount:* ${store.formatPrice(total)} (Incl. 18% GST)\n*Delivery:* Free Express Armored Shipping across India\n\nPlease assist with UPI / Razorpay payment instructions.`;

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

if (typeof window !== 'undefined') {
  window.MytholisApp = MytholisApp;
  window.app = app;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
