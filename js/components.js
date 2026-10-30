/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - COMPONENTS RENDERERS
   Generates dynamic HTML markup for views, modals, product cards, quiz, track order, faqs, contact,
   legal policies, and Razorpay/WhatsApp checkout integrations.
   ========================================================================== */

const Components = {
  /* Helper to strip HTML tags and quotes from attribute values */
  cleanText(str) {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/"/g, '&quot;').trim();
  },

  /* Helper to format item arrays into readable strings (e.g. Petralux (50ml) x 1) */
  formatOrderItemsSummary(items) {
    if (!items) return 'Extrait de Parfum';
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed) || typeof parsed === 'object') items = parsed;
        else return items;
      } catch (e) {
        return items;
      }
    }
    const arr = Array.isArray(items) ? items : (typeof items === 'object' ? Object.values(items) : []);
    if (arr.length === 0) return 'Extrait de Parfum';
    return arr.map(i => {
      if (!i) return '';
      if (typeof i === 'string') return i;
      const name = i.name || i.title || i.id || 'Mytholis Extrait';
      const sizeStr = i.size ? (String(i.size).toLowerCase().includes('ml') ? ` (${i.size})` : ` (${i.size}ml)`) : '';
      const qty = i.quantity || i.qty || 1;
      return `${name}${sizeStr}${qty > 1 ? ' × ' + qty : ''}`;
    }).filter(Boolean).join(', ');
  },

  /* Render Product Card with 3D Pop-out Overlap, Wear Metrics & Instant Quick Add */
  renderProductCard(product) {
    const isWishlisted = store.isInWishlist(product.id);
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : { ml: 50, price: product.price };
    const travelSize = product.sizes ? product.sizes.find(s => s.ml === 8) : null;
    const sillageLabel = product.sillageRating >= 95 ? "Formidable" : "Intimate";
    const occasionLabel = product.scentFamily.includes("Royal") || product.scentFamily.includes("Resinous") || product.scentFamily.includes("Smoky")
      ? "Evening Gala"
      : "Signature Wear";
    const mythosInfo = store.calculateProductMythos(defaultSize.price);

    return `
      <div class="product-card" data-id="${product.id}" onclick="app.openProductView('${product.id}')">
        <!-- Strictly-Clipped Liquid Glass Background with Hover Sheen -->
        <div class="product-card-glass-bg"></div>

        <span class="glass-pill product-card-badge">${product.tag}</span>
        <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" 
                onclick="event.stopPropagation(); store.toggleWishlist('${product.id}')"
                title="Toggle Wishlist">
          <svg width="16" height="16" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div class="product-card-img-wrap bottle-pedestal-glow">
          <img src="${product.image}" alt="${this.cleanText(product.name)}" class="product-card-img" loading="lazy" decoding="async" />
        </div>
        <div class="product-card-info">
          <span class="product-card-collection">${product.collection}</span>
          <h3 class="product-card-title">${product.name}</h3>

          <!-- Quick-Glance Wear Metrics Badges -->
          <div class="product-card-wear-metrics">
            <span class="wear-metric-pill" title="Longevity on skin">${product.longevityHours}h Longevity</span>
            <span class="wear-metric-pill" title="Sillage projection">${sillageLabel}</span>
            <span class="wear-metric-pill" title="Recommended setting">${occasionLabel}</span>
          </div>

          <p class="product-card-accord">${product.accords.slice(0, 3).join(' • ')}</p>

          <!-- Quick Size Selection Pills on Card -->
          ${product.sizes && product.sizes.length > 1 ? `
            <div class="card-size-selector" onclick="event.stopPropagation()">
              ${product.sizes.map(s => `
                <button class="card-size-pill ${s.ml === defaultSize.ml ? 'active' : ''}" 
                        onclick="app.selectCardSize(event, '${product.id}', ${s.ml}, ${s.price})">
                  ${s.ml}ml • ₹${s.price.toLocaleString()}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="product-card-footer">
            <div>
              <span class="product-price" id="card-price-${product.id}">${store.formatPrice(defaultSize.price)}</span>
              <div class="card-mythos-badge" id="card-mythos-${product.id}" title="Loyalty Reward: 1 Mythos Coin = ₹1 Concession">
                <span>🪙</span> Earn <strong>+${mythosInfo.coins} Mythos</strong>
              </div>
              <span class="product-tax-note">MRP (Incl. taxes)</span>
            </div>
            <div class="product-card-actions">
              <button class="btn btn-gold quick-add-btn" 
                      id="card-buy-btn-${product.id}"
                      onclick="event.stopPropagation(); app.quickAddToCart('${product.id}')"
                      title="Quick Add Flacon to Cart">
                Acquire
              </button>
              <button class="btn btn-glass product-explore-btn" onclick="event.stopPropagation(); app.openProductView('${product.id}')">
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* Render Sovereign Notched Card (Exact Match to User Reference Design) */
  renderProductSliderCard(product) {
    const isWishlisted = store.isInWishlist(product.id);
    const cleanTitle = product.name;
    const badgeText = product.tag || 'Trending';
    const mythosInfo = store.calculateProductMythos(product.price);
    const accordPills = (product.accords || []).slice(0, 3);
    const compareAtPrice = product.compareAtPrice || Math.round(product.price * 1.25);

    // Curated evocative descriptions matching the haute parfumerie reference
    const curatedDescriptions = {
      'king-scar': 'Commanding spices, crisp absinthe, and Bulgarian rose anchored in Haitian vetiver at 40% Extrait concentration.',
      'petralux': 'Luminous Italian bergamot, golden pineapple, and royal amber trapped in stone at 40% Extrait concentration.',
      'oud-rion': 'Smoky aged Assam oud, molten amber, and dark damask rose macerated at 40% Extrait concentration.',
      'spark': 'Sunlit Sicilian mandarin, sparkling ginger, and crystalline aquatic woods at 40% Extrait concentration.',
      'wood-sera': 'Rare Mysore sandalwood, aged bourbon cedarwood, and saddle leather at 40% Extrait concentration.',
      'ash': 'White birch embers, frankincense tear smoke, and sacred resins macerated at 40% Extrait concentration.'
    };

    const desc = curatedDescriptions[product.id] || (product.description ? (product.description.length > 115 ? product.description.slice(0, 108).trim() + '...' : product.description) : '');

    return `
      <div class="sovereign-slider-card" data-id="${product.id}" onclick="app.openProductView('${product.id}')">
        <!-- Notched Sovereign Gold Border SVG Frame -->
        <svg class="sovereign-card-svg-frame" viewBox="0 0 320 520" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sliderCardGrad-${product.id}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#052418" />
              <stop offset="100%" stop-color="#020e08" />
            </linearGradient>
          </defs>
          <path d="M 28 1 
                   L 292 1 
                   Q 319 1 319 28 
                   L 319 386 
                   Q 319 406 299 406 
                   L 250 406 
                   Q 232 406 232 424 
                   L 232 499 
                   Q 232 519 212 519 
                   L 28 519 
                   Q 1 519 1 492 
                   L 1 28 
                   Q 1 1 28 1 Z" 
                fill="url(#sliderCardGrad-${product.id})" 
                stroke="#D4AF37" 
                stroke-width="1.5" 
                vector-effect="non-scaling-stroke" />
        </svg>

        <!-- Card Interior Content -->
        <div class="sovereign-card-body">
          <!-- Top Image Showcase Pedestal -->
          <div class="notched-card-media">
            <span class="notched-badge-pill">${badgeText}</span>
            <div class="notched-media-halo"></div>
            <img src="${product.image}" alt="${this.cleanText(product.name)}" class="notched-bottle-img" loading="lazy" />
            <div class="notched-bottle-shadow"></div>
          </div>

          <!-- Card Body Info -->
          <div class="notched-card-info">
            <!-- Title & Wishlist -->
            <div class="notched-title-row">
              <h3 class="notched-product-title">${cleanTitle}</h3>
              <button class="notched-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                      onclick="event.stopPropagation(); store.toggleWishlist('${product.id}')"
                      title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWishlisted ? '#D4AF37' : '#D4AF37'}" stroke="#D4AF37" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <!-- Compact Olfactory Accord Pills -->
            <div class="notched-accords-row">
              ${accordPills.map(acc => `<span class="notched-accord-pill">${acc}</span>`).join('')}
            </div>

            <!-- Description -->
            <p class="notched-product-desc">${desc}</p>

            <!-- Price & Compare-at in bottom left -->
            <div class="notched-bottom-row">
              <div class="notched-price-display-wrap">
                <span class="notched-price-display">${store.formatPrice(product.price)}</span>
                <span class="notched-compare-price">${store.formatPrice(compareAtPrice)}</span>
              </div>
              <div class="notched-mythos-badge" title="Loyalty Privilege: 1 Mythos Coin = ₹1 Concession">
                <span class="mythos-coin-icon">🪙</span>
                <span>Earn <strong>+${mythosInfo.coins} Mythos</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Docked Cart Button in Notch -->
        <button class="notched-docked-cart-btn" 
                onclick="event.stopPropagation(); app.addProductToCart('${product.id}')"
                title="Add ${this.cleanText(product.name)} to Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1" fill="#D4AF37"></circle>
            <circle cx="20" cy="21" r="1" fill="#D4AF37"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </button>
      </div>
    `;
  },

  /* Render Home View */
  renderHome() {
    const heroProducts = MYTHOLIS_CATALOG.slice(0, 6);
    const heroIdx = typeof app !== 'undefined' && app.heroIndex !== undefined ? (app.heroIndex % 6) : 0;
    const heroProduct = heroProducts[heroIdx] || heroProducts[0];

    return `
      <!-- ============ 3D FAN ARRAY FLACON HERO SECTION ============ -->
      <section class="hero hero-section" id="hero-section">
        <div class="hero-header-wrap">
          <div class="hero-kicker">
            <span class="kicker-line"></span>
            <span class="kicker-text">HAUTE PARFUMERIE · 40% EXTRAIT CONCENTRATION</span>
            <span class="kicker-line"></span>
          </div>

          <h1 class="small-team" id="smallTeam">
            <span class="word"><span>Six</span></span>&nbsp;<span class="word"><span>elements,</span></span>
          </h1>
        </div>

        <!-- Giant Faded Background Wordmark -->
        <div class="big-results-wrap">
          <div class="big-results" id="bigResults">
            <span class="letter">O</span><span class="letter">N</span><span class="letter">E</span><span class="letter">&nbsp;</span><span class="letter">H</span><span class="letter">O</span><span class="letter">U</span><span class="letter">S</span><span class="letter">E</span>
          </div>
        </div>

        <!-- 3D Fan Array of Flacon Products -->
        <div class="cards-row" id="cardsRow">
          <!-- Bottle 1: King Scar -->
          <div class="card flacon-card card-1" data-rot="-10" data-depth="14" data-name="King Scar" data-note="Aromatic · Men" data-rest-rot="-10" onclick="app.handleFlaconCardClick(0, 'king-scar')" title="King Scar Extrait · Aromatic · Men">
            <img src="assets/product/1kingscar.webp" alt="King Scar Extrait" class="bottle-png" loading="eager" />
          </div>

          <!-- Bottle 2: Petralux -->
          <div class="card flacon-card card-2" data-rot="-6" data-depth="10" data-name="Petralux" data-note="Fruity · Unisex" data-rest-rot="-6" onclick="app.handleFlaconCardClick(1, 'petralux')" title="Petralux Extrait · Fruity · Unisex">
            <img src="assets/product/2petralux.webp" alt="Petralux Extrait" class="bottle-png" loading="eager" />
          </div>

          <!-- Bottle 3: Oud Rion -->
          <div class="card flacon-card card-3" data-rot="-2" data-depth="8" data-name="Oud Rion" data-note="Woody · Men" data-rest-rot="-2" onclick="app.handleFlaconCardClick(2, 'oud-rion')" title="Oud Rion Extrait · Woody · Men">
            <img src="assets/product/3oudrion.webp" alt="Oud Rion Extrait" class="bottle-png" loading="eager" />
          </div>

          <!-- Bottle 4: Spark -->
          <div class="card flacon-card card-4" data-rot="2" data-depth="8" data-name="Spark" data-note="Aromatic · Unisex" data-rest-rot="2" onclick="app.handleFlaconCardClick(3, 'spark')" title="Spark Extrait · Aromatic · Unisex">
            <img src="assets/product/4spark.webp" alt="Spark Extrait" class="bottle-png" loading="eager" />
          </div>

          <!-- Bottle 5: Wood Sera -->
          <div class="card flacon-card card-5" data-rot="6" data-depth="10" data-name="Wood Sera" data-note="Woody · Unisex" data-rest-rot="6" onclick="app.handleFlaconCardClick(4, 'wood-sera')" title="Wood Sera Extrait · Woody · Unisex">
            <img src="assets/product/5woodsera.webp" alt="Wood Sera Extrait" class="bottle-png" loading="eager" />
          </div>

          <!-- Bottle 6: Ash -->
          <div class="card flacon-card card-6" data-rot="10" data-depth="14" data-name="Ash" data-note="Woody · Unisex" data-rest-rot="10" onclick="app.handleFlaconCardClick(5, 'ash')" title="Ash Extrait · Woody · Unisex">
            <img src="assets/product/6ash.webp" alt="Ash Extrait" class="bottle-png" loading="eager" />
          </div>
        </div>

        <!-- Subline & Action Pill -->
        <div class="subline" id="subline">
          <div class="mobile-flacon-dots" id="mobileFlaconDots">
            <span class="m-dot" onclick="app.setMobileFlaconIndex(0)" title="King Scar"></span>
            <span class="m-dot" onclick="app.setMobileFlaconIndex(1)" title="Petralux"></span>
            <span class="m-dot active" onclick="app.setMobileFlaconIndex(2)" title="Oud Rion"></span>
            <span class="m-dot" onclick="app.setMobileFlaconIndex(3)" title="Spark"></span>
            <span class="m-dot" onclick="app.setMobileFlaconIndex(4)" title="Wood Sera"></span>
            <span class="m-dot" onclick="app.setMobileFlaconIndex(5)" title="Ash"></span>
          </div>

          <button class="arrow-pill" onclick="const el = document.getElementById('featured-vault') || document.querySelector('.hero-cards-section'); if(el) el.scrollIntoView({behavior: 'smooth'}); else app.navigateTo('collections');">
            <span>Enter The Vault</span>
            <span class="ar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </button>
          <div class="subline-text" id="heroSublineText">
            <span id="heroSublineName">Oud Rion Extrait</span> · <span>40% Pure Concentration</span> · <span>Hand-Distilled in Mayfair &amp; Ahmedabad</span>
          </div>
        </div>
      </section>

      <!-- Brand Essence Spotlight -->
      <section class="container" style="margin: 6rem auto 4rem;">
        <div class="liquid-glass-card brand-essence-card">
          <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.3em; text-transform: uppercase;">Based in UK · Handcrafted in India</span>
          <h2 class="brand-essence-title">
            "Wear Your Legend."
          </h2>
          <p class="font-garamond brand-essence-desc">
            Alchemic extraits hand-formulated in Mayfair, London and artisanally distilled in Ahmedabad, India. Crafted with 40% pure fragrance oil concentration and encased in flacons of liquid crystal.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-gold" onclick="app.openProductView('mytholis-discovery-set')">
              Order Sixth Sense • ₹3,999
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('know-us')">
              Read Our Heritage
            </button>
          </div>
        </div>
      </section>

      <!-- ============ MASTER EXTRAIT FLACON PRODUCT SLIDER SECTION ============ -->
      <section class="container product-slider-section" id="featured-extraits-slider" style="margin: 3rem auto 6rem;">
        <div class="product-slider-header">
          <div>
            <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.3em; text-transform: uppercase;">
              HAUTE PARFUMERIE · 40% PURE EXTRAIT CONCENTRATION
            </span>
            <h2 class="font-title" style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); color: var(--gold-light); margin: 0.4rem 0 0.2rem;">
              The Master Extrait Collection
            </h2>
            <div class="divider" style="margin: 0.8rem 0 0;"></div>
          </div>

          <!-- Slider Navigation Arrows -->
          <div class="slider-nav-controls">
            <button class="slider-nav-btn slider-prev-btn" onclick="app.scrollProductSlider(-1)" aria-label="Previous Fragrance" title="Previous Fragrance">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button class="slider-nav-btn slider-next-btn" onclick="app.scrollProductSlider(1)" aria-label="Next Fragrance" title="Next Fragrance">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Horizontal Scrollable Track Container -->
        <div class="product-slider-wrapper">
          <div class="product-slider-track" id="productSliderTrack">
            ${(typeof store !== 'undefined' && store.getProducts ? store.getProducts() : MYTHOLIS_CATALOG)
              .filter(p => p.id !== 'mytholis-discovery-set')
              .map(p => `
                <div class="product-slider-item">
                  ${this.renderProductSliderCard(p)}
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Slider Pagination / Progress Bar -->
        <div class="product-slider-footer">
          <div class="slider-progress-track">
            <div class="slider-progress-bar" id="productSliderProgress"></div>
          </div>
          <div class="slider-hint">
            <span>← Drag or Swipe to Explore Extraits →</span>
          </div>
        </div>
      </section>

      <!-- Sixth Sense Spotlight Banner -->
      <section class="container" style="margin-bottom: 6rem;">
        <div class="discovery-vault-banner liquid-glass-card">
          <div class="discovery-banner-content">
            <span class="glass-pill" style="margin-bottom: 0.8rem;">Sixth Sense Edition</span>
            <h2 class="font-title gold-shimmer-text" style="font-size: clamp(1.6rem, 3vw, 2.3rem); margin-bottom: 0.8rem;">
              Sixth Sense
            </h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
              Awaken your sixth sense. Experience all 6 master extrait creations in curated 8ml travel flacons. Includes a complimentary <strong>₹1,000 voucher</strong> redeemable against your first full 50ml flacon.
            </p>
            <div class="discovery-banner-perks">
              <span>6 × 8ml Deluxe Atomizers</span>
              <span>All 6 Extraits de Parfum</span>
              <span>Free Pan-India Armored Delivery</span>
            </div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
              <button class="btn btn-gold" onclick="app.acquireCoffretNow()">
                Acquire Sixth Sense • ₹3,999
              </button>
              <button class="btn btn-glass" onclick="app.buyNowWhatsApp('mytholis-discovery-set')">
                Order via WhatsApp
              </button>
            </div>
          </div>
          <div class="discovery-banner-visual bottle-pedestal-glow">
            <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto;">
              <img src="assets/coffret_banner.webp" alt="Sixth Sense Luxury Coffret" loading="lazy" decoding="async" style="max-height: 250px; width: 100%; object-fit: cover; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.45); box-shadow: 0 15px 35px rgba(0,0,0,0.85);" />
              
              <!-- 6 Scent Archetypes Preview Grid -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 12px;">
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">01 · King Scar</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Aromatic Spicy</span>
                </div>
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">02 · Petralux</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Fruity Amber</span>
                </div>
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">03 · Oud Rion</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Resinous Oud</span>
                </div>
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">04 · Spark</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Electric Neroli</span>
                </div>
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">05 · Wood Sera</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Amber Rose</span>
                </div>
                <div style="background: rgba(3, 18, 13, 0.88); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 6px 8px; text-align: center;">
                  <span style="display: block; font-size: 0.62rem; color: #D4AF37; letter-spacing: 0.1em; text-transform: uppercase;">06 · Ash</span>
                  <span style="font-size: 0.58rem; color: #A3B899;">Smoky Mineral</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured 3D Masterpieces Section (Hero Cards) -->
      <section class="container hero-cards-section" style="margin-bottom: 7rem;">
        <div class="section-header">
          <span class="tagline">Six Elements. Six Legends.</span>
          <h2>The Signature House Collection</h2>
          <div class="divider"></div>
        </div>

        <div class="hero-card-row">
          <a href="javascript:void(0)" onclick="app.openProductView('king-scar')" alt="King Scar">
            <div class="card">
              <div class="wrapper king-scar">
                <img src="assets/hero/kingscarcard.webp" class="cover-image base-card-img" alt="King Scar Cover" loading="eager" decoding="async" />
                <img src="assets/hero/kingscarbg.webp" class="cover-image hover-bg-img" alt="King Scar Atmosphere" loading="eager" decoding="async" />
              </div>
              <img src="assets/product/1kingscar.webp" class="character" alt="King Scar Bottle" loading="eager" decoding="async" />
            </div>
          </a>

          <a href="javascript:void(0)" onclick="app.openProductView('oud-rion')" alt="Oud Rion">
            <div class="card">
              <div class="wrapper oud-rion">
                <img src="assets/hero/oudrioncard.webp" class="cover-image base-card-img" alt="Oud Rion Cover" loading="eager" decoding="async" />
                <img src="assets/hero/oudrionbg.webp" class="cover-image hover-bg-img" alt="Oud Rion Atmosphere" loading="eager" decoding="async" />
              </div>
              <img src="assets/product/3oudrion.webp" class="character" alt="Oud Rion Bottle" loading="eager" decoding="async" />
            </div>
          </a>

          <a href="javascript:void(0)" onclick="app.openProductView('spark')" alt="Spark">
            <div class="card">
              <div class="wrapper spark">
                <img src="assets/hero/sparkcard.webp" class="cover-image base-card-img" alt="Spark Cover" loading="eager" decoding="async" />
                <img src="assets/hero/sparkbg.webp" class="cover-image hover-bg-img" alt="Spark Atmosphere" loading="eager" decoding="async" />
              </div>
              <img src="assets/product/4spark.webp" class="character" alt="Spark Bottle" loading="eager" decoding="async" />
            </div>
          </a>
        </div>

        <div style="text-align: center; margin-top: 5rem;">
          <button class="btn btn-gold" onclick="app.navigateTo('collections')">
            Explore All Extraits in Catalog
          </button>
        </div>
      </section>

      <!-- Olfactory Notes Pyramid Showcase (Interactive Anatomie de Parfum) -->
      <section class="container" style="margin-bottom: 6rem;" id="pyramid-section">
        <div class="section-header">
          <span class="tagline">Anatomie de Parfum</span>
          <h2>The Pyramid of Resonance</h2>
          <div class="divider"></div>
        </div>

        ${(() => {
          const pyramidScentNames = {
            'petralux': 'Petralux',
            'ash': 'Ash',
            'king-scar': 'King Scar',
            'spark': 'Spark',
            'oud-rion': 'Oud Rion',
            'wood-sera': 'Wood Sera'
          };
          const pyramidScentIds = ['petralux', 'ash', 'king-scar', 'spark', 'oud-rion', 'wood-sera'];
          const pyramidScents = pyramidScentIds.map(id => {
            const p = MYTHOLIS_CATALOG.find(item => item.id === id);
            const shortName = pyramidScentNames[id] || id;
            return { id, product: p, shortName };
          }).filter(s => s.product);

          const activeId = (typeof app !== 'undefined' && app.activePyramidScent) ? app.activePyramidScent : 'petralux';
          const activeScentObj = pyramidScents.find(s => s.id === activeId) || pyramidScents[0];
          const activeScent = activeScentObj.product;
          const activeShortName = activeScentObj.shortName;

          return `
            <!-- 6 Interactive Extrait Tabs -->
            <div class="pyramid-tabs-nav" id="pyramidPillsRow">
              ${pyramidScents.map(s => {
                const isActive = s.id === activeScentObj.id;
                return `
                  <button class="glass-pill pyramid-tab-btn ${isActive ? 'active' : ''}"
                          onclick="app.selectPyramidScent('${s.id}')"
                          data-scent-id="${s.id}"
                          style="cursor: pointer; transition: all 0.25s ease; ${isActive ? 'background: var(--gold-primary); color: #020C08; border-color: var(--gold-light); font-weight: 600;' : ''}">
                    ${s.shortName}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Notes Pyramid Grid -->
            <div id="pyramid-resonance-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; transition: opacity 0.25s ease, transform 0.25s ease;">
              <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
                <div style="font-family: var(--font-serif-title); font-size: 1.5rem; margin-bottom: 1rem; color: var(--gold-primary); letter-spacing: 0.15em;">I</div>
                <h3 class="font-title pyramid-card-title">Top Notes: Ether</h3>
                <p id="pyramid-top-notes" style="color: var(--gold-light); font-size: 0.95rem; font-weight: 500; margin-bottom: 0.6rem; line-height: 1.5;">
                  ${activeScent.notes.top.join(' · ')}
                </p>
                <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                  The immediate spark of luminous olfactory energy that awakens the spirit.
                </p>
              </div>

              <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
                <div style="font-family: var(--font-serif-title); font-size: 1.5rem; margin-bottom: 1rem; color: var(--gold-primary); letter-spacing: 0.15em;">II</div>
                <h3 class="font-title pyramid-card-title">Heart Notes: Core</h3>
                <p id="pyramid-heart-notes" style="color: var(--gold-light); font-size: 0.95rem; font-weight: 500; margin-bottom: 0.6rem; line-height: 1.5;">
                  ${activeScent.notes.heart.join(' · ')}
                </p>
                <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                  The lingering, evocative emotional signature and sacred core as the extrait unfolds.
                </p>
              </div>

              <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
                <div style="font-family: var(--font-serif-title); font-size: 1.5rem; margin-bottom: 1rem; color: var(--gold-primary); letter-spacing: 0.15em;">III</div>
                <h3 class="font-title pyramid-card-title">Base Notes: Anchor</h3>
                <p id="pyramid-base-notes" style="color: var(--gold-light); font-size: 0.95rem; font-weight: 500; margin-bottom: 0.6rem; line-height: 1.5;">
                  ${activeScent.notes.base.join(' · ')}
                </p>
                <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                  Sustainably cultivated Assam agarwood accord, golden amber resin, and Haitian vetiver. An enduring presence lasting 12–14+ hours on skin and 48+ hours on attire.
                </p>
              </div>
            </div>

            <!-- Direct CTA Button below Pyramid -->
            <div style="text-align: center; margin-top: 3rem;">
              <button id="pyramid-cta-btn" class="btn btn-gold" onclick="app.openProductView('${activeScent.id}')">
                Acquire ${activeShortName} →
              </button>
            </div>
          `;
        })()}
      </section>
    `;
  },

  /* Render Collections View */
  renderCollections() {
    const categories = ['All', 'Woody · Mineral', 'Oud · Royal', 'Amber · Opulent', 'Fresh · Electric', 'Smoky · Sensual', 'Woody · Evening'];
    const active = store.activeCategory;
    const baseList = MYTHOLIS_CATALOG.filter(p => p.id !== 'mytholis-discovery-set');
    const filteredProducts = active === 'All' 
      ? baseList 
      : baseList.filter(p => p.collection.toLowerCase() === active.toLowerCase());

    return `
      <div class="container">
        <div class="section-header">
          <span class="tagline">Based in UK · Handcrafted in India</span>
          <h2>Haute Parfumerie Catalog</h2>
          <div class="divider"></div>
        </div>

        <!-- Filter Bar -->
        <div class="collection-filter-bar">
          ${categories.map(cat => `
            <button class="btn ${cat === active ? 'btn-gold' : 'btn-glass'} filter-pill-btn" 
                    onclick="store.activeCategory = '${cat}'; app.renderCurrentView();">
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Products Grid (3x2 Signature Extraits) -->
        <div class="products-grid">
          ${filteredProducts.map(p => this.renderProductCard(p)).join('')}
        </div>
      </div>
    `;
  },

  /* Render Know Us View */
  renderKnowUs() {
    return `
      <div class="container" style="max-width: 900px;">
        <div class="section-header">
          <span class="tagline">Six Elements. Six Legends. One House.</span>
          <h2>The Alchemy of Mytholis</h2>
          <div class="divider"></div>
        </div>

        <div class="liquid-glass-card craft-story-card">
          <h3 class="craft-story-title">"Wear Your Legend."</h3>
          <p class="craft-story-text">
            Founded on the principle of uncompromised olfactory artistry, House Mytholis unites British formulation heritage with the richness of Indian distillation mastery. Designed in Mayfair, London and handcrafted in Ahmedabad, India.
          </p>
          <p class="craft-story-text">
            Each composition is blended with 40% IFRA-certified fine perfume oils and undergoes 120 days of cold maceration inside dark emerald glass carboys before receiving hand-blown crystal encapsulation.
          </p>
        </div>

        <div class="scent-pyramid-container" style="margin-top: 2rem;">
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">120</h4>
            <p>Days Cold Barrel Maceration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">40%</h4>
            <p>Extrait de Parfum Concentration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">100%</h4>
            <p>IFRA Compliant & Cruelty-Free</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 3rem;">
          <button class="btn btn-gold" onclick="app.navigateTo('find-scent')">
            Begin Olfactory Quiz
          </button>
        </div>
      </div>
    `;
  },

  /* Render Find My Scent Quiz View */
  renderFindScent(step = 1) {
    const questions = [
      {
        step: 1,
        title: "What atmosphere stirs your spirit most?",
        options: [
          { letter: "A", text: "Regal presence & absinthe spice (Aromatic · Men)", product: "king-scar" },
          { letter: "B", text: "Smouldering embers & sacred woods (Woody · Unisex)", product: "ash" },
          { letter: "C", text: "Radiant golden pineapple & chypre (Fruity · Unisex)", product: "petralux" },
          { letter: "D", text: "Electric neroli, citrus & leather (Aromatic · Unisex)", product: "spark" }
        ]
      },
      {
        step: 2,
        title: "Which presence do you wish to command?",
        options: [
          { letter: "A", text: "The King of Woods: Royal Oud & Saffron", product: "oud-rion" },
          { letter: "B", text: "The Forest at Golden Hour: Velvet Rose & Oud", product: "wood-sera" },
          { letter: "C", text: "Light Trapped in Stone: Golden Fruit & Birch", product: "petralux" },
          { letter: "D", text: "Sacred Embers: Sandalwood & Amber", product: "ash" }
        ]
      }
    ];

    if (step > questions.length) {
      const matchedProduct = MYTHOLIS_CATALOG[0]; // Terra Petra
      return `
        <div class="container">
          <div class="quiz-wrapper quiz-result-card liquid-glass-card">
            <!-- Scent Initiation Milestone Banner -->
            <div class="initiation-reward-banner liquid-glass-card" style="margin-bottom: 1.5rem; border: 1px solid var(--gold-primary); padding: 1.2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; text-align: left;">
              <div>
                <span class="glass-pill" style="font-size: 0.68rem; color: var(--gold-light);">The Circle of Legends</span>
                <h4 style="font-size: 1.05rem; color: var(--gold-light); margin: 0.4rem 0 0.2rem;">Initiation Honorific Awarded</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">+150 Spendable Mythos & +100 Legacy Mythos credited to your Circle of Legends account.</p>
              </div>
              <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.5rem 1.1rem;" onclick="app.navigateTo('circle-of-legends')">View Vault Rewards</button>
            </div>

            <span class="glass-pill" style="margin-bottom: 1rem;">98.6% Olfactory Match</span>
            <h2 class="gold-shimmer-text quiz-match-title">Your Signature Extrait Is: ${matchedProduct.name}</h2>
            <div style="max-width: 320px; margin: 0 auto 2rem;" class="bottle-pedestal-glow">
              <img src="${matchedProduct.image}" alt="${matchedProduct.name}" class="quiz-result-img" />
            </div>
            <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem;">${matchedProduct.name}</h3>
            <p class="subtitle" style="margin-bottom: 1.5rem;">${matchedProduct.subtitle}</p>
            <!-- Sixth Sense Guarantee & Upgrade Hook -->
            <div class="coffret-upgrade-card liquid-glass-card" style="margin-bottom: 2rem; padding: 1.2rem; border: 1px solid rgba(212, 175, 55, 0.4); text-align: left;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                <div>
                  <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">Sixth Sense Guarantee</span>
                  <h4 style="font-size: 1.05rem; color: var(--gold-light); margin: 0.3rem 0 0.2rem;">Try before committing to a full flacon</h4>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
                    Experience this scent alongside all 5 other extraits in <strong>Sixth Sense</strong>. Includes a <strong>₹1,000 voucher</strong> redeemable against your first full 50ml flacon!
                  </p>
                </div>
                <div style="font-size: 1.3rem; font-weight: 700; color: var(--gold-primary);">₹3,999</div>
              </div>
            </div>

            <div class="quiz-result-actions">
              <button class="btn btn-gold" style="flex: 1;" onclick="app.quickAddToCart('${matchedProduct.id}')">
                Acquire Matched Flacon (${store.formatPrice(matchedProduct.price)})
              </button>
              <button class="btn btn-gold" style="flex: 1; background: linear-gradient(135deg, #10B981 0%, #047857 100%); border: 1px solid #34D399;" onclick="app.quickAddToCart('mytholis-discovery-set')">
                Try in Sixth Sense (₹3,999)
              </button>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.2rem;">
              <button class="btn btn-glass" onclick="app.openProductView('${matchedProduct.id}')">View Detailed Pyramids</button>
              <button class="btn btn-glass" onclick="app.renderQuizStep(1)">Retake Quiz</button>
            </div>
          </div>
        </div>
      `;
    }

    const currentQ = questions[step - 1];
    const progressPct = (step / questions.length) * 100;

    return `
      <div class="container">
        <div class="quiz-wrapper liquid-glass-card">
          <div class="quiz-progress-track">
            <div class="quiz-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
          <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.2em;">Step ${step} of 2</span>
          <h2 class="quiz-title">${currentQ.title}</h2>

          <div class="quiz-options-grid">
            ${currentQ.options.map(opt => `
              <div class="quiz-option-card liquid-glass-card" onclick="app.renderQuizStep(${step + 1})">
                <span class="quiz-option-icon" style="font-family: var(--font-serif-title); font-size: 1.05rem; color: var(--gold-primary); font-weight: 600;">${opt.letter}</span>
                <span class="quiz-option-text">${opt.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* Render Track Order View */
  renderTrackOrder() {
    const userOrders = (store.user && Array.isArray(store.user.orders)) ? store.user.orders : [];

    return `
      <div class="container" style="max-width: 900px;">
        <div class="section-header">
          <span class="tagline">Client Vault Portal</span>
          <h2>Track Your Shipment</h2>
          <div class="divider"></div>
        </div>

        <div class="liquid-glass-card track-order-card">
          <label class="track-input-label">
            Enter Tracking Number or Order ID:
          </label>
          <div class="track-input-wrap">
            <input type="text" id="track-order-input" class="engraving-input" style="flex-grow: 1; font-size: 1rem;" placeholder="e.g. Enter Order ID or AWB Tracking Number" value="" />
            <button class="btn btn-gold track-search-btn" onclick="app.searchTrackOrder()">Track Order</button>
          </div>

          ${userOrders.length > 0 ? `
            <div style="margin-top: 0.9rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Your Orders:</span>
              ${userOrders.map(o => `
                <button type="button" class="glass-pill" style="font-size: 0.7rem; cursor: pointer; color: var(--gold-light);" onclick="document.getElementById('track-order-input').value = '${o.orderId || o.id}'; app.searchTrackOrder();">
                  #${o.orderId || o.id}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div id="track-result-box" class="track-result-container">
            <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-muted);">
              <div style="font-size: 1.8rem; margin-bottom: 0.6rem; color: var(--gold-primary);">📦</div>
              <div style="font-size: 0.95rem; color: var(--gold-light); font-weight: 600; margin-bottom: 0.3rem;">Armored Dispatch Telemetry</div>
              <p style="font-size: 0.85rem; max-width: 460px; margin: 0 auto; line-height: 1.5;">
                Enter your Order ID (from your confirmation SMS, email, or order history) or courier Air Waybill (AWB) number above to view real-time fulfillment and transit status.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* Render FAQs View */
  renderFaqs() {
    const faqList = [
      {
        q: "What makes Mytholis Extrait de Parfum different from mass market perfumes?",
        a: "While typical commercial perfumes contain only 10–15% fragrance oil (Eau de Toilette), Mytholis handcrafts Extraits de Parfum at a formidable 40% concentration using IFRA-compliant fine fragrance oils. This yields extraordinary depth, rich sillage, and a lingering presence that lasts 8–10+ hours."
      },
      {
        q: "Are the gold bottle engravings personalized and permanent?",
        a: "Yes. Our master artisans precision-inlay your requested initials or name directly onto the crystal flacon with golden foil gilding, creating an enduring heirloom piece."
      },
      {
        q: "Where are Mytholis fragrances formulated and manufactured?",
        a: "Mytholis formulas are designed in our Mayfair London Studio in the UK, and artisanally compounded, macerated for 120 days, and bottled at our state-of-the-art licensed laboratory in Ahmedabad, Gujarat, India."
      },
      {
        q: "What is your shipping and delivery timeline across India?",
        a: "All orders receive complimentary express armored delivery via BlueDart and Delhivery Express. Metro deliveries arrive within 2–3 business days; all other pin codes in India arrive within 3–5 business days."
      },
      {
        q: "What is your return & damaged product replacement policy?",
        a: "Due to the intimate, hygienic nature of luxury extraits, opened items cannot be returned. However, if your crystal flacon arrives damaged or compromised during transit, we provide an immediate 100% free replacement under our Transit Guarantee."
      }
    ];

    return `
      <div class="container" style="max-width: 950px;">
        <div class="section-header">
          <span class="tagline">Client Knowledge Base</span>
          <h2>Frequently Asked Questions</h2>
          <div class="divider"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${faqList.map((item, idx) => `
            <div class="liquid-glass-card faq-card" onclick="app.toggleFaq(${idx})">
              <div class="faq-question-wrap">
                <h4 class="faq-question-text">${item.q}</h4>
                <span id="faq-icon-${idx}" class="faq-toggle-icon">+</span>
              </div>
              <p id="faq-answer-${idx}" class="font-garamond faq-answer-text">
                ${item.a}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /* Render Contact View */
  renderContact() {
    return `
      <div class="container">
        <div class="section-header">
          <span class="tagline">Bespoke Concierge</span>
          <h2>Contact Concierge</h2>
          <div class="divider"></div>
        </div>

        <div class="product-detail-layout contact-layout">
          <!-- Left: Contact Form -->
          <div class="liquid-glass-card contact-form-card">
            <h3 style="color: var(--gold-light); margin-bottom: 0.5rem; font-size: 1.6rem;">Connect with our Concierge</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem;">
              Whether seeking a bespoke gift formulation or order inquiry, our concierge responds promptly within 2 hours.
            </p>

            <form onsubmit="event.preventDefault(); app.submitContactForm();">
              <div class="contact-form-row">
                <div>
                  <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Your Name</label>
                  <input type="text" class="engraving-input" required placeholder="Full Name..." />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Email Address</label>
                  <input type="email" class="engraving-input" required placeholder="name@domain.com..." />
                </div>
              </div>

              <div style="margin-bottom: 1.2rem;">
                <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Inquiry Subject</label>
                <select class="engraving-input" style="cursor: pointer; background: #041812;">
                  <option>Order Status & Dispatch Inquiries</option>
                  <option>Custom Bottle Engraving & Corporate Gifting</option>
                  <option>Fragrance Selection Consultation</option>
                  <option>Wholesale & Retail Inquiries</option>
                </select>
              </div>

              <div style="margin-bottom: 2rem;">
                <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Message</label>
                <textarea class="engraving-input" rows="4" required placeholder="Describe your request..." style="resize: vertical;"></textarea>
              </div>

              <button type="submit" class="btn btn-gold" style="width: 100%;">
                Send Concierge Message
              </button>
            </form>
          </div>

          <!-- Right: Registered Office & Atelier -->
          <div class="contact-info-col">
            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">Registered Office · India</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Mytholis Luxury Fragrances Pvt. Ltd.</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                Vasant Vihar 2, Nava Naroda,<br/>
                Ahmedabad, Gujarat 382330, India<br/>
                <strong>GSTIN:</strong> 24AAECM4821P1ZT<br/>
                Tel: +91 777000 9170 • concierge@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">Formulation Design Studio · London</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Mytholis London Studio</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                18 Hanover Square, Mayfair,<br/>
                London W1S 1HN, United Kingdom<br/>
                london@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">WhatsApp Concierge</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Live Chat & Inquiries</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
                Connect directly with our fragrance concierge on WhatsApp for orders and private inquiries.
              </p>
              <button class="btn btn-gold btn-compact" onclick="window.open('https://wa.me/917770009170?text=' + encodeURIComponent('Hello Mytholis Concierge, I would like to inquire about your Extrait collection.'), '_blank')">
                Chat on WhatsApp (+91 777000 9170)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* Render Single Product Detailed View */
  renderProductDetail(productId) {
    const catalog = (typeof store !== 'undefined' && store.getProducts) ? store.getProducts() : MYTHOLIS_CATALOG;
    let product = catalog.find(p => p.id === productId) || MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const isCoffret = product.id === 'mytholis-discovery-set' || product.id.includes('coffret') || product.id.includes('discovery');

    // If discovery coffret / Sixth Sense, ensure clean 6 x 8ml specs
    if (isCoffret) {
      const defaultCoffret = MYTHOLIS_CATALOG.find(p => p.id === 'mytholis-discovery-set') || product;
      product = {
        ...defaultCoffret,
        ...product,
        name: "Sixth Sense",
        subtitle: "Sixth Sense",
        concentration: "Extrait de Parfum (6 × 8ml Deluxe Vials • 40% Concentration)",
        sizes: [{ ml: 48, price: 3999 }]
      };
    }

    const isWishlisted = store.isInWishlist(product.id);
    
    // Determine active size and price for this product
    const selectedMl = (typeof app !== 'undefined' && app.selectedSize) ? app.selectedSize : null;
    let activeSizeObj = selectedMl ? product.sizes.find(s => s.ml === selectedMl) : null;
    if (!activeSizeObj) {
      activeSizeObj = product.sizes[0];
    }
    const currentMl = activeSizeObj.ml;
    const currentPrice = activeSizeObj.price;
    if (typeof app !== 'undefined') {
      app.selectedSize = currentMl;
      app.selectedPrice = currentPrice;
    }
    const unitPricePerMl = (currentPrice / currentMl).toFixed(2);
    const detailMythosInfo = store.calculateProductMythos(currentPrice);

    return `
      <div class="container">
        <button class="btn btn-glass" onclick="app.navigateTo('collections')" style="margin-bottom: 2rem; padding: 0.5rem 1.2rem; font-size: 0.75rem;">
          ← Back to Vault Catalog
        </button>

        <div class="product-detail-layout">
          <!-- Left: Transparent Product Showcase -->
          <div class="product-showcase-glass liquid-glass-card bottle-pedestal-glow">
            <span class="glass-pill product-card-badge" style="top: 20px; left: 20px;">${product.tag}</span>
            <div class="transparent-bottle-frame">
              <img src="${product.image}" alt="${this.cleanText(product.name)}" class="main-bottle-view-img tilt-element" id="transparent-bottle-img" />
            </div>
            <div class="showcase-bottle-caption">
              Crystal Flacon
            </div>
            <div style="margin-top: 0.4rem;">
              <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-primary);">${product.concentration}</span>
            </div>
          </div>

          <!-- Right: Product Specifications -->
          <div class="product-spec-col">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
              <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.2em;">${product.collection}</span>
              <span class="glass-pill" style="font-size: 0.65rem;">Based in UK · Made in India</span>
            </div>
            
            <h1 class="product-detail-title">${product.name}</h1>
            <p class="subtitle" style="margin-bottom: 0.4rem;">${product.subtitle}</p>
            <p style="font-style: italic; color: var(--gold-light); font-size: 0.95rem; margin-bottom: 1.2rem; font-family: var(--font-serif-title);">"${product.tagline}"</p>

            <div class="product-detail-price-row">
              <div>
                <span class="product-price" id="detail-product-price" style="font-size: 2.2rem;">${store.formatPrice(currentPrice)}</span>
                <span class="mrp-tax-tag" id="detail-mrp-tag">MRP (Incl. of all taxes) • ₹${unitPricePerMl}/ml</span>
                <div class="detail-mythos-earn-pill" id="detail-mythos-pill">
                  <span>🪙</span> Circle of Legends Privilege: Earn <strong>+${detailMythosInfo.coins} Mythos Coins</strong> (${detailMythosInfo.pct}% Return)
                </div>
              </div>
              <span style="color: var(--gold-primary); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" fill="var(--gold-primary)" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ${product.rating} (${product.reviewsCount} verified reviews)
              </span>
            </div>

            <p class="product-detail-desc">
              ${product.description}
            </p>

            <!-- Size Selector -->
            <div style="margin-bottom: 1.5rem;">
              <label style="font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold-light); display: block; margin-bottom: 0.6rem;">
                Select Volume:
              </label>
              <div class="product-size-buttons" id="size-selector-group">
                ${product.sizes.map(s => `
                  <button class="btn ${s.ml === currentMl ? 'btn-gold' : 'btn-glass'} size-btn" 
                          data-ml="${s.ml}" data-price="${s.price}"
                          onclick="app.selectProductSize(${s.ml}, ${s.price})">
                    ${isCoffret ? `6 × 8ml (48ml Coffret) — ${store.formatPrice(s.price)}` : `${s.ml} ml — ${store.formatPrice(s.price)}`}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Performance Gauges & Quick-Glance Wear Indicators -->
            <div class="product-wear-summary-strip liquid-glass-card" style="margin-bottom: 1.5rem; padding: 0.9rem 1.2rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <div class="wear-indicator-item">
                <span class="wear-ind-label">Longevity</span>
                <strong class="wear-ind-val gold-text">10–12 Hours</strong>
              </div>
              <div class="wear-ind-divider"></div>
              <div class="wear-indicator-item">
                <span class="wear-ind-label">Sillage Projection</span>
                <strong class="wear-ind-val gold-text">${product.sillageRating >= 95 ? "Formidable" : "Intimate & Radiant"}</strong>
              </div>
              <div class="wear-ind-divider"></div>
              <div class="wear-indicator-item">
                <span class="wear-ind-label">Best Setting</span>
                <strong class="wear-ind-val gold-text">${product.gender === 'Masculine' ? 'Evening & Power Signature' : 'Evening / Signature Presence'}</strong>
              </div>
            </div>

            <div class="performance-meters">
              <div class="meter-card">
                <div class="meter-title">Concentration Longevity (${product.longevityHours}h)</div>
                <div class="meter-bar-track">
                  <div class="meter-bar-fill" style="width: ${(product.longevityHours / 12) * 100}%;"></div>
                </div>
              </div>
              <div class="meter-card">
                <div class="meter-title">Sillage Projection (${product.sillageRating}%)</div>
                <div class="meter-bar-track">
                  <div class="meter-bar-fill" style="width: ${product.sillageRating}%;"></div>
                </div>
              </div>
            </div>

            <!-- Action Buttons: Add to Cart and Buy Now -->
            <div class="product-detail-actions-stacked" style="margin-top: 1.8rem;">
              <div class="action-btn-row" style="display: flex; gap: 0.9rem;">
                <button class="btn btn-glass" style="flex: 1; padding: 1rem 1.2rem; font-size: 0.92rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-color: var(--gold-primary); color: var(--gold-light);" onclick="app.addProductToCart('${product.id}')">
                  Add to Cart
                </button>
                <button class="btn btn-gold" style="flex: 1; padding: 1rem 1.2rem; font-size: 0.92rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;" onclick="app.buyNow('${product.id}', event)">
                  Buy Now
                </button>
              </div>
            </div>

            <!-- Mandatory Legal Metrology Dossier Card -->
            <div class="legal-metrology-card liquid-glass-card" style="margin-top: 2rem;">
              <div class="legal-metrology-header">
                <span class="legal-metrology-badge">Legal Metrology Dossier</span>
                <span class="legal-metrology-country">Country of Origin: India</span>
              </div>
              <div class="legal-metrology-grid">
                <div class="legal-metrology-item">
                  <span class="metrology-label">Generic Name:</span>
                  <span class="metrology-val">${isCoffret ? 'Extrait de Parfum Discovery Wardrobe (6 × 8ml Deluxe Vials)' : 'Extrait de Parfum (Fine Fragrance)'}</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Net Content:</span>
                  <span class="metrology-val" id="metrology-net-qty">${isCoffret ? '6 × 8 ml (48 ml Total) / 1.62 fl. oz.' : `${currentMl} ml / ${ (currentMl * 0.0338).toFixed(1) } fl. oz.`}</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">MRP (Incl. all taxes):</span>
                  <span class="metrology-val" id="metrology-mrp">${store.formatPrice(currentPrice)} (₹${unitPricePerMl}/ml)</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Formulated By:</span>
                  <span class="metrology-val">Mytholis London Studio, 18 Hanover Square, Mayfair, London W1S 1HN, UK</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Manufactured & Packed:</span>
                  <span class="metrology-val">Mytholis Luxury Fragrances Pvt. Ltd., Vasant Vihar 2, Nava Naroda, Ahmedabad, Gujarat 382330, India (Mfg Lic: GC/1428-A)</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Marketed By:</span>
                  <span class="metrology-val">Mytholis Luxury Fragrances Pvt. Ltd., Vasant Vihar 2, Nava Naroda, Ahmedabad, Gujarat 382330, India (GSTIN: 24AAECM4821P1ZT)</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Month & Year of Mfg:</span>
                  <span class="metrology-val">06 / 2026</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Best Before:</span>
                  <span class="metrology-val">36 Months from Date of Mfg</span>
                </div>
                <div class="legal-metrology-item full-width">
                  <span class="metrology-label">Consumer Care Concierge:</span>
                  <span class="metrology-val">Email: concierge@mytholis.com | WhatsApp/Tel: +91 777000 9170</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Olfactory Architecture: Discovery Wardrobe vs Scent Pyramid -->
        ${isCoffret ? `
          <div style="margin-top: 5rem;">
            <div class="section-header">
              <span class="tagline">Sixth Sense Olfactory Wardrobe</span>
              <h2>All Six Master Extraits Included</h2>
              <div class="divider"></div>
              <p style="max-width: 680px; margin: 1rem auto 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">
                Six independent olfactory signatures crafted at 40% Extrait de Parfum concentration. Each master formulation is presented in a deluxe 8ml precision atomizer (48ml total extrait volume).
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 3rem;">
              ${[
                {
                  id: "king-scar",
                  name: "King Scar",
                  vol: "8ml Deluxe Flacon",
                  family: "Aromatic Spicy · Masculine",
                  accords: "Spices · Lavender · Absinthe · Haitian Vetiver",
                  desc: "Commanding, sharp and regal with pink pepper, peppermint, absinthe, and Haitian vetiver.",
                  image: "assets/product/1kingscar.webp"
                },
                {
                  id: "petralux",
                  name: "Petralux",
                  vol: "8ml Deluxe Flacon",
                  family: "Fruity Chypre · Unisex",
                  accords: "Italian Bergamot · Golden Pineapple · Amber",
                  desc: "Luminous luxury and royal fruit trapped in stone with crisp bergamot, apple, and golden amber.",
                  image: "assets/product/2petralux.webp"
                },
                {
                  id: "oud-rion",
                  name: "Oud Rion",
                  vol: "8ml Deluxe Flacon",
                  family: "Resinous Amber · Unisex",
                  accords: "Smoked Saffron · Cambodian Agarwood · Bulgarian Rose",
                  desc: "Opulent Arabian majesty with warm cardamom, smoked saffron, rich agarwood, and honeyed rose.",
                  image: "assets/product/3oudrion.webp"
                },
                {
                  id: "spark",
                  name: "Spark",
                  vol: "8ml Deluxe Flacon",
                  family: "Zesty Fresh Luxe · Unisex",
                  accords: "Sicilian Mandarin · Sparkling Ginger · Driftwood",
                  desc: "Electric vitality with sun-drenched mandarin, ginger, crystalline amber, and aquatic woods.",
                  image: "assets/product/4spark.webp"
                },
                {
                  id: "wood-sera",
                  name: "Wood Sera",
                  vol: "8ml Deluxe Flacon",
                  family: "Woody Leather · Masculine",
                  accords: "Mysore Sandalwood · Bourbon Cedar · Saddle Leather",
                  desc: "Aristocratic strength forged in rare sandalwood, aged bourbon cedar, violet leaf, and saddle leather.",
                  image: "assets/product/5woodsera.webp"
                },
                {
                  id: "ash",
                  name: "Ash",
                  vol: "8ml Deluxe Flacon",
                  family: "Smoky Incense · Masculine",
                  accords: "Birch Embers · Frankincense · Sacred Resins",
                  desc: "Hypnotic smoldering warmth with white birch embers, frankincense tear smoke, and dark tonka bean.",
                  image: "assets/product/6ash.webp"
                }
              ].map(item => `
                <div class="liquid-glass-card" style="padding: 1.4rem; display: flex; gap: 1.2rem; align-items: center; border: 1px solid rgba(212, 175, 55, 0.25); background: linear-gradient(135deg, rgba(2, 14, 10, 0.8) 0%, rgba(4, 24, 18, 0.5) 100%); border-radius: 12px; transition: transform 0.25s ease, border-color 0.25s ease;">
                  <img src="${item.image}" alt="${item.name}" style="width: 78px; height: 78px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.35); background: rgba(0, 0, 0, 0.5); flex-shrink: 0;" />
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.2rem; flex-wrap: wrap; gap: 0.3rem;">
                      <h4 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.05rem;">${item.name}</h4>
                      <span class="glass-pill" style="font-size: 0.65rem; color: #10B981; border-color: rgba(16, 185, 129, 0.4); font-weight: 700; padding: 0.15rem 0.5rem;">${item.vol}</span>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.35rem; font-weight: 600;">
                      ${item.family}
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0 0 0.4rem; line-height: 1.4;">${item.desc}</p>
                    <div style="font-size: 0.72rem; color: var(--gold-light); opacity: 0.85;">
                      <strong style="color: var(--gold-primary);">Accords:</strong> ${item.accords}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Privilege Voucher Callout Card -->
            <div class="liquid-glass-card" style="margin-top: 2.2rem; padding: 1.6rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.2rem; border: 1px solid rgba(212, 175, 55, 0.45); background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(2, 14, 10, 0.8) 100%); border-radius: 12px;">
              <div style="display: flex; align-items: center; gap: 1.2rem;">
                <div style="font-size: 2.2rem; width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 50%;">
                  👑
                </div>
                <div>
                  <h4 class="font-title" style="color: var(--gold-light); margin: 0 0 0.25rem; font-size: 1.15rem;">
                    Includes ₹1,000 Sovereign Flacon Credit
                  </h4>
                  <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0; line-height: 1.5;">
                    Your discovery coffret purchase includes a guaranteed ₹1,000 redemption voucher toward your first full-size 50ml or 100ml flacon.
                  </p>
                </div>
              </div>
              <button class="btn btn-gold" style="font-size: 0.85rem; padding: 0.8rem 1.8rem; font-weight: 700;" onclick="app.addProductToCart('${product.id}')">
                Acquire Sixth Sense Coffret • ₹3,999
              </button>
            </div>
          </div>
        ` : `
          <!-- Detailed Notes Pyramid for Individual Extraits -->
          <div style="margin-top: 5rem;">
            <div class="section-header">
              <span class="tagline">Olfactory Architecture</span>
              <h2>Fragrance Notes Hierarchy</h2>
              <div class="divider"></div>
            </div>

            <div class="scent-pyramid-container">
              <div class="pyramid-node liquid-glass-card">
                <h5>TOP NOTES</h5>
                <p>${product.notes && Array.isArray(product.notes.top) ? product.notes.top.join('<br/>') : ''}</p>
              </div>
              <div class="pyramid-node liquid-glass-card">
                <h5>HEART NOTES</h5>
                <p>${product.notes && Array.isArray(product.notes.heart) ? product.notes.heart.join('<br/>') : ''}</p>
              </div>
              <div class="pyramid-node liquid-glass-card">
                <h5>BASE NOTES</h5>
                <p>${product.notes && Array.isArray(product.notes.base) ? product.notes.base.join('<br/>') : ''}</p>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
  },

  /* Render Cart Modal Contents */
  renderCartModal() {
    const rawSubtotal = store.getCartTotal ? store.getCartTotal() : 0;
    const count = store.getCartCount ? store.getCartCount() : 0;
    const appliedReward = store.getAppliedReward ? store.getAppliedReward() : null;
    const discountAmount = store.getDiscountAmount ? store.getDiscountAmount(rawSubtotal) : 0;
    const appliedGift = store.getAppliedGift ? store.getAppliedGift() : null;
    const finalTotal = Math.max(0, rawSubtotal - discountAmount);
    const estLoyalty = store.getEstimatedOrderLoyalty ? store.getEstimatedOrderLoyalty(rawSubtotal, store.cart) : { spendEarned: 0, legacyEarned: 0 };
    const unusedCodes = (store.loyalty && Array.isArray(store.loyalty.active_reward_codes))
      ? store.loyalty.active_reward_codes.filter(c => !c.used)
      : [];

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" title="Bag">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 7h12l1.5 13H4.5L6 7z"/>
              <path d="M9 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title font-title">Your Cart (${count})</h3>
            <p class="modal-subtitle">Complimentary express armored delivery across India</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${store.cart.length > 0 ? `
            <button type="button" class="cart-clear-link" onclick="store.clearCart()" title="Empty bag">Clear Bag</button>
          ` : ''}
          <button class="icon-btn modal-close-btn" onclick="app.closeCartModal()" title="Close Cart">✕</button>
        </div>
      </div>

      <div class="modal-scroll-body">
        ${store.cart.length === 0 ? `
          <div class="modal-empty-state liquid-glass-card">
            <h4 class="modal-empty-title">Your Cart is Empty</h4>
            <p class="modal-empty-desc font-garamond">Explore our signature extraits or order Sixth Sense.</p>
            <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
              <button class="btn btn-gold" onclick="app.closeCartModal(); app.openProductView('mytholis-discovery-set');">
                Sixth Sense (₹3,999)
              </button>
              <button class="btn btn-glass" onclick="app.closeCartModal(); app.navigateTo('collections');">
                Explore Catalog
              </button>
            </div>
          </div>
        ` : `
          <div class="modal-items-list">
            ${store.cart.map((item, idx) => `
              <div class="modal-product-item-card liquid-glass-card">
                <img src="${item.image}" alt="${this.cleanText(item.name)}" class="modal-product-item-img" />
                <div class="modal-product-item-details">
                  <div class="modal-product-item-top">
                    <div class="modal-item-info-col">
                      <h5 class="modal-product-item-name">${item.name}</h5>
                      <p class="modal-product-item-meta">${item.size}ml ${item.engraving ? `• "${item.engraving}"` : ''}</p>
                    </div>
                    <button class="modal-remove-item-btn" onclick="store.removeFromCart(${idx})" title="Remove item from bag">
                      ✕
                    </button>
                  </div>
                  <div class="modal-product-item-bottom">
                    <span class="gold-text modal-product-item-price">${store.formatPrice(item.price * item.quantity)}</span>
                    <div class="modal-qty-control">
                      <button class="icon-btn qty-btn" onclick="store.updateCartQuantity(${idx}, -1)" title="Decrease quantity">−</button>
                      <span class="qty-num">${item.quantity}</span>
                      <button class="icon-btn qty-btn" onclick="store.updateCartQuantity(${idx}, 1)" title="Increase quantity">+</button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Sixth Sense Guarantee Callout Banner (if Sixth Sense in cart) -->
          ${store.cart.some(i => i.id === 'mytholis-discovery-set') ? `
            <div class="coffret-guarantee-cart-alert liquid-glass-card" style="margin-top: 0.6rem; padding: 0.65rem 0.85rem; border: 1px solid var(--gold-primary); background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(4, 24, 18, 0.7) 100%);">
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--gold-light); font-weight: 700; font-size: 0.82rem;">
                Sixth Sense Guarantee Activated
              </div>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0.25rem 0 0; line-height: 1.45;">
                Includes a <strong>₹1,000 voucher</strong> redeemable against your first full 50ml flacon!
              </p>
            </div>
          ` : ''}

          <!-- Vault Concessions & Voucher Input -->
          <div class="modal-section-box liquid-glass-card" style="margin-top: 0.65rem; padding: 0.75rem 0.85rem;">
            <div class="modal-section-header" style="margin-bottom: 0.45rem;">
              <h5 class="modal-section-title" style="font-size: 0.8rem;">Mythos Society Concession / Voucher</h5>
              <span class="modal-section-hint">Margin guardrails applied</span>
            </div>

            <!-- First-Time Collector Offer (20% OFF) -->
            ${!appliedReward ? `
              <div class="first-buyer-offer-banner liquid-glass-card" style="background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(4,24,18,0.85)); border: 1px solid rgba(212, 175, 55, 0.45); padding: 0.55rem 0.75rem; border-radius: 8px; margin-bottom: 0.55rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <span style="font-size: 1rem;">👑</span>
                  <div>
                    <div style="font-size: 0.76rem; font-weight: 700; color: var(--gold-light);">First-Time Collector Offer: 20% OFF</div>
                    <div style="font-size: 0.66rem; color: var(--text-muted);">Enjoy 20% off your first order with code <strong style="color: var(--gold-primary);">FIRST20</strong></div>
                  </div>
                </div>
                <button type="button" class="btn btn-gold" style="font-size: 0.66rem; padding: 0.3rem 0.6rem; white-space: nowrap;" onclick="app.applyCartPromoCode('FIRST20')">
                  Apply 20% ✦
                </button>
              </div>
            ` : ''}

            ${appliedReward ? `
              <div class="applied-voucher-banner" style="background: rgba(212, 175, 55, 0.12); border: 1px solid var(--gold-primary); padding: 0.6rem 0.75rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">${appliedReward.code}</span>
                    <strong style="color: var(--gold-light); font-size: 0.82rem;">${appliedReward.title}</strong>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
                    ${appliedReward.type === 'discount' 
                      ? `Concession applied: -${store.formatPrice(discountAmount)} (Capped at 30% of cart / ₹2,500 max)` 
                      : `Complimentary Vault Gift: ${appliedGift ? appliedGift.name : 'Exclusive Flacon'} attached`
                    }
                  </div>
                </div>
                <button class="icon-btn" onclick="app.removeCartRewardCode()" title="Remove Voucher" style="color: #ff6b6b; font-size: 0.85rem; padding: 0.2rem 0.4rem;">✕</button>
              </div>
            ` : `
              <div style="display: flex; gap: 0.4rem; margin-bottom: 0.5rem;">
                <input type="text" id="cart-voucher-input" class="engraving-input" placeholder="Enter MYTH-... Code" style="margin: 0; text-transform: uppercase; font-size: 0.8rem; padding: 0.45rem 0.75rem;" />
                <button class="btn btn-gold" style="font-size: 0.72rem; padding: 0.45rem 0.85rem; white-space: nowrap;"
                        onclick="const el = document.getElementById('cart-voucher-input'); if(el && el.value.trim()){ app.applyCartRewardCode(el.value.trim()); }">
                  Apply
                </button>
              </div>
            `}

            ${!appliedReward && unusedCodes.length > 0 ? `
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; margin-top: 0.4rem;">
                <span style="font-size: 0.68rem; color: var(--text-muted);">Quick apply:</span>
                ${unusedCodes.slice(0, 3).map(c => `
                  <button class="glass-pill" style="font-size: 0.64rem; cursor: pointer; padding: 0.2rem 0.5rem;" onclick="app.applyCartRewardCode('${c.code}')">
                    ${c.code} (${c.type === 'discount' ? `₹${c.amount}` : 'Gift'})
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Estimated Mythos Earnings -->
            <div style="margin-top: 0.55rem; padding: 0.5rem 0.7rem; border-radius: 8px; background: rgba(4, 24, 18, 0.4); border: 1px solid rgba(212, 175, 55, 0.15); font-size: 0.72rem; color: var(--gold-light); display: flex; align-items: center; gap: 0.5rem;">
              <div>
                Acquisition Earnings: <strong>+${estLoyalty.spendEarned} Spendable M</strong> & <strong>+${estLoyalty.legacyEarned} Legacy M</strong>
              </div>
            </div>
          </div>
        `}
      </div>

      ${store.cart.length > 0 ? `
        <div class="modal-footer modal-cart-footer">
          <div class="modal-subtotal-row">
            ${discountAmount > 0 ? `
              <div class="modal-subtotal-line">
                <span>Subtotal</span>
                <span>${store.formatPrice(rawSubtotal)}</span>
              </div>
              <div class="modal-concession-line">
                <span>Concession (${appliedReward ? appliedReward.code : 'Reward'})</span>
                <span>-${store.formatPrice(discountAmount)}</span>
              </div>
            ` : ''}
            ${appliedGift ? `
              <div class="modal-concession-line">
                <span>Vault Flacon Gift (${appliedGift.name})</span>
                <span class="glass-pill" style="font-size: 0.62rem; padding: 0.05rem 0.35rem;">FREE</span>
              </div>
            ` : ''}
            <div class="modal-total-line">
              <span class="modal-total-label">Total (Incl. all taxes)</span>
              <span class="modal-total-amount">${store.formatPrice(finalTotal)}</span>
            </div>
          </div>
          <div class="modal-cart-actions-row">
            <button class="cart-checkout-primary-btn" onclick="app.checkoutCart(event)">
              <span>⚡</span> Checkout (UPI · Cards · COD)
            </button>
            <div class="cart-secondary-actions-grid">
              <button class="cart-secondary-btn" onclick="app.openRazorpayModal()">
                Card / NetBanking Desk
              </button>
              <button class="cart-secondary-btn" onclick="app.checkoutCartWhatsApp()">
                Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  },

  /* Backward compatible alias */
  renderCartDrawer() {
    return this.renderCartModal();
  },

  /* Render Wishlist Modal Contents */
  renderWishlistModal() {
    const items = MYTHOLIS_CATALOG.filter(p => store.wishlist.includes(p.id));

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="color: var(--gold-primary);">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title font-title">Wishlist Vault (${items.length})</h3>
            <p class="modal-subtitle">Your curated personal extrait reserve</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeWishlistModal()" title="Close Wishlist">✕</button>
      </div>

      <div class="modal-scroll-body">
        ${items.length === 0 ? `
          <div class="modal-empty-state liquid-glass-card">
            <h4 class="modal-empty-title">Your Wishlist is Empty</h4>
            <p class="modal-empty-desc font-garamond">Save your favorite signature extraits to revisit them anytime.</p>
            <button class="btn btn-gold" onclick="app.closeWishlistModal(); app.navigateTo('collections');">
              Explore Extraits
            </button>
          </div>
        ` : `
          <div class="modal-items-list">
            ${items.map(p => `
              <div class="modal-product-item-card liquid-glass-card">
                <img src="${p.image}" alt="${this.cleanText(p.name)}" class="modal-product-item-img" />
                <div class="modal-product-item-info">
                  <span class="glass-pill" style="font-size: 0.62rem; padding: 0.15rem 0.5rem; margin-bottom: 0.2rem; display: inline-block;">${p.subtitle}</span>
                  <h5 class="modal-product-item-name">${p.name}</h5>
                  <span class="gold-text modal-product-item-price">${store.formatPrice(p.price)}</span>
                </div>
                <div class="modal-item-btn-group">
                  <button class="btn btn-gold modal-item-cta-btn" onclick="store.addToCart('${p.id}'); app.closeWishlistModal(); app.openCartModal();">
                    Add to Cart
                  </button>
                  <button class="btn btn-glass modal-item-explore-btn" onclick="app.closeWishlistModal(); app.openProductView('${p.id}');">
                    Explore
                  </button>
                  <button class="icon-btn modal-remove-btn" onclick="store.toggleWishlist('${p.id}');" title="Remove from wishlist">
                    ✕
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div class="modal-footer">
        <button class="btn btn-glass" style="width: 100%; font-size: 0.8rem; padding: 0.6rem 1rem;" onclick="app.closeWishlistModal(); app.navigateTo('collections');">
          Browse All Extraits
        </button>
      </div>
    `;
  },

  /* Render Wishlist Full Page (fallback) */
  renderWishlist() {
    return this.renderWishlistModal();
  },

  /* --------------------------------------------------------------------------
     THE CIRCLE OF LEGENDS - VIP DOSSIER & LOYALTY PROGRAM CONTENT
     -------------------------------------------------------------------------- */
  renderLoyaltyDossierContent(isModal = false) {
    const currentTier = store.getCurrentTier();
    const nextTier = store.getNextTier();
    const prog = store.getTierProgress();
    const loyalty = store.loyalty;
    const unlockedCount = (loyalty.codex_unlocked || []).length;
    const unusedCodes = (loyalty.active_reward_codes || []).filter(c => !c.used);

    return `
      <!-- 1. The Circle of Legends Hero Stats -->
      <div class="loyalty-stats-grid">
        <div class="loyalty-stat-box liquid-glass-card">
          <div class="loyalty-stat-label">Spendable Mythos</div>
          <div class="loyalty-stat-val gold-shimmer-text">${(loyalty.spendable_mythos || 0).toLocaleString()} M</div>
          <div class="loyalty-stat-hint">₹${(loyalty.spendable_mythos || 0).toLocaleString()} Concession Value</div>
        </div>
        <div class="loyalty-stat-box liquid-glass-card">
          <div class="loyalty-stat-label">Legacy Mythos</div>
          <div class="loyalty-stat-val">${(loyalty.legacy_mythos || 0).toLocaleString()} M</div>
          <div class="loyalty-stat-hint">Lifetime Status Points</div>
        </div>
        <div class="loyalty-stat-box liquid-glass-card">
          <div class="loyalty-stat-label">Full Bottles Owned</div>
          <div class="loyalty-stat-val">${loyalty.full_bottles_purchased || 0}</div>
          <div class="loyalty-stat-hint">50ml & 100ml Extraits</div>
        </div>
        <div class="loyalty-stat-box liquid-glass-card">
          <div class="loyalty-stat-label">Current Privilege</div>
          <div class="loyalty-stat-val" style="font-size: 1.25rem;">${currentTier.multiplier || 1}x Back</div>
          <div class="loyalty-stat-hint">${currentTier.cashbackPct || ((currentTier.multiplier || 1) * 3)}% Extrait Return</div>
        </div>
      </div>

      <!-- Dual-Key Next Tier Elevation Card -->
      <div class="loyalty-tier-card liquid-glass-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">Tier ${currentTier.level} of 5</span>
            <h4 style="font-size: 1.2rem; color: var(--gold-light); margin: 0.4rem 0 0.2rem;">${currentTier.name}</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
              ${nextTier ? `Path to elevation: Level ${nextTier.level} — ${nextTier.name}` : 'Pinnacle Status Achieved — Grand Sovereign of the Extrait Pantheon'}
            </p>
          </div>
          <div style="text-align: right;">
            <span class="glass-pill" style="border-color: var(--gold-primary); color: var(--gold-primary);">
              ${currentTier.multiplier || 1}x Earning Multiplier
            </span>
          </div>
        </div>

        ${nextTier ? `
          <div class="dual-key-grid">
            <div class="dual-key-item">
              <div class="dual-key-label-row">
                <span>Key 1: Legacy Mythos</span>
                <strong>${(prog.legacyCurrent || 0).toLocaleString()} / ${(prog.legacyRequired || 0).toLocaleString()} M</strong>
              </div>
              <div class="loyalty-progress-track">
                <div class="loyalty-progress-fill" style="width: ${prog.legacyPct || prog.legacyProgressPct || 0}%;"></div>
              </div>
            </div>
            <div class="dual-key-item">
              <div class="dual-key-label-row">
                <span>Key 2: Full Bottles (50ml / 100ml)</span>
                <strong>${prog.bottlesCurrent || 0} / ${prog.bottlesRequired || 0} Bottles</strong>
              </div>
              <div class="loyalty-progress-track">
                <div class="loyalty-progress-fill" style="width: ${prog.bottlesPct || prog.bottleProgressPct || 0}%;"></div>
              </div>
            </div>
          </div>
        ` : `
          <div style="margin-top: 1rem; padding: 0.8rem 1rem; border-radius: 10px; background: rgba(212, 175, 55, 0.1); border: 1px solid var(--gold-primary); font-size: 0.82rem; color: var(--gold-light);">
            <strong>Pinnacle Status:</strong> You hold the highest honor in the Mythos Society. Enjoy 5x Mythos on all acquisitions, 1-month early access to maceration vintages, and bespoke private flacon conciergerie.
          </div>
        `}
      </div>

      <!-- Initiation Hook Banner if not completed -->
      ${!loyalty.initiation_completed ? `
        <div class="modal-section-box liquid-glass-card" style="border: 1px solid var(--gold-primary); background: radial-gradient(circle at 10% 50%, rgba(212, 175, 55, 0.15) 0%, rgba(4, 24, 18, 0.6) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">Scent Initiate Privilege</span>
              <h5 style="font-size: 0.95rem; color: var(--gold-light); margin: 0.3rem 0 0.2rem;">Claim Your 150 Mythos Initiation Bounty</h5>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Register your olfactory signature in the VIP Dossier to unlock +150 Spendable & +100 Legacy Mythos.</p>
            </div>
            <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.45rem 1rem;" onclick="app.completeUserInitiation()">
              Claim Privilege
            </button>
          </div>
        </div>
      ` : ''}

      <!-- 2. The Pantheon Codex (6-Flacon Grid) -->
      <div class="modal-section-box liquid-glass-card">
        <div class="modal-section-header">
          <div>
            <h4 class="modal-section-title">The Pantheon Codex</h4>
            <span class="modal-section-hint">Acquire 50ml or 100ml flacons to illuminate and unlock legend milestones</span>
          </div>
          <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${unlockedCount} / 6 Illuminated</span>
        </div>

        <!-- Milestones Row -->
        <div class="codex-milestones-row">
          <div class="codex-milestone-box ${loyalty.trinity_claimed || unlockedCount >= 3 ? 'claimed' : ''}">
            <div>
              <strong style="color: var(--gold-light); font-size: 0.82rem;">The Trinity (3 Core Scents)</strong>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">+300 Spendable & +300 Legacy Mythos</span>
            </div>
            <span class="glass-pill" style="font-size: 0.65rem;">
              ${loyalty.trinity_claimed || unlockedCount >= 3 ? 'Unlocked' : `${unlockedCount}/3 Flacons`}
            </span>
          </div>

          <div class="codex-milestone-box ${loyalty.pantheon_claimed || unlockedCount >= 6 ? 'claimed' : ''}">
            <div>
              <strong style="color: var(--gold-light); font-size: 0.82rem;">The Full Pantheon (All 6 Scents)</strong>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">+1,000 Spendable & +1,000 Legacy Mythos</span>
            </div>
            <span class="glass-pill" style="font-size: 0.65rem;">
              ${loyalty.pantheon_claimed || unlockedCount >= 6 ? 'Unlocked' : `${unlockedCount}/6 Flacons`}
            </span>
          </div>
        </div>

        <!-- 6-Flacon Visual Grid -->
        <div class="pantheon-codex-grid">
          ${(store.CORE_SCENT_IDS || (typeof CORE_SCENT_IDS !== 'undefined' ? CORE_SCENT_IDS : ['king-scar', 'petralux', 'oud-rion', 'spark', 'wood-sera', 'ash'])).map(id => {
            const product = (typeof MYTHOLIS_CATALOG !== 'undefined' ? MYTHOLIS_CATALOG.find(p => p.id === id) : null) || { name: id, subtitle: 'Signature Extrait', image: 'assets/products/1kingscar.webp' };
            const isUnlocked = Array.isArray(loyalty.codex_unlocked) && loyalty.codex_unlocked.includes(id);

            return `
              <div class="codex-card ${isUnlocked ? 'illuminated' : 'locked'} liquid-glass-card">
                <div class="codex-bottle-wrap">
                  <img src="${product.image}" alt="${this.cleanText(product.name)}" class="codex-bottle-img" loading="lazy" decoding="async" />
                </div>
                <div>
                  <h5 style="font-family: var(--font-serif-title); font-size: 0.95rem; margin-bottom: 0.2rem; color: var(--gold-light);">${product.name}</h5>
                  <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">${product.subtitle}</p>
                </div>
                <div>
                  ${isUnlocked 
                    ? `<span class="codex-badge illuminated">ILLUMINATED</span>` 
                    : `<span class="codex-badge locked">50ml / 100ml Required</span>`
                  }
                  ${!isUnlocked ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.68rem; padding: 0.35rem 0.5rem; margin-top: 0.6rem;"
                            onclick="${isModal ? 'app.closeProfileModal();' : ''} app.openProductView('${id}')">
                      Acquire Flacon
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. Redemption Vault & Active Codes -->
      <div class="modal-section-box liquid-glass-card">
        <div class="modal-section-header">
          <div>
            <h4 class="modal-section-title">The Vault Redemptions</h4>
            <span class="modal-section-hint">Convert spendable Mythos into concessions or complimentary flacons</span>
          </div>
          <span class="gold-text" style="font-size: 0.85rem; font-weight: 700;">Balance: ${(loyalty.spendable_mythos || 0).toLocaleString()} M</span>
        </div>

        ${unusedCodes.length > 0 ? `
          <div style="margin-bottom: 1.2rem;">
            <div style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem;">
              Available Vouchers (${unusedCodes.length})
            </div>
            <div class="active-codes-grid">
              ${unusedCodes.map(c => `
                <div class="active-code-card">
                  <div class="active-code-tag">${c.code}</div>
                  <div style="font-size: 0.85rem; color: var(--gold-light); font-weight: 600;">${c.title}</div>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">
                    ${c.type === 'discount' ? `₹${c.amount} Concession (Min order ₹${(c.minOrder || 0).toLocaleString()})` : 'Complimentary Vault Gift'}
                  </div>
                  <div style="display: flex; gap: 0.4rem; margin-top: 0.2rem;">
                    <button class="btn btn-gold" style="flex: 1; font-size: 0.72rem; padding: 0.4rem;"
                            onclick="${isModal ? 'app.closeProfileModal();' : ''} app.openCartModal(); app.applyCartRewardCode('${c.code}');">
                      Apply to Cart
                    </button>
                    <button class="btn btn-glass" style="font-size: 0.72rem; padding: 0.4rem 0.6rem;" onclick="app.copyRewardCode('${c.code}')">
                      Copy
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="loyalty-vault-grid">
          ${(store.LOYALTY_REWARDS || (typeof LOYALTY_REWARDS !== 'undefined' ? LOYALTY_REWARDS : [])).map(r => {
            const isLevelLocked = currentTier.level < r.minLevel;
            const isAffordable = (loyalty.spendable_mythos || 0) >= r.cost;
            const tiers = store.LOYALTY_TIERS || (typeof LOYALTY_TIERS !== 'undefined' ? LOYALTY_TIERS : []);
            const minTierObj = tiers.find(t => t.level === r.minLevel);

            return `
              <div class="loyalty-reward-card ${isLevelLocked ? 'locked' : ''}">
                <div class="reward-top-row">
                  <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-primary); text-transform: uppercase;">${r.badge || (r.type === 'gift' ? 'Gift' : 'Voucher')}</span>
                  <span class="reward-cost-pill">${r.cost} M</span>
                </div>
                <h5 class="reward-title">${r.title}</h5>
                <p class="reward-desc">${r.desc}</p>
                <div>
                  ${isLevelLocked ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.7rem; padding: 0.45rem; opacity: 0.6; cursor: not-allowed;" disabled>
                      Unlocks at ${minTierObj ? minTierObj.name : `Level ${r.minLevel}`}
                    </button>
                  ` : !isAffordable ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.7rem; padding: 0.45rem; opacity: 0.6; cursor: not-allowed;" disabled>
                      Need ${(r.cost - loyalty.spendable_mythos).toLocaleString()} more M
                    </button>
                  ` : `
                    <button class="btn btn-gold" style="width: 100%; font-size: 0.72rem; padding: 0.45rem;" onclick="app.redeemReward('${r.id}')">
                      Redeem for ${r.cost} M
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4. Collector Referral Sanctum -->
      ${this.renderReferralPanel(isModal)}

      <!-- 5. Tier Perks Comparative Table -->
      <div class="modal-section-box liquid-glass-card">
        <div class="modal-section-header">
          <h4 class="modal-section-title">The Circle of Legends Hierarchy</h4>
          <span class="modal-section-hint">Dual-Key Tier Structure & Privileges</span>
        </div>

        <div class="tier-perks-table-wrap">
          <table class="tier-perks-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Dual Keys (Legacy / Bottles)</th>
                <th>Earning Multiplier</th>
                <th>Early Access</th>
                <th>Shipping</th>
                <th>Annual Birthday Gift</th>
              </tr>
            </thead>
            <tbody>
              ${(store.LOYALTY_TIERS || LOYALTY_TIERS).map(t => {
                const isCurrent = t.level === currentTier.level;
                const shippingText = (typeof t.freeShippingMin === 'number' && t.freeShippingMin > 0)
                  ? `Free over ₹${t.freeShippingMin.toLocaleString()}`
                  : (t.shipping || 'Complimentary Armored');
                const bdayText = t.birthdayPerk || t.birthday || 'Bespoke Scent Privilege';
                const cashback = t.cashbackPct !== undefined ? t.cashbackPct : ((t.multiplier || 1) * 3);
                return `
                  <tr class="${isCurrent ? 'current-tier-row' : ''}">
                    <td>
                      <strong>Level ${t.level}: ${t.name}</strong>
                      ${isCurrent ? '<span class="glass-pill" style="font-size: 0.6rem; margin-left: 0.3rem;">CURRENT</span>' : ''}
                    </td>
                    <td>${(t.minLegacy || 0).toLocaleString()} M & ${t.minBottles || 0} ${t.minBottles === 1 ? 'Bottle' : 'Bottles'}</td>
                    <td><strong class="gold-text">${t.multiplier || 1}x</strong> (${cashback}% back)</td>
                    <td>${t.earlyAccess || 'Standard Release'}</td>
                    <td>${shippingText}</td>
                    <td>${bdayText}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Link to Official Bylaws & Rules Page -->
        <div style="text-align: center; margin-top: 1.2rem; padding: 1rem; border-radius: 12px; background: rgba(212, 175, 55, 0.08); border: 1px dashed var(--gold-primary);">
          <span style="font-size: 0.82rem; color: var(--gold-light); margin-right: 0.8rem; display: inline-block; margin-bottom: 0.4rem;">
            Want to inspect the full dual-key bylaws, margin guardrails & charter?
          </span>
          <button class="btn btn-gold" style="font-size: 0.75rem; padding: 0.4rem 1rem;" onclick="${isModal ? 'app.closeProfileModal();' : ''} app.navigateTo('circle-of-legends-rules')">
            Read Official Rules & Regulations
          </button>
        </div>
      </div>
    `;
  },

  /* --------------------------------------------------------------------------
     THE CIRCLE OF LEGENDS - DEDICATED RULES & REGULATIONS PAGE VIEW
     -------------------------------------------------------------------------- */
  renderLoyaltyRules() {
    const currentTier = store.getCurrentTier ? store.getCurrentTier() : LOYALTY_TIERS[0];
    const loyalty = store.loyalty || {};
    const tiers = store.LOYALTY_TIERS || LOYALTY_TIERS;
    const rewards = store.LOYALTY_REWARDS || LOYALTY_REWARDS;

    return `
      <div class="loyalty-rules-wrap">
        <!-- Hero Header -->
        <div class="loyalty-rules-hero liquid-glass-card">
          <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light); margin-bottom: 0.8rem; letter-spacing: 0.15em;">
            HOUSE MYTHOLIS · OFFICIAL CONSTITUTION
          </span>
          <h1 class="gold-shimmer-text" style="font-size: clamp(2rem, 3.8vw, 3rem); font-family: var(--font-serif-title); margin-bottom: 0.6rem;">
            The Circle of Legends
          </h1>
          <p style="font-size: 1.1rem; color: var(--gold-light); font-family: var(--font-serif-title); margin-bottom: 1rem;">
            Rules, Regulations, Dual-Key Governance & Concession Bylaws
          </p>
          <div class="divider" style="margin: 1.2rem auto;"></div>
          <p style="color: var(--text-muted); max-width: 680px; margin: 0 auto 1.5rem; font-size: 0.92rem; line-height: 1.7;">
            Welcome to the official operational charter of <em>The Mythos Society</em>. This constitution governs points accrual, dual-key tier elevations, the Pantheon Codex, and the mathematical margin guardrails protecting House Mytholis Haute Parfumerie.
          </p>

          <!-- Current Member Status Header -->
          <div style="display: inline-flex; align-items: center; gap: 1rem; padding: 0.8rem 1.4rem; border-radius: 30px; background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.3); flex-wrap: wrap; justify-content: center;">
            <span style="font-size: 0.82rem; color: var(--text-muted);">Your Standing:</span>
            <strong style="color: var(--gold-light); font-size: 0.9rem;">Level ${currentTier.level}: ${currentTier.name}</strong>
            <span style="color: var(--gold-primary);">•</span>
            <span style="font-size: 0.82rem; color: var(--gold-light);">${(loyalty.spendable_mythos || 0).toLocaleString()} Spendable M</span>
            <button class="btn btn-gold" style="font-size: 0.72rem; padding: 0.35rem 0.8rem;" onclick="app.navigateTo('circle-of-legends')">
              View Rewards
            </button>
          </div>
        </div>

        <!-- Sticky Navigation Anchor Bar -->
        <nav class="loyalty-nav-anchor-bar">
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-1').scrollIntoView({ behavior: 'smooth' })">I. Membership</a>
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-2').scrollIntoView({ behavior: 'smooth' })">II. Two Currencies</a>
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-3').scrollIntoView({ behavior: 'smooth' })">III. Dual-Key Tiers</a>
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-4').scrollIntoView({ behavior: 'smooth' })">IV. Points & Codex</a>
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-5').scrollIntoView({ behavior: 'smooth' })">V. Margin Guardrails</a>
          <a class="loyalty-anchor-pill" onclick="document.getElementById('art-6').scrollIntoView({ behavior: 'smooth' })">VI. House Governance</a>
        </nav>

        <!-- ARTICLE I -->
        <section id="art-1" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE I</span>
            <h2 class="loyalty-article-title">Membership & The Scent Initiation Protocol</h2>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.2rem;">
            Enrollment into <strong>The Circle of Legends</strong> constitutes an exclusive privilege extended to collectors of House Mytholis. Membership is voluntary, automatic upon first qualification, and subject to adherence to these bylaws.
          </p>

          <div class="loyalty-rule-grid">
            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 1.1 Automatic Enrollment
              </div>
              <p class="loyalty-rule-subcard-desc">
                Any client who completes a flacon acquisition through official House Mytholis channels or completes the Scent Finder Quiz is automatically inducted as a Level 1 Observer.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 1.2 The Initiation Bounty
              </div>
              <p class="loyalty-rule-subcard-desc">
                Upon completing their olfactory signature via the Scent Finder Quiz or registering in the Obsidian Dossier, each initiate receives a one-time grant of <strong>+150 Spendable Mythos</strong> (₹150 concession value) and <strong>+100 Legacy Mythos</strong>.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 1.3 Singular Identity & Non-Transferability
              </div>
              <p class="loyalty-rule-subcard-desc">
                Each membership is linked strictly to a single verified client profile, verified WhatsApp contact, and email address. Points, privileges, and unlocked flacons cannot be transferred, sold, or pooled across accounts.
              </p>
            </div>
          </div>
        </section>

        <!-- ARTICLE II -->
        <section id="art-2" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE II</span>
            <h2 class="loyalty-article-title">The Dual-Currency Architecture: Spendable vs. Legacy Mythos</h2>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.5rem;">
            House Mytholis operates a bifurcated loyalty accounting model. This ensures that enjoying your rewards never penalizes or diminishes your earned prestige and tier ranking.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <!-- Spendable Mythos -->
            <div class="liquid-glass-card" style="padding: 1.8rem; border: 1.5px solid rgba(212, 175, 55, 0.35);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                <span class="glass-pill" style="color: var(--gold-light);">Liquid Concession Power</span>
                <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-primary);">Spendable</span>
              </div>
              <h3 style="font-family: var(--font-serif-title); color: var(--gold-light); font-size: 1.3rem; margin-bottom: 0.5rem;">
                Spendable Mythos
              </h3>
              <div style="font-size: 0.82rem; color: var(--gold-primary); font-weight: 700; margin-bottom: 1rem;">
                100 Spendable Mythos = ₹100 INR Concession Value
              </div>
              <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.7; padding-left: 1.2rem; margin: 0;">
                <li>Redeemable in the Vault for single-use discount concession codes (e.g., ₹200, ₹400, ₹800, ₹2,500 off).</li>
                <li>Used to claim complimentary travel atomizers (8ml), flacon miniatures (15ml), or full extrait bottles.</li>
                <li><strong>Deducted immediately</strong> from your balance upon voucher generation in the Vault.</li>
              </ul>
            </div>

            <!-- Legacy Mythos -->
            <div class="liquid-glass-card" style="padding: 1.8rem; border: 1.5px solid rgba(212, 175, 55, 0.35);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                <span class="glass-pill" style="color: var(--gold-light);">Permanent Honorific Score</span>
                <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-primary);">Lifetime</span>
              </div>
              <h3 style="font-family: var(--font-serif-title); color: var(--gold-light); font-size: 1.3rem; margin-bottom: 0.5rem;">
                Legacy Mythos
              </h3>
              <div style="font-size: 0.82rem; color: var(--gold-primary); font-weight: 700; margin-bottom: 1rem;">
                Lifetime Status Score — NEVER Decreases
              </div>
              <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.7; padding-left: 1.2rem; margin: 0;">
                <li>Tracks the collector's lifetime journey and volume within House Mytholis.</li>
                <li><strong>Never decreases</strong> when Spendable Mythos is redeemed in the Vault.</li>
                <li>Serves as Key 1 of the Dual-Key requirement to elevate your status through Levels 1 to 5.</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ARTICLE III -->
        <section id="art-3" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE III</span>
            <h2 class="loyalty-article-title">The Dual-Key Tier Elevation Criteria (Levels 1–5)</h2>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.2rem;">
            Elevation in The Circle of Legends cannot be achieved merely through casual spend or volume alone. House Mytholis enforces a strict <strong>Dual-Key Protocol</strong>: advancing to the next tier requires satisfying <em>both</em> the Lifetime Legacy Mythos milestone and the Full Bottles count simultaneously.
          </p>

          <div class="tier-perks-table-wrap" style="margin: 1.5rem 0;">
            <table class="tier-perks-table">
              <thead>
                <tr>
                  <th>Tier Level</th>
                  <th>Key 1: Legacy Mythos</th>
                  <th>Key 2: Full Bottles</th>
                  <th>Earning Multiplier</th>
                  <th>Shipping Privilege</th>
                  <th>Early Access</th>
                  <th>Annual Birthday Honor</th>
                </tr>
              </thead>
              <tbody>
                ${tiers.map(t => `
                  <tr class="${t.level === currentTier.level ? 'current-tier-row' : ''}">
                    <td>
                      <strong style="color: var(--gold-light);">Level ${t.level}: ${t.name}</strong>
                      ${t.level === currentTier.level ? '<span class="glass-pill" style="font-size: 0.6rem; margin-left: 0.4rem;">YOU ARE HERE</span>' : ''}
                      <div style="font-size: 0.72rem; color: var(--text-muted);">${t.tagline || ''}</div>
                    </td>
                    <td><strong>${t.minLegacy.toLocaleString()} M</strong></td>
                    <td><strong>${t.minBottles} ${t.minBottles === 1 ? 'Bottle' : 'Bottles'}</strong> (50ml/100ml)</td>
                    <td><strong class="gold-text">${t.multiplier}x</strong> (${t.cashbackPct || (t.multiplier * 3)}% return)</td>
                    <td>${t.freeShippingMin === 0 ? 'Complimentary Armored' : `Free over ₹${t.freeShippingMin.toLocaleString()}`}</td>
                    <td>${t.earlyAccess}</td>
                    <td>${t.birthdayPerk || t.birthday}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="loyalty-guardrail-alert">
            <div class="loyalty-guardrail-alert-header">
              The Dual-Key Governance Rule
            </div>
            <p style="font-size: 0.85rem; color: var(--text-main); margin: 0; line-height: 1.6;">
              If a collector accumulates 3,000 Legacy Mythos but owns only 2 Full Bottles, they remain at <strong>Level 2: The Curator</strong> until acquiring their 3rd full bottle (50ml or 100ml), which then unlocks <strong>Level 3: The Collector</strong>. Both keys must turn to open the chamber.
            </p>
          </div>
        </section>

        <!-- ARTICLE IV -->
        <section id="art-4" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE IV</span>
            <h2 class="loyalty-article-title">Points Arithmetic, Bottle Bonuses & The Pantheon Codex</h2>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.2rem;">
            Every acquisition from House Mytholis contributes transparently to your Spendable Mythos balance and Legacy status.
          </p>

          <div class="loyalty-rule-grid">
            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 4.1 Base Acquisition Earning Formula
              </div>
              <p class="loyalty-rule-subcard-desc">
                For every ₹100 spent in base order subtotal, the member earns 3 base Mythos multiplied by their active Tier multiplier.
              </p>
              <div class="loyalty-formula-box">
                Spendable M = ⌊Subtotal INR ÷ 100⌋ × 3 × Tier Multiplier
              </div>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                <em>Example:</em> An Archivist (4x multiplier) acquiring a ₹6,999 flacon earns: ⌊6999 ÷ 100⌋ × 3 × 4 = <strong>828 Spendable Mythos</strong>.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 4.2 Full Bottle Milestone Bonuses
              </div>
              <p class="loyalty-rule-subcard-desc">
                In addition to purchase points, full bottles permanently accelerate your Legacy Status:
              </p>
              <ul style="color: var(--gold-light); font-size: 0.82rem; line-height: 1.7; padding-left: 1.2rem; margin: 0.5rem 0;">
                <li>Each <strong>50ml Flacon</strong>: <strong>+300 Legacy Mythos</strong> & +1 Bottle Count</li>
                <li>Each <strong>100ml Flacon</strong>: <strong>+500 Legacy Mythos</strong> & +1 Bottle Count</li>
              </ul>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0;">
                <em>Note:</em> Sixth Sense earns standard spendable points but does not award bottle milestone points.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 4.3 The Pantheon Codex Milestones
              </div>
              <p class="loyalty-rule-subcard-desc">
                Collecting unique flacons across our 6 core signature extraits (<em>Ash, King Scar, Petralux, Spark, Oud Rion, Wood Sera</em>) illuminates them in your Codex:
              </p>
              <ul style="color: var(--gold-light); font-size: 0.82rem; line-height: 1.7; padding-left: 1.2rem; margin: 0.5rem 0;">
                <li><strong>The Trinity (3 Scents):</strong> +300 Spendable & +300 Legacy Mythos</li>
                <li><strong>The Full Pantheon (All 6 Scents):</strong> +1,000 Spendable & +1,000 Legacy Mythos</li>
              </ul>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 4.4 Olfactory Inscriptions (Reviews)
              </div>
              <p class="loyalty-rule-subcard-desc">
                Collectors at <strong>Level 2 (The Curator)</strong> and above may submit verified olfactory reviews:
              </p>
              <ul style="color: var(--gold-light); font-size: 0.82rem; line-height: 1.7; padding-left: 1.2rem; margin: 0.5rem 0;">
                <li>Written Scent Inscription: <strong>+50 Spendable Mythos</strong></li>
                <li>Scent Inscription with Media (Unboxing Photo/Video): <strong>+100 Spendable Mythos</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ARTICLE V -->
        <section id="art-5" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE V</span>
            <h2 class="loyalty-article-title">Redemption Vault Charters & Margin Guardrails</h2>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.7; margin-bottom: 1.2rem;">
            Spendable Mythos can be converted into unique single-use concession codes via the Obsidian Vault. To safeguard the economic sustainability and pure maceration quality of Haute Parfumerie, strict margin guardrails are enforced.
          </p>

          <!-- The Margin Guardrail Box -->
          <div class="loyalty-guardrail-alert">
            <div class="loyalty-guardrail-alert-header">
              § 5.1 The 30% / ₹2,500 Margin Guardrail Rule
            </div>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.8rem; line-height: 1.6;">
              The maximum discount concession permitted through Mythos vouchers on any single order is hard-capped at <strong>30% of the cart subtotal (in base INR) or ₹2,500, whichever is lower</strong>.
            </p>
            <div style="background: rgba(4, 24, 18, 0.5); padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.8rem; color: var(--gold-light);">
              • On a ₹3,999 Sixth Sense order, the maximum concession allowable is 30% = <strong>₹1,199</strong>.<br/>
              • On a ₹6,999 Oud Rion order, a ₹2,500 voucher is utilized up to the ₹2,099 cap (30%). To utilize the full ₹2,500 voucher in a single order, the cart subtotal must be ₹8,334 or greater.
            </div>
          </div>

          <div class="loyalty-rule-grid">
            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 5.2 Single-Voucher Non-Stacking Policy
              </div>
              <p class="loyalty-rule-subcard-desc">
                Only one <code>MYTH-...</code> voucher code may be applied per checkout transaction. Mythos vouchers cannot be stacked with sitewide seasonal sale codes or influencer promotions.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 5.3 Vault Flacon Gifts (Free Items)
              </div>
              <p class="loyalty-rule-subcard-desc">
                Vouchers for complimentary gifts (8ml, 15ml, 50ml, 100ml) attach to your next qualifying order and ship inside the armored case free of charge. Gifts cannot be redeemed for fiat currency.
              </p>
            </div>
          </div>

          <!-- Official Rewards Catalog Table -->
          <h4 style="color: var(--gold-light); font-size: 1rem; margin: 1.5rem 0 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;">
            The 8 Official Vault Redemptions
          </h4>
          <div class="tier-perks-table-wrap">
            <table class="tier-perks-table">
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Required Tier</th>
                  <th>Cost (Mythos)</th>
                  <th>Reward Benefit</th>
                  <th>Minimum Order Condition</th>
                </tr>
              </thead>
              <tbody>
                ${rewards.map(r => `
                  <tr>
                    <td><code>${r.id}</code></td>
                    <td><strong>Level ${r.minLevel}: ${tiers[r.minLevel - 1] ? tiers[r.minLevel - 1].name : ''}</strong></td>
                    <td><strong class="gold-text">${r.cost} M</strong></td>
                    <td>${r.title}</td>
                    <td>${r.minOrder ? `Min order ₹${r.minOrder.toLocaleString()}` : 'No minimum order'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <!-- ARTICLE VI -->
        <section id="art-6" class="loyalty-article-card liquid-glass-card">
          <div class="loyalty-article-header">
            <span class="loyalty-article-num">ARTICLE VI</span>
            <h2 class="loyalty-article-title">Legal Charter, Expiration & House Governance</h2>
          </div>

          <div class="loyalty-rule-grid">
            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 6.1 12-Month Rolling Validity
              </div>
              <p class="loyalty-rule-subcard-desc">
                Mythos points remain active for <strong>12 continuous months</strong> from your last recorded transaction or dossier interaction. Any subsequent order resets the 12-month clock for your entire balance.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 6.2 No Fiat Monetary Value
              </div>
              <p class="loyalty-rule-subcard-desc">
                Mythos points, status levels, and vouchers constitute proprietary client honorifics. They carry zero fiat monetary value, create no property interest, and cannot be exchanged for cash under any circumstance.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 6.3 Anti-Fraud & Fair Use Protection
              </div>
              <p class="loyalty-rule-subcard-desc">
                House Mytholis reserves the sole right to audit accounts, invalidate fraudulent vouchers, reverse points credited from cancelled or chargebacked orders, or revoke status in cases of unauthorized resale or automated exploitation.
              </p>
            </div>

            <div class="loyalty-rule-subcard">
              <div class="loyalty-rule-subcard-title">
                § 6.4 Governing Jurisdiction
              </div>
              <p class="loyalty-rule-subcard-desc">
                The Circle of Legends is administered under the laws of the Republic of India. Any disputes arising under this charter are subject exclusively to the courts of Ahmedabad, Gujarat, India.
              </p>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
            <button class="btn btn-gold" onclick="app.navigateTo('circle-of-legends')">
              Explore Circle of Legends Vault
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('collections')">
              Explore Signature Extraits
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('find-scent')">
              Take Scent Quiz
            </button>
          </div>
        </section>
      </div>
    `;
  },

  /* Render Dedicated Referral & Privilege Sharing Panel */
  renderReferralPanel(isModal = false) {
    const isLoggedIn = store.isUserLoggedIn();
    const referralCode = store.getUserReferralCode();
    const referralLink = store.getUserReferralLink();
    const loyalty = store.loyalty || {};
    const referralsCount = loyalty.referrals_count || 0;
    const earnedMythos = loyalty.referrals_earned_mythos || (referralsCount * 250);

    return `
      <div class="referral-panel-card liquid-glass-card" style="border: 1px solid rgba(212, 175, 55, 0.35); padding: ${isModal ? '1.25rem' : '2rem'}; margin-bottom: 2rem; position: relative; overflow: hidden; background: radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.12) 0%, rgba(4, 24, 18, 0.7) 100%);">
        
        <!-- Header Pill & Title -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.2rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
              <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light); border-color: var(--gold-primary);">
                ⚜️ The Circle of Legends
              </span>
              <span class="glass-pill" style="font-size: 0.65rem; color: #10B981; border-color: #10B981; background: rgba(16, 185, 129, 0.1);">
                Dual-Way Luxury Bounty
              </span>
            </div>
            <h3 class="font-title" style="color: var(--gold-light); font-size: ${isModal ? '1.25rem' : '1.65rem'}; margin: 0.3rem 0 0.4rem;">
              Collector Referral Sanctum
            </h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin: 0; max-width: 620px;">
              Invite discerning collectors to House Mytholis. Your invited guests receive <strong style="color: var(--gold-light);">₹500 off</strong> their first master extrait acquisition, and <strong style="color: var(--gold-light);">+250 Spendable Mythos &amp; +150 Legacy Mythos</strong> are credited to your vault.
            </p>
          </div>
          ${!isModal ? `
            <div style="text-align: right;">
              <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.45rem 0.9rem;" onclick="app.openReferralModal()">
                Open Share Desk ↗
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Referral Code & Link Box -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <!-- 1. Unique Referral Code -->
          <div class="referral-box liquid-glass-card" style="padding: 1.1rem; background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px;">
            <span style="display: block; font-size: 0.7rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4rem;">
              Your Private Referral Key
            </span>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; background: rgba(0,0,0,0.4); padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px dashed rgba(212, 175, 55, 0.4);">
              <span id="patron-referral-code-display" style="font-family: monospace; font-size: 1.15rem; font-weight: 700; color: var(--gold-light); letter-spacing: 0.08em;">
                ${referralCode}
              </span>
              <button type="button" class="btn btn-gold" style="font-size: 0.72rem; padding: 0.35rem 0.75rem;" onclick="app.copyReferralCode()">
                Copy Key
              </button>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.45rem;">
              Redeemable at checkout voucher prompt for ₹500 discount.
            </div>
          </div>

          <!-- 2. Unique Referral Link -->
          <div class="referral-box liquid-glass-card" style="padding: 1.1rem; background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px;">
            <span style="display: block; font-size: 0.7rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.4rem;">
              Direct Invitation URL
            </span>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; background: rgba(0,0,0,0.4); padding: 0.45rem 0.65rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);">
              <input type="text" readonly id="patron-referral-link-input" value="${referralLink}" style="background: none; border: none; color: var(--text-muted); font-size: 0.76rem; width: 100%; outline: none; font-family: monospace;" onclick="this.select()" />
              <button type="button" class="btn btn-glass" style="font-size: 0.72rem; padding: 0.35rem 0.75rem; white-space: nowrap;" onclick="app.copyReferralLink()">
                Copy Link
              </button>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.45rem;">
              Automatically activates ₹500 welcome concession for visitors.
            </div>
          </div>
        </div>

        <!-- 1-Click Multi-Channel Share Buttons -->
        <div style="margin-bottom: 1.5rem;">
          <span style="display: block; font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem;">
            Instant Share Options
          </span>
          <div class="referral-share-buttons" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <!-- WhatsApp Share -->
            <button type="button" class="btn btn-referral-wa" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; border: none; font-weight: 700; font-size: 0.8rem; padding: 0.65rem 1.2rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); cursor: pointer;" onclick="app.shareReferralWhatsApp()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.044-1.925-.465-1.503-.623-2.464-2.146-2.539-2.246-.075-.101-.606-.807-.606-1.542 0-.736.386-1.096.523-1.244.137-.149.301-.187.402-.187.101 0 .202.001.29.006.094.005.218-.035.34.258.127.306.435 1.06.473 1.137.038.077.063.167.013.267-.051.101-.077.163-.153.253-.076.089-.16.199-.228.267-.076.076-.156.16-.067.313.089.152.395.651.848 1.054.582.518 1.074.678 1.226.754.152.076.241.063.33-.038.089-.101.381-.444.482-.596.101-.152.203-.127.341-.076.139.051.886.418 1.038.494.153.076.254.114.292.177.038.064.038.368-.106.773z"/>
              </svg>
              <span>Share to WhatsApp</span>
            </button>

            <!-- Native Device Share Sheet -->
            <button type="button" class="btn btn-gold" style="font-size: 0.8rem; padding: 0.65rem 1.2rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.5rem;" onclick="app.shareReferralLink()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Share via App / Messages</span>
            </button>

            <!-- Email Share -->
            <button type="button" class="btn btn-glass" style="font-size: 0.8rem; padding: 0.65rem 1.1rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.45rem;" onclick="app.shareReferralEmail()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Email Invitation</span>
            </button>
          </div>
        </div>

        <!-- Referral Stats & Live Bounties -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.8rem; margin-bottom: 1.5rem;">
          <div style="padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
            <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Guests Invited</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--gold-light); font-family: var(--font-serif-title);">${referralsCount}</div>
          </div>
          <div style="padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
            <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Mythos Bounty</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--gold-primary); font-family: var(--font-serif-title);">${earnedMythos} M</div>
          </div>
          <div style="padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
            <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Friend Saves</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #10B981; font-family: var(--font-serif-title);">₹500 Off</div>
          </div>
          <div style="padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
            <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Tier Elevate</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--gold-light); font-family: var(--font-serif-title);">+150 M</div>
          </div>
        </div>

        <!-- 3-Step Protocol Walkthrough -->
        <div style="padding-top: 1rem; border-top: 1px solid rgba(212, 175, 55, 0.2);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
            <div>
              <strong style="color: var(--gold-light); display: block; margin-bottom: 0.2rem;">1. Transmit Private Key</strong>
              Send your personal invitation code or link to fellow fragrance collectors.
            </div>
            <div>
              <strong style="color: var(--gold-light); display: block; margin-bottom: 0.2rem;">2. Guest Acquires Extrait</strong>
              Your guest saves ₹500 instantly on their first flacon or Sixth Sense order.
            </div>
            <div>
              <strong style="color: var(--gold-light); display: block; margin-bottom: 0.2rem;">3. Receive Vault Bounty</strong>
              House Mytholis automatically deposits +250 Spendable &amp; +150 Legacy Mythos into your vault.
            </div>
          </div>
        </div>

      </div>
    `;
  },

  /* Render Dedicated Referral Modal Wrapper */
  renderReferralModal() {
    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-primary); font-family: var(--font-serif-title); font-size: 1rem; color: var(--gold-light);">
            ⚜️
          </div>
          <div>
            <h3 class="modal-title font-title">Referral Sanctum</h3>
            <p class="modal-subtitle">House Mytholis • Circle of Legends</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeReferralModal()" title="Close Referral Desk">✕</button>
      </div>

      <div class="modal-scroll-body" style="padding: 1.25rem;">
        ${this.renderReferralPanel(true)}
      </div>
    `;
  },

  /* Render Registration Honor / Welcome Signup Bonus Celebration Modal */
  renderSignupBonusModal(points = 200) {
    const pts = Number(points) || 200;
    return `
      <div class="modal-header" style="justify-content: flex-end; padding: 0.75rem 1rem 0 1rem; border-bottom: none;">
        <button class="icon-btn modal-close-btn" onclick="app.closeSignupBonusModal()" title="Close Notification" style="font-size: 1.25rem;">✕</button>
      </div>
      <div style="padding: 0 1.5rem 1.85rem 1.5rem; text-align: center;">
        <div style="width: 76px; height: 76px; margin: 0 auto 1.2rem auto; border-radius: 50%; background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(13, 15, 20, 0.95) 75%); border: 2px solid var(--gold-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 35px rgba(212, 175, 55, 0.45);">
          <span style="font-size: 2.2rem; filter: drop-shadow(0 2px 8px rgba(212,175,55,0.7));">🪙</span>
        </div>

        <span class="glass-pill" style="font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 0.75rem; display: inline-block; padding: 0.35rem 0.9rem; border-color: rgba(212,175,55,0.45);">
          Initiate Welcome Honor
        </span>

        <h2 class="font-title gold-shimmer-text" style="font-size: 1.8rem; margin: 0 0 0.5rem 0; font-family: var(--font-serif-title);">
          Congratulations!
        </h2>

        <div style="font-size: 1.25rem; font-weight: 700; color: #FFF; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
          <span>You have received</span>
          <span style="color: var(--gold-light); background: rgba(212, 175, 55, 0.16); padding: 0.25rem 0.75rem; border-radius: 6px; border: 1px solid rgba(212, 175, 55, 0.4);">+${pts} Mythos</span>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin: 0 auto 1.35rem auto; max-width: 380px;">
          Your Initiate Dossier has been forged. <strong style="color: #fff;">${pts} Spendable Mythos (₹${pts} Concession Value)</strong> have been deposited directly into your private Collector Vault.
        </p>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1.5rem; text-align: left; display: flex; gap: 0.75rem; align-items: center;">
          <div style="font-size: 1.4rem;">✨</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45;">
            <strong style="color: var(--gold-light);">Instant Concession:</strong> Redeem your ${pts} Mythos at checkout for an immediate ₹${pts} order reduction, or accumulate them towards higher tiers.
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <button class="btn btn-gold" style="width: 100%; padding: 0.85rem; font-size: 0.92rem; font-weight: 600; letter-spacing: 0.04em;" onclick="app.closeSignupBonusModal(); app.navigateTo('collections');">
            Acquire Haute Parfumerie
          </button>
          <button class="btn btn-glass" style="width: 100%; padding: 0.75rem; font-size: 0.85rem;" onclick="app.closeSignupBonusModal(); app.navigateTo('circle-of-legends');">
            Inspect Collector Vault & Perks
          </button>
        </div>
      </div>
    `;
  },

  /* Render Dedicated Circle of Legends Loyalty & Vault Page */
  renderCircleOfLegends() {
    return `
      <div class="container" style="padding-top: 2rem; padding-bottom: 5rem;">
        <div class="section-header">
          <span class="tagline">Honorary Client Society</span>
          <h2>The Circle of Legends</h2>
          <div class="divider"></div>
          <p style="color: var(--text-muted); max-width: 650px; margin: 0 auto; font-size: 0.95rem;">
            Acquire handcrafted extraits, illuminate the Pantheon Codex, unlock dual-key elevation tiers, and redeem exclusive vault flacons.
          </p>
        </div>

        ${this.renderLoyaltyDossierContent(false)}
      </div>
    `;
  },

  /* Render Dedicated Luxury Collector Auth Modal (Google, Facebook, Phone OTP & Email) */
  renderAuthModal(activeTab = 'signin') {
    const isRegister = activeTab === 'register';
    const isPhone = activeTab === 'phone';
    const isSignIn = !isRegister && !isPhone;

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-primary); font-family: var(--font-serif-title); font-size: 0.95rem; color: var(--gold-light);">M</div>
          <div>
            <h3 class="modal-title font-title">The Sanctum Gate</h3>
            <p class="modal-subtitle">House Mytholis • Collector Authentication</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeProfileModal()" title="Close Sanctum Gate">✕</button>
      </div>

      <div class="modal-scroll-body" style="padding: 1.25rem;">
        <!-- Social OAuth One-Click Buttons -->
        <div class="auth-social-buttons" style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.1rem;">
          <!-- Google Sign In -->
          <button type="button" class="btn btn-glass" onclick="app.handleGoogleSignIn()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.7rem; border-color: rgba(212, 175, 55, 0.35); font-size: 0.85rem; font-weight: 600; color: var(--gold-light);">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <!-- Facebook Sign In -->
          <button type="button" class="btn btn-glass" onclick="app.handleFacebookSignIn()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.7rem; border-color: rgba(24, 119, 242, 0.4); background: rgba(24, 119, 242, 0.08); font-size: 0.85rem; font-weight: 600; color: #93c5fd;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Continue with Facebook</span>
          </button>
        </div>

        <!-- Divider -->
        <div style="display: flex; align-items: center; margin: 1.1rem 0; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;">
          <span style="flex: 1; height: 1px; background: rgba(212, 175, 55, 0.2);"></span>
          <span style="padding: 0 0.8rem;">or continue with</span>
          <span style="flex: 1; height: 1px; background: rgba(212, 175, 55, 0.2);"></span>
        </div>

        <!-- Auth Navigation Tabs -->
        <div class="auth-nav-tabs" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; margin-bottom: 1.2rem;">
          <button class="auth-nav-tab-btn ${isSignIn ? 'active' : ''}" onclick="app.switchAuthTab('signin')" style="font-size: 0.76rem; padding: 0.55rem 0.3rem; font-weight: 600;">
            ✉️ Sign In
          </button>
          <button class="auth-nav-tab-btn ${isRegister ? 'active' : ''}" onclick="app.switchAuthTab('register')" style="font-size: 0.76rem; padding: 0.55rem 0.3rem; font-weight: 600;">
            ✨ Register
          </button>
          <button class="auth-nav-tab-btn ${isPhone ? 'active' : ''}" onclick="app.switchAuthTab('phone')" style="font-size: 0.76rem; padding: 0.55rem 0.3rem; font-weight: 600;">
            📱 Phone OTP
          </button>
        </div>

        ${isSignIn ? `
          <!-- TAB 1: EMAIL SIGN IN -->
          <div class="auth-tab-pane">
            <form onsubmit="event.preventDefault(); app.handleEmailSignIn();" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Collector Email</label>
                <input type="email" id="auth-email-input" class="engraving-input" placeholder="collector@domain.com" style="width: 100%;" required />
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Password</label>
                  <button type="button" style="background: none; border: none; color: var(--gold-light); font-size: 0.72rem; cursor: pointer; text-decoration: underline; padding: 0;" onclick="app.handleForgotPassword()">Forgot?</button>
                </div>
                <input type="password" id="auth-password-input" class="engraving-input" placeholder="••••••••" style="width: 100%;" required />
              </div>

              <button type="submit" class="btn btn-gold" style="width: 100%; padding: 0.75rem; font-size: 0.85rem; margin-top: 0.4rem; font-weight: 600;">
                Enter The Sanctum
              </button>
            </form>

            <div style="text-align: center; margin-top: 1.2rem;">
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                First time at House Mytholis? 
                <button type="button" style="background: none; border: none; color: var(--gold-light); font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0;" onclick="app.switchAuthTab('register')">
                  Create Collector Account
                </button>
              </p>
            </div>
          </div>
        ` : isRegister ? `
          <!-- TAB 2: EMAIL REGISTER -->
          <div class="auth-tab-pane">
            <div style="background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 0.75rem 0.9rem; margin-bottom: 1.2rem;">
              <span class="glass-pill" style="font-size: 0.62rem; color: var(--gold-light); margin-bottom: 0.3rem;">Circle of Legends Privilege</span>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.45; margin: 0.2rem 0 0;">
                Unlock Level 1 Initiate standing, earn 3% cashback on acquisitions, and check out instantly across web and mobile.
              </p>
            </div>

            <form onsubmit="event.preventDefault(); app.handleEmailSignUp();" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Full Name</label>
                <input type="text" id="signup-name-input" class="engraving-input" placeholder="Your Title & Full Name" style="width: 100%;" required />
              </div>

              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Email Address</label>
                <input type="email" id="signup-email-input" class="engraving-input" placeholder="collector@domain.com" style="width: 100%;" required />
              </div>

              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Create Password</label>
                <input type="password" id="signup-password-input" class="engraving-input" placeholder="Min. 6 characters" style="width: 100%;" minlength="6" required />
              </div>

              <button type="submit" class="btn btn-gold" style="width: 100%; padding: 0.75rem; font-size: 0.85rem; margin-top: 0.4rem; font-weight: 600;">
                Become a Mytholis Collector
              </button>
            </form>

            <div style="text-align: center; margin-top: 1.2rem;">
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                Already have an account? 
                <button type="button" style="background: none; border: none; color: var(--gold-light); font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0;" onclick="app.switchAuthTab('signin')">
                  Sign In to Sanctum
                </button>
              </p>
            </div>
          </div>
        ` : `
          <!-- TAB 3: FIREBASE PHONE OTP AUTH -->
          <div class="auth-tab-pane">
            ${(typeof app !== 'undefined' && app.phoneOtpSent) ? `
              <div style="text-align: center; margin-bottom: 1.2rem;">
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 0.4rem;">
                  6-Digit SMS passcode dispatched to:
                </p>
                <strong style="color: var(--gold-light); font-size: 1.05rem; font-family: monospace;">+91 ${app.phoneAuthNumber || ''}</strong>
              </div>

              <form onsubmit="app.handlePhoneVerifyOtp(event)" style="display: flex; flex-direction: column; gap: 0.9rem;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Enter 6-Digit Passcode</label>
                  <input type="text" id="auth-otp-input" class="engraving-input" placeholder="123456" maxlength="6" inputmode="numeric" pattern="[0-9]*" style="width: 100%; text-align: center; font-size: 1.3rem; font-weight: 700; letter-spacing: 0.25em;" required autofocus />
                </div>

                <button type="submit" id="btn-verify-phone-otp" class="btn btn-gold" style="width: 100%; padding: 0.75rem; font-size: 0.85rem; font-weight: 600;">
                  Verify &amp; Enter Sanctum
                </button>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.75rem;">
                  <button type="button" style="background: none; border: none; color: var(--gold-light); cursor: pointer; text-decoration: underline; padding: 0;" onclick="app.handlePhoneReset()">
                    ← Change Number
                  </button>
                  <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; padding: 0;" onclick="app.handlePhoneSendOtp(event)">
                    Resend Passcode
                  </button>
                </div>
              </form>
            ` : `
              <div style="background: rgba(4, 24, 18, 0.6); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 0.75rem 0.9rem; margin-bottom: 1.1rem;">
                <p style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
                  Authenticate securely using your mobile phone. We will dispatch a 6-digit security code via Firebase SMS.
                </p>
              </div>

              <form onsubmit="app.handlePhoneSendOtp(event)" style="display: flex; flex-direction: column; gap: 0.9rem;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.35rem;">Mobile Phone Number</label>
                  <div style="display: flex; align-items: stretch; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; overflow: hidden; background: rgba(0, 0, 0, 0.35);">
                    <div style="display: flex; align-items: center; gap: 4px; padding: 0 10px; background: rgba(212, 175, 55, 0.1); border-right: 1px solid rgba(212, 175, 55, 0.3); font-weight: 600; font-size: 0.85rem; color: var(--gold-light); user-select: none;">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input type="tel" id="auth-phone-input" class="engraving-input" placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" pattern="[0-9]*" style="border: none; border-radius: 0; background: transparent; flex: 1; padding: 0.75rem 0.7rem; font-size: 0.95rem;" value="${(typeof app !== 'undefined' && app.phoneAuthNumber) || ''}" required autofocus />
                  </div>
                </div>

                <button type="submit" id="btn-send-phone-otp" class="btn btn-gold" style="width: 100%; padding: 0.75rem; font-size: 0.85rem; margin-top: 0.2rem; font-weight: 600;">
                  Request SMS Passcode
                </button>
              </form>
            `}
          </div>
        `}

        <!-- Compliance & Legal Terms Notice -->
        <div class="auth-legal-notice" style="text-align: center; margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px solid rgba(212, 175, 55, 0.15);">
          <p style="font-size: 0.69rem; color: var(--text-muted); line-height: 1.55; margin: 0;">
            By entering the Sanctum, you acknowledge and accept House Mytholis 
            <a href="/terms" target="_blank" rel="noopener noreferrer" style="color: var(--gold-light); text-decoration: underline; font-weight: 500;">Terms of Service</a>, 
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style="color: var(--gold-light); text-decoration: underline; font-weight: 500;">Privacy Policy</a>, and 
            <a href="/data-deletion" target="_blank" rel="noopener noreferrer" style="color: var(--gold-light); text-decoration: underline; font-weight: 500;">Data Deletion Policy</a>.
          </p>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; gap: 0.8rem;">
        <button class="btn btn-glass" style="flex: 1; font-size: 0.78rem; padding: 0.6rem 1rem;" onclick="app.closeProfileModal()">
          Close
        </button>
      </div>
    `;
  },

  /* Compact Collapsible Policies & Support Accordion for Android App & Compliance */
  renderPoliciesAccordion() {
    return `
      <div class="profile-policies-accordion liquid-glass-card" style="margin-top: 1.5rem; border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 10px; overflow: hidden; text-align: left;">
        <details style="cursor: pointer;">
          <summary style="padding: 0.9rem 1.2rem; font-size: 0.85rem; font-weight: 600; color: var(--gold-light); display: flex; align-items: center; justify-content: space-between; user-select: none; list-style: none;">
            <span style="display: flex; align-items: center; gap: 0.55rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Policies & Concierge Support</span>
            </span>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">View ▾</span>
          </summary>
          <div style="padding: 1rem 1.2rem; border-top: 1px solid rgba(212, 175, 55, 0.15); background: rgba(0, 0, 0, 0.25);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; margin-bottom: 0.9rem;">
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="app.openPolicyModal('privacy')">
                <span>🔒</span> Privacy Policy
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="app.openPolicyModal('terms')">
                <span>📜</span> Terms of Service
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="window.open('/data-deletion', '_blank')">
                <span>🗑️</span> Data Deletion
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="app.openPolicyModal('shipping')">
                <span>🚚</span> Shipping Policy
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="app.openPolicyModal('refund')">
                <span>🔄</span> Returns & Refunds
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="app.navigateTo('circle-of-legends-rules')">
                <span>👑</span> Loyalty Charter
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.74rem; padding: 0.5rem 0.7rem; text-align: left; justify-content: flex-start; gap: 0.35rem;" onclick="window.open('https://wa.me/917770009170', '_blank')">
                <span>💬</span> WhatsApp Concierge
              </button>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.7rem;">
              <strong>Mytholis Luxury Fragrances Pvt. Ltd.</strong> · GC/1428-A · GSTIN: 24AAECM4821P1ZT<br/>
              Mayfair, London UK · Ahmedabad, Gujarat 382330 India · Concierge: +91 777000 9170
            </div>
          </div>
        </details>
      </div>
    `;
  },

  /* Render Dedicated User Profile Page View */
  renderProfile() {
    if (!store.isUserLoggedIn()) {
      return `
        <div class="container" style="padding-top: 4rem; padding-bottom: 6rem; max-width: 680px; text-align: center;">
          <div class="liquid-glass-card" style="padding: 3rem 2rem; border: 1px solid rgba(212, 175, 55, 0.4); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);">
            <div style="width: 60px; height: 60px; margin: 0 auto 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1.5px solid var(--gold-primary); font-family: var(--font-serif-title); font-size: 1.6rem; color: var(--gold-light);">
              M
            </div>
            <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light); margin-bottom: 0.8rem;">House Mytholis</span>
            <h2 class="font-title" style="color: var(--gold-light); font-size: 2rem; margin-bottom: 0.8rem;">Enter The Sanctum</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; max-width: 480px; margin: 0 auto 2rem;">
              Sign in to access your personal Collector Dossier, manage delivery coordinates, view consignment tracking, and claim Circle of Legends rewards.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-gold" style="padding: 0.8rem 2.2rem; font-size: 0.9rem;" onclick="app.openAuthModal('signin')">
                Sign In to Sanctum
              </button>
              <button class="btn btn-glass" style="padding: 0.8rem 2rem; font-size: 0.9rem;" onclick="app.openAuthModal('register')">
                Become a Collector
              </button>
            </div>
          </div>
          ${this.renderPoliciesAccordion()}
        </div>
      `;
    }

    const u = store.user;
    const fbUser = store.firebaseUser;
    const displayName = u.name || (fbUser && fbUser.displayName) || 'Mytholis Collector';
    const email = (fbUser && fbUser.email) || u.email || '';
    const photoURL = u.photoURL || (fbUser && fbUser.photoURL) || null;
    const initial = displayName.charAt(0).toUpperCase() || 'M';
    const currentTier = store.getCurrentTier();

    return `
      <div class="container" style="padding-top: 2rem; padding-bottom: 5rem; max-width: 960px;">
        <!-- Profile Header -->
        <div class="profile-header-card liquid-glass-card" style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <div class="vip-badge-icon" style="width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1.5px solid var(--gold-primary); font-family: var(--font-serif-title); font-size: 1.4rem; color: var(--gold-light); position: relative; overflow: visible;">
              ${photoURL ? `
                <img src="${photoURL}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
              ` : initial}
              <label for="patron-page-avatar-upload" class="avatar-camera-btn" title="Upload Collector Portrait">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" id="patron-page-avatar-upload" accept="image/*" style="display:none;" onchange="app.handleProfilePhotoUpload(event)" />
              </label>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h2 class="profile-welcome-title" style="margin: 0; font-size: clamp(1.4rem, 2.8vw, 2rem);">${displayName}</h2>
                <button type="button" class="btn-edit-inline-name" onclick="app.promptEditPatronName()" title="Edit Collector Name / Title" style="background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.4); color: var(--gold-primary); cursor: pointer; font-size: 0.8rem; padding: 0.22rem 0.55rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Edit Name</span>
                </button>
                <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${currentTier.name}</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem;">${email} • Circle of Legends Collector</p>
            </div>
          </div>
          <div style="display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center;">
            ${store.isAdmin() ? `
              <button class="sovereign-admin-link" onclick="app.navigateTo('admin')">
                👑 Sovereign Admin Desk
              </button>
            ` : ''}
            <button class="btn btn-gold" onclick="app.openReferralModal()">
              Invite & Earn (₹500 / 250M)
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('circle-of-legends')">
              Circle of Legends Rewards
            </button>
            <button class="btn btn-glass" style="border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5; display: inline-flex; align-items: center; gap: 0.4rem;" onclick="app.logoutUser()">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- Account Balance & Privileges Quick Glance -->
        <div class="loyalty-stats-grid" style="margin-bottom: 2.5rem;">
          <div class="loyalty-stat-box liquid-glass-card">
            <div class="loyalty-stat-label">Available Mythos</div>
            <div class="loyalty-stat-val gold-shimmer-text">${(store.loyalty ? store.loyalty.spendable_mythos : 0).toLocaleString()} M</div>
            <div class="loyalty-stat-hint">₹${(store.loyalty ? store.loyalty.spendable_mythos : 0).toLocaleString()} Concession Value</div>
          </div>
          <div class="loyalty-stat-box liquid-glass-card">
            <div class="loyalty-stat-label">Status Standing</div>
            <div class="loyalty-stat-val" style="font-size: 1.25rem;">Level ${currentTier.level}</div>
            <div class="loyalty-stat-hint">${currentTier.name}</div>
          </div>
          <div class="loyalty-stat-box liquid-glass-card">
            <div class="loyalty-stat-label">Flacons Owned</div>
            <div class="loyalty-stat-val">${store.loyalty ? store.loyalty.full_bottles_purchased : 0}</div>
            <div class="loyalty-stat-hint">50ml / 100ml Extraits</div>
          </div>
          <div class="loyalty-stat-box liquid-glass-card">
            <div class="loyalty-stat-label">Acquisition Cashback</div>
            <div class="loyalty-stat-val" style="font-size: 1.25rem;">${currentTier.multiplier || 1}x Back</div>
            <div class="loyalty-stat-hint">${currentTier.cashbackPct || ((currentTier.multiplier || 1) * 3)}% Extrait Return</div>
          </div>
        </div>

        <!-- Patron Referral Sanctum Panel -->
        ${this.renderReferralPanel(false)}

        <!-- Account Settings & Saved Dispatch Coordinates Form -->
        <div class="liquid-glass-card" style="padding: 2rem; margin-bottom: 2.5rem;">
          <h3 class="font-title" style="margin-bottom: 0.5rem; color: var(--gold-light);">Client Coordinates & Dispatch Information</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Default shipping address and contact coordinates used for 1-tap express checkout.
          </p>

          <form onsubmit="app.updateUserProfile(event)">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.4rem;">Full Name</label>
                <input type="text" id="profile-edit-name" class="engraving-input" value="${displayName}" required />
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.4rem;">Mobile / WhatsApp</label>
                <input type="tel" id="profile-edit-phone" class="engraving-input" value="${u.phone || ''}" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.4rem;">Delivery Address (Flat / House / Street / Landmark)</label>
              <input type="text" id="profile-edit-address" class="engraving-input" value="${u.address || ''}" placeholder="e.g. Villa 42, The Sovereign Palms, DLF Phase 5" />
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.8rem; margin-bottom: 1.5rem;">
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">City</label>
                <input type="text" id="profile-edit-city" class="engraving-input" value="${u.city || ''}" placeholder="e.g. Gurgaon" />
              </div>
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">State</label>
                <input type="text" id="profile-edit-state" class="engraving-input" value="${u.state || ''}" placeholder="e.g. Haryana" />
              </div>
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">PIN Code</label>
                <input type="text" id="profile-edit-pincode" class="engraving-input" value="${u.pincode || ''}" placeholder="e.g. 122002" />
              </div>
            </div>

            <button type="submit" class="btn btn-gold" style="font-size: 0.82rem; padding: 0.6rem 1.4rem;">
              Save Profile Coordinates
            </button>
          </form>
        </div>

        <!-- Recent Vault Orders -->
        <div class="liquid-glass-card profile-orders-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.8rem;">
            <div>
              <h3 class="font-title" style="margin: 0; color: var(--gold-light);">Vault Consignment History</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.2rem 0 0;">Recent orders linked to your collector profile.</p>
            </div>
            <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.4rem 0.9rem;" onclick="app.navigateTo('track-order')">
              Track Consignment
            </button>
          </div>

          ${u.orders && u.orders.length > 0 ? `
            <div class="profile-orders-table-wrap">
              <table class="profile-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Extrait Item</th>
                    <th>Total</th>
                    <th>Dispatch Status</th>
                    <th>AWB / Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  ${u.orders.map(o => `
                    <tr>
                      <td style="font-family: var(--font-serif-title); color: var(--gold-light); font-weight: 600;">${o.orderId || o.id}</td>
                      <td>${o.date || new Date().toLocaleDateString()}</td>
                      <td>${this.formatOrderItemsSummary(o.items)}</td>
                      <td class="gold-text" style="font-weight: 700;">${store.formatPrice(o.total)}</td>
                      <td><span class="glass-pill" style="font-size: 0.7rem; color: #10B981;">${o.status || 'Processing'}</span></td>
                      <td>
                        ${o.tracking ? `
                          <button class="btn btn-glass btn-compact" style="font-size: 0.7rem;" onclick="app.navigateTo('track-order'); document.getElementById('track-order-input').value = '${o.id}'; app.searchTrackOrder();">
                            ${o.tracking}
                          </button>
                        ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Armored Prep</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="text-align: center; padding: 3rem 1rem;">
              <svg width="40" height="40" fill="none" stroke="rgba(212, 175, 55, 0.4)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 0.8rem;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h4 style="color: var(--gold-light); font-size: 1rem; margin-bottom: 0.3rem;">No Previous Consignments</h4>
              <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0 auto 1.2rem; max-width: 380px;">Your acquisition records and dispatch telemetry will appear here once your first flacon is ordered.</p>
              <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.5rem 1.2rem;" onclick="app.navigateTo('collections')">
                Explore Vault Extraits
              </button>
            </div>
          `}
        </div>

        <!-- Session Status & Sign Out -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; margin-top: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--gold-light);">Active Collector Session</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Authenticated as <strong style="color: var(--text-main);">${email}</strong></div>
          </div>
          <button type="button" class="btn btn-glass" style="border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.1rem; font-size: 0.8rem;" onclick="app.logoutUser()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            <span>Log Out of Session</span>
          </button>
        </div>

        <!-- Collapsible Policies & Support Row for Android App & Compliance -->
        ${this.renderPoliciesAccordion()}
      </div>
    `;
  },

  /* Render Fast, Elegant VIP Profile Modal (Popup) */
  renderProfileModal(activeTab = null) {
    if (!store.isUserLoggedIn()) {
      return this.renderAuthModal('signin');
    }

    const tab = activeTab || (typeof app !== 'undefined' && app.activeDossierTab) || 'overview';
    const u = store.user;
    const fbUser = store.firebaseUser;
    const displayName = u.name || (fbUser && fbUser.displayName) || 'Mytholis Collector';
    const email = u.email || (fbUser && fbUser.email) || '';
    const phone = u.phone || (fbUser && fbUser.phone) || '';
    const photoURL = u.photoURL || (fbUser && fbUser.photoURL) || null;
    const initial = displayName.charAt(0).toUpperCase() || 'M';
    const currentTier = store.getCurrentTier();
    const currencies = [
      { code: 'INR', sym: '₹' },
      { code: 'USD', sym: '$' },
      { code: 'GBP', sym: '£' },
      { code: 'AED', sym: 'AED' },
      { code: 'CNY', sym: '¥' },
      { code: 'RUB', sym: '₽' }
    ];

    // Ensure points are properly reflected and self-heal 0-points initiate state
    let spendablePts = Number(store.loyalty?.spendable_mythos) || 0;
    let legacyPts = Number(store.loyalty?.legacy_mythos) || 0;
    if (store.isUserLoggedIn() && spendablePts === 0 && legacyPts === 0) {
      const bonusPts = Number(store.globalSettings?.signupBonusMythos) || 200;
      spendablePts = bonusPts;
      legacyPts = bonusPts;
      if (!store.loyalty) store.loyalty = {};
      store.loyalty.spendable_mythos = bonusPts;
      store.loyalty.legacy_mythos = bonusPts;
      store.loyalty.signup_bonus_awarded = true;
      store.saveLocalStorage('mytholis_loyalty', store.loyalty);
      if (store.user) {
        store.user.points = bonusPts;
        store.saveLocalStorage('mytholis_user', store.user);
      }
    }

    // Determine auth mode
    const isPhoneUser = email.endsWith('@phone.mytholis.com') || (fbUser && fbUser.phone && !fbUser.email);
    const isGoogleUser = (photoURL && photoURL.includes('googleusercontent.com'));

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-primary); font-family: var(--font-serif-title); font-size: 1rem; color: var(--gold-light); overflow: hidden;">
            ${photoURL ? `<img src="${photoURL}" alt="${displayName}" class="profile-avatar-img" />` : initial}
          </div>
          <div>
            <h3 class="modal-title font-title">Collector Dossier</h3>
            <p class="modal-subtitle">House Mytholis • ${currentTier.name}</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeProfileModal()" title="Close Profile">✕</button>
      </div>

      <div class="modal-scroll-body">
        <!-- Client Member Card with Portrait Upload -->
        <div class="profile-modal-user-card liquid-glass-card" style="padding: 1.2rem; margin-bottom: 1rem;">
          <div class="profile-avatar-wrap">
            ${photoURL ? `
              <img src="${photoURL}" alt="${displayName}" class="profile-avatar-img" />
            ` : `
              <span>${initial}</span>
            `}
            <label for="patron-avatar-upload" class="avatar-camera-btn" title="Upload Collector Portrait / Photo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <input type="file" id="patron-avatar-upload" accept="image/*" style="display:none;" onchange="app.handleProfilePhotoUpload(event)" />
            </label>
          </div>
          <div class="profile-modal-user-info">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <h4 class="profile-user-name">${displayName}</h4>
                <button type="button" class="btn-edit-inline-name" onclick="app.promptEditPatronName()" title="Edit Collector Name / Title" style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.35); color: var(--gold-primary); cursor: pointer; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.25rem; transition: all 0.2s;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>Edit</span>
                </button>
                <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">${currentTier.name}</span>
              </div>
              ${photoURL ? `
                <button type="button" onclick="app.handleRemoveProfilePhoto()" style="background:none; border:none; color: #EF4444; font-size: 0.68rem; cursor:pointer; text-decoration: underline; padding: 0;">
                  Remove photo
                </button>
              ` : `
                <label for="patron-avatar-upload" style="color: var(--gold-primary); font-size: 0.68rem; cursor:pointer; text-decoration: underline;">
                  + Add portrait
                </label>
              `}
            </div>
            <p class="profile-user-email">${isPhoneUser ? `Mobile Collector (${phone || email.replace('@phone.mytholis.com','')})` : email}</p>
            <div class="profile-points-pill">
              <strong>${spendablePts.toLocaleString()}</strong> Spendable Mythos &nbsp;|&nbsp; <strong>${legacyPts.toLocaleString()}</strong> Legacy M
            </div>
          </div>
        </div>

        <!-- Dossier Navigation Tabs -->
        <div class="dossier-nav-tabs">
          <button type="button" class="dossier-tab-btn ${tab === 'overview' ? 'active' : ''}" onclick="app.setDossierTab('overview')">
            Overview & Status
          </button>
          <button type="button" class="dossier-tab-btn ${tab === 'referral' ? 'active' : ''}" onclick="app.setDossierTab('referral')">
            Refer & Earn
          </button>
          <button type="button" class="dossier-tab-btn ${tab === 'edit' ? 'active' : ''}" onclick="app.setDossierTab('edit')">
            Edit Coordinates
          </button>
          <button type="button" class="dossier-tab-btn ${tab === 'security' ? 'active' : ''}" onclick="app.setDossierTab('security')">
            Security & Password
          </button>
        </div>

        ${tab === 'overview' ? `
          <!-- TAB 1: OVERVIEW & STATUS -->
          ${store.isAdmin() ? `
            <div style="margin-bottom: 1.2rem;">
              <button class="btn btn-gold" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.75rem 1rem; font-size: 0.85rem;" onclick="app.closeProfileModal(); app.navigateTo('admin');">
                <span>👑</span> Sovereign Admin Command Desk
              </button>
            </div>
          ` : ''}

          <!-- Cloud Sync Status Pill -->
          <div class="modal-section-box liquid-glass-card" style="padding: 0.9rem 1.1rem; margin-bottom: 1.2rem; border: 1px solid rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.06); display: flex; justify-content: space-between; align-items: center; gap: 0.6rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <svg width="16" height="16" fill="none" stroke="#10B981" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <span class="glass-pill" style="font-size: 0.6rem; color: #10B981; border-color: #10B981; padding: 0.1rem 0.4rem;">Connected Collector</span>
                <p style="font-size: 0.78rem; color: var(--gold-light); margin: 0.15rem 0 0;">${email}</p>
              </div>
            </div>
          </div>

          <!-- Direct Action Hub to Dedicated Loyalty Page -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.1rem; margin-bottom: 1.2rem; border: 1px solid var(--gold-primary); background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(4, 24, 18, 0.6) 100%);">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <div>
                <span class="glass-pill" style="font-size: 0.62rem; color: var(--gold-light);">The Circle of Legends</span>
                <h5 style="color: var(--gold-light); margin: 0.3rem 0 0.15rem; font-size: 0.95rem;">Pantheon Codex & Vault Rewards</h5>
                <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">Access full bottle unlocks, concession codes & tier privileges.</p>
              </div>
              <button class="btn btn-gold" style="font-size: 0.75rem; padding: 0.45rem 0.9rem;" onclick="app.closeProfileModal(); app.navigateTo('circle-of-legends');">
                Open Loyalty
              </button>
            </div>
          </div>

          <!-- Saved Dispatch Coordinates Overview -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.1rem; margin-bottom: 1.2rem;">
            <div class="modal-section-header" style="margin-bottom: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
              <h4 class="modal-section-title" style="font-size: 0.85rem;">Saved Dispatch Coordinates</h4>
              <button type="button" class="glass-pill" style="font-size: 0.65rem; cursor: pointer; color: var(--gold-light);" onclick="app.setDossierTab('edit')">
                ✎ Edit Coordinates
              </button>
            </div>
            ${(u.address || u.city || u.pincode) ? `
              <div style="font-size: 0.82rem; color: var(--text-main); line-height: 1.5; background: rgba(0, 0, 0, 0.25); padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.15);">
                <div style="font-weight: 600; color: var(--gold-light); margin-bottom: 0.2rem;">${u.name || displayName}</div>
                <div>${u.address || ''}</div>
                <div>${[u.city, u.state, u.pincode].filter(Boolean).join(', ')}</div>
                ${u.phone ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.3rem;">Tel: ${u.phone}</div>` : ''}
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(212, 175, 55, 0.05); border: 1px dashed rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 0.75rem 0.9rem;">
                <span style="font-size: 0.78rem; color: var(--text-muted);">No delivery address saved yet.</span>
                <button type="button" class="btn btn-gold" style="font-size: 0.72rem; padding: 0.35rem 0.75rem;" onclick="app.setDossierTab('edit')">
                  + Add Address
                </button>
              </div>
            `}
          </div>

          <!-- Store Currency Selector -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.1rem; margin-bottom: 1.2rem;">
            <div class="modal-section-header" style="margin-bottom: 0.7rem;">
              <h4 class="modal-section-title" style="font-size: 0.85rem;">Store Currency</h4>
              <span class="modal-section-hint">Auto-converts all prices</span>
            </div>
            <div class="currency-modal-grid">
              ${currencies.map(c => `
                <button class="currency-modal-pill ${store.currency === c.code ? 'active' : ''}" 
                        onclick="app.setCurrency('${c.code}')">
                  <span class="curr-code" style="font-weight: 600;">${c.code}</span>
                  <span class="curr-sym">(${c.sym})</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Recent Order Summary -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.1rem;">
            <div class="modal-section-header" style="margin-bottom: 0.7rem;">
              <h4 class="modal-section-title" style="font-size: 0.85rem;">Recent Vault Consignment</h4>
              <button class="glass-pill" style="font-size: 0.65rem; cursor: pointer;" onclick="app.closeProfileModal(); app.navigateTo('track-order');">
                Track Consignment
              </button>
            </div>
            ${u.orders && u.orders.length > 0 ? `
              <div class="modal-order-row">
                <div>
                  <div style="font-family: var(--font-serif-title); color: var(--gold-light); font-size: 0.85rem;">
                    ${u.orders[0].orderId || u.orders[0].id} <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-sans);">• ${u.orders[0].date || new Date().toLocaleDateString()}</span>
                  </div>
                  <p style="font-size: 0.78rem; color: var(--text-main); margin-top: 0.15rem;">${this.formatOrderItemsSummary(u.orders[0].items)}</p>
                </div>
                <div style="text-align: right;">
                  <span class="gold-text" style="font-weight: 700; font-size: 0.85rem;">${store.formatPrice(u.orders[0].total)}</span>
                  <span class="glass-pill" style="font-size: 0.62rem; display: inline-block; margin-top: 0.2rem; padding: 0.15rem 0.5rem;">${u.orders[0].status || 'Processing'}</span>
                </div>
              </div>
            ` : `
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">No previous consignments on file.</p>
            `}
          </div>
        ` : ''}

        ${tab === 'referral' ? `
          <!-- TAB 2: REFERRAL SANCTUM & SHARE -->
          ${this.renderReferralPanel(true)}
        ` : ''}

        ${tab === 'edit' ? `
          <!-- TAB 2: EDIT PROFILE COORDINATES -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.2rem;">
            <div style="margin-bottom: 1rem;">
              <h4 class="modal-section-title" style="font-size: 0.95rem; margin-bottom: 0.2rem;">Client Coordinates & Dispatch Information</h4>
              <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                Used for express luxury checkout, concierge delivery, and courier waybill manifest generation.
              </p>
            </div>

            <form onsubmit="app.handleSaveDossierProfile(event)" style="display: flex; flex-direction: column; gap: 0.9rem;">
              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                  Full Name / Title
                </label>
                <input type="text" id="dossier-name-input" class="engraving-input" value="${displayName}" placeholder="e.g. Your Full Name" required />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    Mobile Phone / WhatsApp
                  </label>
                  <input type="tel" id="dossier-phone-input" class="engraving-input" value="${phone}" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    Pincode / Postal Code
                  </label>
                  <input type="text" id="dossier-pincode-input" class="engraving-input" value="${u.pincode || ''}" placeholder="122002" />
                </div>
              </div>

              <div>
                <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                  Delivery Address (Apartment, Villa, Street)
                </label>
                <input type="text" id="dossier-address-input" class="engraving-input" value="${u.address || ''}" placeholder="Villa 42, The Sovereign Palms, DLF Phase 5" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    City
                  </label>
                  <input type="text" id="dossier-city-input" class="engraving-input" value="${u.city || ''}" placeholder="Gurgaon / Mumbai" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    State / Region
                  </label>
                  <input type="text" id="dossier-state-input" class="engraving-input" value="${u.state || ''}" placeholder="Haryana" />
                </div>
              </div>

              <div style="display: flex; gap: 0.6rem; margin-top: 0.6rem;">
                <button type="submit" id="btn-save-dossier" class="btn btn-gold" style="flex: 1.5; padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 700;">
                  Save Collector Coordinates
                </button>
                <button type="button" class="btn btn-glass" style="flex: 1; padding: 0.75rem 1rem; font-size: 0.8rem;" onclick="app.setDossierTab('overview')">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        ${tab === 'security' ? `
          <!-- TAB 3: SECURITY & CREDENTIALS -->
          <div class="modal-section-box liquid-glass-card" style="padding: 1.2rem;">
            
            <!-- Active Credential Status Card -->
            <div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 0.9rem 1rem; margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <div>
                <span class="glass-pill" style="font-size: 0.62rem; color: var(--gold-light);">AUTHENTICATION PROTOCOL</span>
                <h5 style="color: var(--gold-light); margin: 0.25rem 0 0.15rem; font-size: 0.9rem;">
                  ${isPhoneUser ? '📱 Mobile Phone SMS Verification' : (isGoogleUser ? '🌐 Google VIP Single Sign-On' : '🔑 Email & Master Password')}
                </h5>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
                  ${isPhoneUser ? `Phone: ${phone || email.replace('@phone.mytholis.com', '')}` : `Email: ${email}`}
                </p>
              </div>
              <span class="glass-pill" style="font-size: 0.65rem; color: #10B981; border-color: #10B981;">Active</span>
            </div>

            <!-- Password Change Form for Email Accounts -->
            ${!isPhoneUser && !isGoogleUser ? `
              <div style="margin-bottom: 1rem;">
                <h4 class="modal-section-title" style="font-size: 0.92rem; margin-bottom: 0.2rem;">Change Master Password</h4>
                <p style="font-size: 0.76rem; color: var(--text-muted); margin: 0;">
                  Update your authentication credentials for House Mytholis.
                </p>
              </div>

              <form onsubmit="app.handleChangePassword(event)" style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    Current Password
                  </label>
                  <input type="password" id="security-curr-pass" class="engraving-input" placeholder="Enter current password..." />
                </div>

                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    New Master Password (min 6 characters)
                  </label>
                  <input type="password" id="security-new-pass" class="engraving-input" placeholder="Create new strong password..." required minlength="6" />
                </div>

                <div>
                  <label style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.35rem;">
                    Confirm New Password
                  </label>
                  <input type="password" id="security-conf-pass" class="engraving-input" placeholder="Re-enter new password..." required minlength="6" />
                </div>

                <button type="submit" id="btn-change-password" class="btn btn-gold" style="width: 100%; padding: 0.75rem; font-size: 0.85rem; font-weight: 700; margin-top: 0.2rem;">
                  Update Master Password
                </button>
              </form>

              <div style="margin-top: 1.2rem; text-align: center; border-top: 1px solid rgba(212, 175, 55, 0.15); padding-top: 0.9rem;">
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0 0 0.5rem;">
                  Prefer to reset your password via email?
                </p>
                <button type="button" class="btn btn-glass" style="font-size: 0.75rem; padding: 0.4rem 0.9rem; color: var(--gold-primary);" onclick="app.handleSendPasswordResetFromDossier()">
                  Dispatch Reset Link to Email
                </button>
              </div>
            ` : ''}

            <!-- Phone User Link Option -->
            ${isPhoneUser ? `
              <div style="background: rgba(4, 24, 18, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 8px; padding: 1.1rem;">
                <h4 class="modal-section-title" style="font-size: 0.9rem; margin-bottom: 0.3rem;">Link Email & Password</h4>
                <p style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 0.9rem;">
                  Your mobile phone number is verified. You can also link an email and password to access your dossier from your desktop computer or when SMS delivery is slow.
                </p>

                <form onsubmit="app.handleLinkEmailPassword(event)" style="display: flex; flex-direction: column; gap: 0.8rem;">
                  <div>
                    <label style="font-size: 0.72rem; color: var(--gold-primary); display: block; margin-bottom: 0.3rem;">Collector Email Address</label>
                    <input type="email" id="security-link-email" class="engraving-input" placeholder="collector@mytholis.com" required />
                  </div>
                  <div>
                    <label style="font-size: 0.72rem; color: var(--gold-primary); display: block; margin-bottom: 0.3rem;">Create Password (min 6 characters)</label>
                    <input type="password" id="security-link-pass" class="engraving-input" placeholder="••••••••" required minlength="6" />
                  </div>
                  <button type="submit" id="btn-link-email-pass" class="btn btn-gold" style="width: 100%; padding: 0.7rem; font-size: 0.82rem; font-weight: 700; margin-top: 0.2rem;">
                    Link Email & Password to Account
                  </button>
                </form>
              </div>
            ` : ''}

            <!-- Google User Note -->
            ${isGoogleUser ? `
              <div style="background: rgba(66, 133, 244, 0.08); border: 1px solid rgba(66, 133, 244, 0.3); border-radius: 8px; padding: 1.1rem; text-align: center;">
                <p style="font-size: 0.82rem; color: var(--gold-light); margin: 0 0 0.4rem; font-weight: 600;">
                  Google VIP Authenticated
                </p>
                <p style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 0.9rem;">
                  Your login is managed securely by your Google Account. If you would like to set up a direct password for House Mytholis, click below.
                </p>
                <button type="button" class="btn btn-glass" style="font-size: 0.75rem; padding: 0.45rem 1rem; color: var(--gold-primary);" onclick="app.handleSendPasswordResetFromDossier()">
                  Send Password Setup Link to ${email}
                </button>
              </div>
            ` : ''}

          </div>
        ` : ''}

        ${this.renderPoliciesAccordion()}
      </div>

      <div class="modal-footer" style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-glass" style="flex: 1; min-width: 90px; font-size: 0.78rem; padding: 0.6rem 0.8rem;" onclick="app.logoutUser()" title="Sign Out of Account">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Sign Out</span>
        </button>
        <button type="button" class="btn btn-glass" style="flex: 1; min-width: 75px; font-size: 0.78rem; padding: 0.6rem 0.8rem;" onclick="app.closeProfileModal()">
          Close
        </button>
        <button type="button" class="btn btn-gold" style="flex: 1.2; min-width: 125px; font-size: 0.78rem; padding: 0.6rem 0.8rem;" onclick="app.closeProfileModal(); app.navigateTo('circle-of-legends');">
          Circle of Legends
        </button>
      </div>
    `;
  },

  /* Render Legal & Compliance Policy Modals */
  renderPolicyModal(policyType) {
    let title = "Legal Policy";
    let content = "";

    if (policyType === 'terms') {
      title = "Terms of Service";
      content = `
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">1. Entity & Jurisdiction</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          This website is operated by <strong>Mytholis Luxury Fragrances Pvt. Ltd.</strong>, a private limited entity incorporated under the laws of India, having its registered office at Vasant Vihar 2, Nava Naroda, Ahmedabad, Gujarat 382330, India (GSTIN: 24AAECM4821P1ZT). Formulations are originated in the United Kingdom and manufactured in India.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">2. Pricing & Payments</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          All prices displayed are Maximum Retail Prices (MRP) inclusive of Goods and Services Tax (GST) and all applicable taxes in India. Payments are processed securely through RBI-compliant 256-bit SSL encrypted PCI-DSS Level 1 compliant gateway partners, UPI, credit/debit cards, and NetBanking.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">3. Intellectual Property</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          All trademarks, bottle designs, visual renders, formulation naming, and Liquid Glass UI components are protected intellectual property of Mytholis Luxury Fragrances Pvt. Ltd. and Mytholis Parfums UK.
        </p>
      `;
    } else if (policyType === 'privacy') {
      title = "Privacy Policy";
      content = `
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">1. Information Collected</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          We collect your name, shipping address, contact phone/WhatsApp number, and email address solely to process your orders, provide dispatch tracking telemetry, and fulfill bespoke laser bottle engravings.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">2. Payment Security</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          We do not store complete credit card or debit card numbers on our servers. All financial transactions are securely handled by 256-bit SSL encrypted PCI-DSS Level 1 compliant gateway partners and UPI.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">3. Data Protection & Grievance</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          In accordance with the Information Technology Act 2000 and Digital Personal Data Protection Act, our Grievance Officer can be reached at <strong>privacy@mytholis.com</strong>.
        </p>
      `;
    } else if (policyType === 'shipping') {
      title = "Shipping & Armored Delivery";
      content = `
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">1. Pan-India Express Delivery</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          We provide 100% complimentary express armored shipping across all serviceable postal codes in India via BlueDart, Delhivery Express, and FedEx. All shipments are packed in tamper-evident velvet vault cases.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">2. Dispatch & Transit Timelines</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          Orders placed before 2:00 PM IST are dispatched the same day from our Ahmedabad Fragrance Vault. Metro destinations are delivered in 2–3 business days; rest of India in 3–5 business days.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">3. Transit Insurance</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          Every Mytholis shipment is fully insured during transit against theft, loss, or bottle breakage.
        </p>
      `;
    } else if (policyType === 'refund') {
      title = "Refund, Replacement & Cancellation";
      content = `
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">1. Hygienic Sealed Protection</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          Due to the nature of personal luxury fragrances and strict health regulations, products once unsealed or used cannot be returned for a cash refund.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">2. 100% Transit Damage Replacement Guarantee</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem;">
          If your crystal flacon arrives damaged, leaking, or with broken seals, please send photos/unboxing video to <strong>concierge@mytholis.com</strong> or WhatsApp <strong>+91 777000 9170</strong> within 48 hours of delivery for an immediate free replacement.
        </p>
        <h4 style="color: var(--gold-light); margin-bottom: 0.8rem;">3. Order Cancellations</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6;">
          Orders may be cancelled free of charge prior to laser engraving and dispatch by contacting our concierge.
        </p>
      `;
    }

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title font-title">${title}</h3>
            <p class="modal-subtitle">Mytholis Luxury Fragrances Pvt. Ltd. (Ahmedabad, India)</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closePolicyModal()" title="Close Policy">✕</button>
      </div>

      <div class="modal-scroll-body" style="padding: 1.5rem;">
        <div class="liquid-glass-card" style="padding: 1.8rem;">
          ${content}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-gold" style="width: 100%; font-size: 0.8rem; padding: 0.6rem 1rem;" onclick="app.closePolicyModal()">
          I Understand & Agree
        </button>
      </div>
    `;
  },

  /* Render Razorpay / Hosted Gateway Instant Checkout Modal */
  renderRazorpayModal(productOrCart = {}) {
    const isSingleProduct = !!(productOrCart && productOrCart.id);
    let chosenSize = app.selectedSize || 50;
    let singlePrice = app.selectedPrice;
    if (isSingleProduct && productOrCart.sizes) {
      const sObj = productOrCart.sizes.find(s => s.ml === chosenSize) || productOrCart.sizes[0];
      chosenSize = sObj.ml;
      singlePrice = sObj.price;
    }
    const baseSubtotal = isSingleProduct ? (singlePrice || productOrCart.price) : store.getCartTotal();
    const appliedReward = isSingleProduct ? null : store.getAppliedReward();
    const appliedGift = isSingleProduct ? null : store.getAppliedGift();
    const discount = isSingleProduct ? 0 : store.getDiscountAmount(baseSubtotal);
    const finalAmount = Math.max(0, baseSubtotal - discount);
    const cleanName = isSingleProduct ? (productOrCart.name || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const title = isSingleProduct ? `${cleanName} (${chosenSize}ml)` : `Vault Cart (${store.getCartCount()} items)`;

    const razorpayKey = (store.globalSettings && store.globalSettings.razorpayKeyId && store.globalSettings.razorpayKeyId.trim()) ||
                        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAZORPAY_KEY_ID) || '';

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="color: var(--gold-light);">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div>
            <h3 class="modal-title font-title">Encrypted Payment Desk</h3>
            <p class="modal-subtitle">256-Bit SSL Encrypted Instant Payment (Razorpay & COD)</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeRazorpayModal()" title="Close Checkout">✕</button>
      </div>

      <div class="modal-scroll-body" style="padding: 1.2rem;">
        <!-- Order Summary Pill -->
        <div class="liquid-glass-card" style="padding: 1.2rem; margin-bottom: 1.2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h5 style="font-size: 0.95rem; color: var(--gold-light); margin-bottom: 0.2rem;">${title}</h5>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Inclusive of 18% GST & Free Express Delivery</span>
            </div>
            <div style="text-align: right;">
              <span class="gold-text" style="font-size: 1.4rem; font-weight: 700;">${store.formatPrice(finalAmount)}</span>
            </div>
          </div>

          ${discount > 0 || appliedGift ? `
            <div style="margin-top: 0.8rem; padding-top: 0.6rem; border-top: 1px solid rgba(212, 175, 55, 0.2); font-size: 0.75rem;">
              ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: var(--gold-light);">
                  <span>Mythos Concession (${appliedReward ? appliedReward.code : ''}):</span>
                  <span>-${store.formatPrice(discount)}</span>
                </div>
              ` : ''}
              ${appliedGift ? `
                <div style="display: flex; justify-content: space-between; color: var(--gold-light); margin-top: 0.2rem;">
                  <span>Complimentary Gift Flacon:</span>
                  <span>${appliedGift.name} (Free)</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Payment Method Tabs -->
        <div class="liquid-glass-card" style="padding: 1.2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
            <h5 style="font-size: 0.85rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">
              Select Payment Mode
            </h5>
            <span class="glass-pill" style="font-size: 0.65rem; color: #10B981; border-color: #10B981;">
              Save ₹200 via Prepaid UPI
            </span>
          </div>

          <!-- UPI Apps Grid (1-Tap Fast Checkout) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 0.8rem;">
            <div class="razorpay-method-pill active" onclick="app.selectPaymentMethod(this, 'upi_gpay')">
              <span style="font-weight: 600;">Google Pay</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'upi_phonepe')">
              <span style="font-weight: 600;">PhonePe</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'upi_paytm')">
              <span style="font-weight: 600;">Paytm / UPI</span>
            </div>
          </div>

          <!-- Cards & COD Options -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; margin-bottom: 1rem;">
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'cards')">
              <span>Credit / Debit Card</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'cod')">
              <span>Cash on Delivery</span>
            </div>
          </div>

          <!-- COD Notice / Guardrail (Only allowed for Sixth Sense or requires OTP confirmation) -->
          <div id="cod-guardrail-notice" class="cod-guardrail-box" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; background: rgba(245, 158, 11, 0.12); border: 1px solid #F59E0B; font-size: 0.75rem; color: #FCD34D; margin-bottom: 1rem;">
            <strong>COD Policy:</strong> Cash on Delivery is available for Sixth Sense (₹3,999). For full flacons (50ml/100ml), an automated WhatsApp dispatch confirmation OTP is required, or switch to UPI to save ₹200 instantly.
          </div>

          <!-- Gateway Status Notice -->
          ${(() => {
            if (razorpayKey) {
              return `
                <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.8rem; background: rgba(4, 24, 18, 0.6); border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(212, 175, 55, 0.15);">
                  <svg width="14" height="14" fill="none" stroke="var(--gold-primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style="font-size: 0.72rem; color: var(--gold-light);">Razorpay 256-Bit SSL Encrypted Vault Active. Cards, UPI (GPay, PhonePe, Paytm), NetBanking supported.</span>
                </div>
              `;
            } else {
              return `
                <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.8rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(245, 158, 11, 0.3);">
                  <span style="font-size: 0.85rem;">⚠️</span>
                  <span style="font-size: 0.72rem; color: #FCD34D;">Razorpay Gateway setup pending. Cash on Delivery (COD) is available.</span>
                </div>
              `;
            }
          })()}

          <!-- Shipping Details Form (Smart Checkout Autofill) -->
          <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            <div style="display: flex; gap: 0.6rem;">
              <input type="text" id="checkout-name" class="engraving-input" placeholder="Full Delivery Name" autocomplete="name" value="${store.user.name || ''}" style="flex: 1.2;" required />
              <input type="email" id="checkout-email" class="engraving-input" placeholder="Email Address" autocomplete="email" value="${store.user.email || ''}" style="flex: 1;" required />
            </div>

            <div style="display: flex; gap: 0.6rem; align-items: flex-start;">
              <div style="flex: 1.2;">
                <input type="tel" id="checkout-phone" class="engraving-input" placeholder="10-Digit Mobile (+91)" autocomplete="tel-national" value="${store.user.phone || ''}" oninput="app.handleCheckoutPhoneInput(this)" maxlength="14" style="width: 100%;" required />
              </div>
              <div style="flex: 1; position: relative;">
                <input type="text" id="checkout-pincode" class="engraving-input" placeholder="PIN Code (6 Digits)" autocomplete="postal-code" maxlength="6" value="${store.user.pincode || ''}" oninput="app.handlePincodeLookup(this.value)" style="width: 100%;" required />
                <div id="pincode-status-hint" style="font-size: 0.65rem; color: var(--gold-light); display: none; margin-top: 3px; position: absolute; bottom: -16px; left: 2px; white-space: nowrap;"></div>
              </div>
            </div>

            <input type="text" id="checkout-address" class="engraving-input" placeholder="Flat / Building, Street, Area, Landmark" autocomplete="street-address" value="${store.user.address || ''}" required />

            <div style="display: flex; gap: 0.6rem;">
              <input type="text" id="checkout-city" class="engraving-input" placeholder="City / District" autocomplete="address-level2" value="${store.user.city || ''}" style="flex: 1;" required />
              <input type="text" id="checkout-state" class="engraving-input" placeholder="State" autocomplete="address-level1" value="${store.user.state || ''}" style="flex: 1;" required />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; gap: 0.8rem;">
        <button id="btn-proceed-checkout" class="btn btn-gold" style="flex: 1;" onclick="app.launchRazorpayCheckout(${finalAmount})">
          Proceed to Payment Desk • ${store.formatPrice(finalAmount)}
        </button>
      </div>
    `;
  },

  /* Backward Compatibility Alias for PayU invocation */
  renderPayUModal(productOrCart) {
    return this.renderRazorpayModal(productOrCart);
  },

  /* ==========================================================================
     SANCTUM COMMAND - LIVE BACKEND INTEGRATION DIAGNOSTICS BAR
     ========================================================================== */
  renderBackendDiagnosticsBar() {
    const diag = (typeof app !== 'undefined' && app.backendDiagnostics) ? app.backendDiagnostics : {
      running: false,
      clientConfig: { status: 'untested', label: 'Vite Config (Ready to Verify)' },
      authState: { status: 'untested', label: 'Auth State (Ready to Verify)' },
      firestoreClient: { status: 'untested', label: 'Firestore Lite (Ready to Verify)' },
      serverlessApi: { status: 'untested', label: 'Serverless /api/health (Ready to Verify)' }
    };

    return `
      <div class="admin-diagnostics-card liquid-glass-card" id="admin-diagnostics-box">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-primary);">LIVE HEALTH MATRIX</span>
            <h3 style="font-size: 1.05rem; color: var(--gold-light); margin: 0;">Backend Integration Status</h3>
          </div>
          <button class="btn btn-gold" id="btn-run-diagnostics" style="font-size: 0.72rem; padding: 0.45rem 1rem;" onclick="app.testBackend()">
            ${diag.running ? 'Testing All 4 Pillars...' : 'Run Backend Diagnostics'}
          </button>
        </div>

        <div class="admin-diag-grid">
          <div class="admin-diag-pillar">
            <div class="admin-diag-title">1. Client Firebase Config</div>
            <div class="admin-diag-badge status-${diag.clientConfig.status}">
              ${diag.clientConfig.label}
            </div>
          </div>
          <div class="admin-diag-pillar">
            <div class="admin-diag-title">2. Firebase Auth State</div>
            <div class="admin-diag-badge status-${diag.authState.status}">
              ${diag.authState.label}
            </div>
          </div>
          <div class="admin-diag-pillar">
            <div class="admin-diag-title">3. Client Firestore Lite</div>
            <div class="admin-diag-badge status-${diag.firestoreClient.status}">
              ${diag.firestoreClient.label}
            </div>
          </div>
          <div class="admin-diag-pillar">
            <div class="admin-diag-title">4. Serverless API (/api/health)</div>
            <div class="admin-diag-badge status-${diag.serverlessApi.status}">
              ${diag.serverlessApi.label}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     SANCTUM COMMAND - HIGH-SECURITY FOUNDER ADMIN CONSOLE (#admin)
     ========================================================================== */
  renderAdmin() {
    if (typeof AdminComponents !== 'undefined' && AdminComponents.renderAdmin) {
      return AdminComponents.renderAdmin();
    }
    const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
    const currentUser = (typeof firebaseService !== 'undefined' && firebaseService.currentUser) || (typeof store !== 'undefined' && store.firebaseUser);
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    
    // Check if authenticated user matches configured admin email
    const isAuthorized = Boolean(configuredAdminEmail && userEmail && (userEmail === configuredAdminEmail));

    // 1. Unauthenticated or Unauthorized Gate
    if (!isAuthorized) {
      return `
        <div class="container" style="min-height: 80vh; max-width: 900px; margin: 0 auto; padding-top: 3rem;">
          ${this.renderBackendDiagnosticsBar()}

          <div class="admin-auth-card liquid-glass-card" style="margin: 2rem auto;">
            <span class="glass-pill" style="color: var(--gold-primary); letter-spacing: 0.25em; margin-bottom: 1.2rem; font-size: 0.7rem;">
              RESTRICTED FOUNDER GATEWAY
            </span>
            <h1 class="gold-shimmer-text font-title" style="font-size: 2.2rem; margin-bottom: 0.5rem;">
              Sanctum Command
            </h1>
            <p class="font-garamond" style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
              Operations desk, dispatch vault, VIP society ledger, and live inventory switchboard. Access restricted strictly to verified Mytholis Founders.
            </p>

            ${currentUser ? `
              <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 1.2rem; margin-bottom: 1.8rem; text-align: left;">
                <div style="color: #FCA5A5; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  Access Denied
                </div>
                <div style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.5;">
                  Authenticated account: <strong style="color: var(--text-main);">${userEmail}</strong> does not match the configured Founder email.<br/>
                  ${configuredAdminEmail ? `<span style="font-size: 0.72rem; color: #F59E0B;">Target Founder Identity: ${configuredAdminEmail}</span>` : `<span style="font-size: 0.72rem; color: #F59E0B;">Note: VITE_ADMIN_EMAIL is not yet configured in your .env file.</span>`}
                </div>
              </div>
              <button class="btn btn-glass" style="width: 100%; border-color: rgba(239, 68, 68, 0.5); color: #FCA5A5;" onclick="app.handleFirebaseSignOut()">
                Sign Out Current Session
              </button>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="btn btn-gold" style="width: 100%; padding: 0.9rem; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 0.8rem;" onclick="app.handleAdminGoogleSignIn()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  Founder Google Authentication
                </button>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
                  Sign in with the Google Account registered under <code style="color: var(--gold-light);">${configuredAdminEmail || 'VITE_ADMIN_EMAIL'}</code>
                </div>
              </div>
            `}
          </div>
        </div>
      `;
    }

    // 2. Authorized Founder Admin Console
    const activeTab = app.adminActiveTab || 'orders';
    const adminData = app.adminData || { orders: [], users: [], inventory: {}, codes: [] };
    const ordersList = adminData.orders || [];
    const usersList = adminData.users || [];
    const inventoryMap = adminData.inventory || {};
    const codesList = adminData.codes || [];

    return `
      <div class="admin-panel-container">
        <!-- Admin Top Navigation Bar -->
        <div class="admin-top-bar liquid-glass-card">
          <div class="admin-brand-block">
            <span class="glass-pill admin-badge">SANCTUM COMMAND</span>
            <h1 class="admin-title gold-shimmer-text font-title">Operations & Vault Desk</h1>
            <div class="admin-subtext">
              Founder Session: <strong style="color: var(--gold-light);">${userEmail}</strong> &bull; Status: <span style="color:#10B981; font-weight:700;">Verified High Sovereign</span>
            </div>
          </div>
          <div class="admin-top-actions">
            <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.6rem 1rem;" onclick="app.refreshAdminDashboard()" title="Reload Cloud Ledger">
              ↻ Refresh Live Ledger
            </button>
            <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.6rem 1rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.handleFirebaseSignOut()">
              Exit Sanctum
            </button>
          </div>
        </div>

        <!-- Backend Health & Diagnostics Bar -->
        ${this.renderBackendDiagnosticsBar()}

        <!-- 4 Clean Navigation Tabs -->
        <div class="admin-tab-nav">
          <button class="admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}" onclick="app.setAdminTab('orders')">
            Orders & Dispatch Desk (${ordersList.length})
          </button>
          <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" onclick="app.setAdminTab('users')">
            Mythos Society VIP Manager (${usersList.length})
          </button>
          <button class="admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}" onclick="app.setAdminTab('inventory')">
            Inventory & Drop Switchboard
          </button>
          <button class="admin-tab-btn ${activeTab === 'codes' ? 'active' : ''}" onclick="app.setAdminTab('codes')">
            Promo & Vault Code Inspector (${codesList.length})
          </button>
        </div>

        <!-- TAB 1: ORDERS & DISPATCH DESK -->
        ${activeTab === 'orders' ? `
          <div class="admin-tab-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h3 style="font-size: 1.3rem; color: var(--gold-light); margin: 0 0 0.2rem;">Armored Dispatch Desk</h3>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Review packing lists, highlight attached free vault gifts, and dispatch consignments with 1-click WhatsApp tracking.</p>
              </div>
            </div>

            ${ordersList.length === 0 ? `
              <div class="liquid-glass-card" style="padding: 3rem; text-align: center; border: 1px solid rgba(212, 175, 55, 0.2);">
                <h4 style="color: var(--gold-light); margin-bottom: 0.5rem;">No Consignments in Firestore Yet</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 500px; margin: 0 auto 1.5rem;">Orders submitted through customer checkout will stream directly here with live customer address, items, and attached gift alerts.</p>
                <button class="btn btn-glass" onclick="app.refreshAdminDashboard()">↻ Check For New Orders</button>
              </div>
            ` : `
              <div class="admin-table-wrapper">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID & Date</th>
                      <th>Collector & Delivery Coordinates</th>
                      <th>Items Purchased</th>
                      <th>Attached Vault Gift</th>
                      <th>Total & Status</th>
                      <th>Dispatch & Armored Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ordersList.map(order => {
                      const orderId = order.orderId || order.id || 'MYTH-UNKNOWN';
                      const patronName = order.name || order.shipping?.name || order.userEmail || 'Mytholis Collector';
                      const patronPhone = order.phone || order.shipping?.phone || '';
                      const patronAddress = order.address || order.shipping?.address || order.city || 'India Express Delivery';
                      const items = Array.isArray(order.items) ? order.items : [];
                      const totalAmount = order.total || order.amount || 0;
                      const currentStatus = order.status || 'Placed';
                      const courier = order.courier || 'BlueDart Express';
                      const awb = order.awb_number || order.tracking || '';

                      // Detect attached Free Vault Gifts (Never miss while packing)
                      const hasCoffretVoucher = items.some(i => i.id === 'mytholis-discovery-set' || (i.name && i.name.toLowerCase().includes('coffret')));
                      const isHighValue = totalAmount >= 6000;
                      let attachedGift = order.freeGift || null;
                      if (!attachedGift && hasCoffretVoucher) {
                        attachedGift = '₹1,000 Discovery Voucher Attached (Include Gold Wax Seal Card)';
                      } else if (!attachedGift && isHighValue) {
                        attachedGift = 'High-Tier Order: Include Complimentary 15ml Discovery Flacon';
                      }

                      return `
                        <tr>
                          <td>
                            <strong style="color: var(--gold-primary); font-family: monospace; font-size: 0.9rem;">${orderId}</strong>
                            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
                              ${order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-IN') : (order.date || 'Recent')}
                            </div>
                          </td>
                          <td>
                            <strong style="color: var(--text-main);">${patronName}</strong>
                            ${patronPhone ? `<div style="font-size: 0.78rem; color: var(--gold-light); font-family: monospace;">${patronPhone}</div>` : ''}
                            <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 220px; line-height: 1.4; margin-top: 0.2rem;">
                              ${patronAddress}
                            </div>
                          </td>
                          <td>
                            <div style="font-size: 0.8rem; line-height: 1.5;">
                              ${items.length > 0 ? items.map(item => `
                                <div>&bull; ${item.name || item.id} (${item.size || 50}ml) × ${item.qty || item.quantity || 1}</div>
                              `).join('') : '<span style="color: var(--text-muted);">Custom Order Items</span>'}
                            </div>
                          </td>
                          <td>
                            ${attachedGift ? `
                              <div class="admin-gift-badge">
                                VAULT GIFT: ${attachedGift}
                              </div>
                            ` : `
                              <span style="font-size: 0.75rem; color: var(--text-muted);">Standard Consignment</span>
                            `}
                          </td>
                          <td>
                            <div style="font-weight: 700; color: var(--gold-light);">${store.formatPrice(totalAmount)}</div>
                            <div style="margin-top: 0.3rem;">
                              <span class="admin-status-pill status-${currentStatus.toLowerCase().replace(/\s+/g, '-')}">
                                ${currentStatus}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style="display: flex; flex-direction: column; gap: 0.4rem; min-width: 220px;">
                              <div style="display: flex; gap: 0.4rem;">
                                <input type="text" id="courier-${orderId}" class="admin-input-compact" placeholder="Courier (e.g. BlueDart)" value="${courier}" style="flex: 1;" />
                                <input type="text" id="awb-${orderId}" class="admin-input-compact" placeholder="AWB / Tracking #" value="${awb}" style="flex: 1.2;" />
                              </div>
                              <div style="display: flex; gap: 0.4rem;">
                                <select id="status-${orderId}" class="admin-input-compact" style="flex: 1; background: rgba(4, 24, 18, 0.9);">
                                  <option value="Placed" ${currentStatus === 'Placed' ? 'selected' : ''}>Placed</option>
                                  <option value="Packed" ${currentStatus === 'Packed' ? 'selected' : ''}>Packed</option>
                                  <option value="Dispatched" ${currentStatus === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                                  <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                                <button class="btn btn-gold" style="font-size: 0.7rem; padding: 0.45rem 0.75rem; white-space: nowrap;" onclick="app.saveAndDispatchOrder('${orderId}', '${patronPhone}')">
                                  Save & WhatsApp
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        ` : ''}

        <!-- TAB 2: MYTHOS SOCIETY VIP MANAGER -->
        ${activeTab === 'users' ? `
          <div class="admin-tab-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h3 style="font-size: 1.3rem; color: var(--gold-light); margin: 0 0 0.2rem;">Mythos Society VIP Ledger</h3>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Inspect collector tiers, spendable/legacy points, bottle purchase milestones, and illuminate Pantheon Codex scents.</p>
              </div>
              <div style="min-width: 260px;">
                <input type="text" id="admin-user-search" class="admin-input-compact" style="width: 100%; padding: 0.6rem 0.9rem;" placeholder="Search by name, email, or UID..." oninput="app.filterAdminUsers(this.value)" />
              </div>
            </div>

            <!-- Quick Adjust Modal / Form -->
            <div class="liquid-glass-card" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid rgba(212, 175, 55, 0.35);">
              <h4 style="font-size: 1rem; color: var(--gold-light); margin-bottom: 0.8rem;">Adjust Collector Loyalty Ledger</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; align-items: end;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Target Collector UID / Email</label>
                  <input type="text" id="adjust-uid-input" class="admin-input-compact" style="width: 100%;" placeholder="Paste user UID or select below" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Spendable Mythos (+ / -)</label>
                  <input type="number" id="adjust-spendable-input" class="admin-input-compact" style="width: 100%;" placeholder="+500 or -200" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Legacy Mythos (+ / -)</label>
                  <input type="number" id="adjust-legacy-input" class="admin-input-compact" style="width: 100%;" placeholder="+1000" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Add Full Bottles Count</label>
                  <input type="number" id="adjust-bottles-input" class="admin-input-compact" style="width: 100%;" placeholder="+1" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Illuminate Codex Scent</label>
                  <select id="adjust-codex-input" class="admin-input-compact" style="width: 100%; background: rgba(4, 24, 18, 0.9);">
                    <option value="">None / Leave as is</option>
                    <option value="king-scar">King Scar</option>
                    <option value="petralux">Petralux</option>
                    <option value="oud-rion">Oud Rion</option>
                    <option value="spark">Spark</option>
                    <option value="wood-sera">Wood Sera</option>
                    <option value="ash">Ash</option>
                  </select>
                </div>
                <div>
                  <button class="btn btn-gold" style="width: 100%; padding: 0.6rem; font-size: 0.75rem;" onclick="app.submitUserMythosAdjustment()">
                    Apply Adjustment
                  </button>
                </div>
              </div>
            </div>

            <!-- Collector Cards Grid -->
            <div class="admin-card-grid" id="admin-users-list">
              ${usersList.length === 0 ? `
                <div class="liquid-glass-card" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
                  <p style="color: var(--text-muted); font-size: 0.9rem;">No collectors found in cloud database. Collectors will automatically register upon sign-in.</p>
                </div>
              ` : usersList.map(u => {
                const profile = u.profile || {};
                const loyalty = u.loyalty || {};
                const codex = Array.isArray(loyalty.codex_unlocked) ? loyalty.codex_unlocked : [];

                return `
                  <div class="admin-user-card liquid-glass-card" data-username="${(profile.name || '').toLowerCase()}" data-email="${(profile.email || u.uid || '').toLowerCase()}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.8rem;">
                      <div>
                        <h4 style="font-size: 1.05rem; color: var(--text-main); margin: 0 0 0.2rem;">${profile.name || 'Collector'}</h4>
                        <div style="font-size: 0.75rem; color: var(--gold-light); font-family: monospace;">${profile.email || 'No email attached'}</div>
                      </div>
                      <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-primary);">
                        ${profile.tier || 'Level 1: The Initiate'}
                      </span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; background: rgba(2, 14, 10, 0.6); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(212, 175, 55, 0.15);">
                      <div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Spendable</div>
                        <div style="font-size: 1rem; font-weight: 700; color: var(--gold-light);">${loyalty.spendable_mythos || 0} M</div>
                      </div>
                      <div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Legacy</div>
                        <div style="font-size: 1rem; font-weight: 700; color: #6EE7B7;">${loyalty.legacy_mythos || 0}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">Flacons</div>
                        <div style="font-size: 1rem; font-weight: 700; color: var(--gold-light);">${loyalty.full_bottles_purchased || 0}</div>
                      </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                      <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em;">Unlocked Pantheon Codex:</div>
                      <div>
                        ${codex.length > 0 ? codex.map(s => `
                          <span class="admin-codex-pill">${s}</span>
                        `).join('') : '<span style="font-size: 0.72rem; color: var(--text-muted);">None unlocked yet</span>'}
                      </div>
                    </div>

                    <button class="btn btn-glass" style="width: 100%; font-size: 0.72rem; padding: 0.45rem;" onclick="app.populateUserAdjustmentForm('${u.uid}')">
                      Quick Select for Adjustment &rarr;
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TAB 3: INVENTORY & DROP SWITCHBOARD -->
        ${activeTab === 'inventory' ? `
          <div class="admin-tab-pane">
            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-size: 1.3rem; color: var(--gold-light); margin: 0 0 0.2rem;">Inventory & Drop Switchboard</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Manage real-time availability across all 6 Extraits (50ml, 100ml) and Sixth Sense. Override stock states with 1-click toggles.</p>
            </div>

            <div class="admin-card-grid">
              ${MYTHOLIS_CATALOG.map(product => {
                const sizes = product.sizes || [{ ml: 50, price: product.price }];

                return `
                  <div class="admin-inventory-card liquid-glass-card">
                    <div>
                      <div style="display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.8rem;">
                        <img src="${product.image}" alt="${this.cleanText(product.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3);" />
                        <div>
                          <h4 style="font-size: 0.95rem; color: var(--text-main); margin: 0;">${product.name}</h4>
                          <span style="font-size: 0.72rem; color: var(--gold-light);">${product.subtitle || ''}</span>
                        </div>
                      </div>

                      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                        ${sizes.map(s => {
                          const skuKey = `${product.id}_${s.ml}`;
                          const currentStatus = inventoryMap[skuKey] || 'in_stock';

                          return `
                            <div style="background: rgba(2, 14, 10, 0.6); padding: 0.7rem 0.8rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.15);">
                              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                                <strong>${s.ml}ml Flacon</strong>
                                <span style="color: var(--gold-light); font-weight: 700;">${store.formatPrice(s.price)}</span>
                              </div>
                              <div class="admin-toggle-group">
                                <button class="admin-toggle-btn ${currentStatus === 'in_stock' ? 'active-stock' : ''}" onclick="app.toggleInventorySku('${skuKey}', 'in_stock')">
                                  In Stock
                                </button>
                                <button class="admin-toggle-btn ${currentStatus === 'sold_out' ? 'active-sold' : ''}" onclick="app.toggleInventorySku('${skuKey}', 'sold_out')">
                                  Sold Out
                                </button>
                                <button class="admin-toggle-btn ${currentStatus === 'early_access' ? 'active-early' : ''}" onclick="app.toggleInventorySku('${skuKey}', 'early_access')">
                                  Early Drop
                                </button>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TAB 4: PROMO & VAULT CODE INSPECTOR -->
        ${activeTab === 'codes' ? `
          <div class="admin-tab-pane">
            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-size: 1.3rem; color: var(--gold-light); margin: 0 0 0.2rem;">Promo & Vault Code Inspector</h3>
              <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Mint custom one-time VIP codes, concession vouchers, or creator partnership codes into the cloud ledger.</p>
            </div>

            <!-- Mint Code Form -->
            <div class="liquid-glass-card" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid rgba(212, 175, 55, 0.35);">
              <h4 style="font-size: 1rem; color: var(--gold-light); margin-bottom: 0.8rem;">Mint Custom Sanctum Code</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; align-items: end;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Code Name</label>
                  <input type="text" id="mint-code-input" class="admin-input-compact" style="width: 100%; text-transform: uppercase;" placeholder="e.g. MYTH-VIP-2026" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Concession Title</label>
                  <input type="text" id="mint-title-input" class="admin-input-compact" style="width: 100%;" placeholder="e.g. ₹1,000 VIP Privilege" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Discount Amount (₹)</label>
                  <input type="number" id="mint-amount-input" class="admin-input-compact" style="width: 100%;" placeholder="1000" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Min Order Required (₹)</label>
                  <input type="number" id="mint-minorder-input" class="admin-input-compact" style="width: 100%;" placeholder="3000" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Max Total Uses</label>
                  <input type="number" id="mint-uses-input" class="admin-input-compact" style="width: 100%;" placeholder="1" value="1" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Target Email (Optional)</label>
                  <input type="email" id="mint-email-input" class="admin-input-compact" style="width: 100%;" placeholder="vip@collector.com" />
                </div>
                <div style="grid-column: 1 / -1; display: flex; gap: 0.8rem; align-items: center;">
                  <input type="text" id="mint-note-input" class="admin-input-compact" style="flex: 1;" placeholder="Internal Reference Note (e.g. Special VIP Concession)" />
                  <button class="btn btn-gold" style="padding: 0.6rem 1.4rem; font-size: 0.78rem; white-space: nowrap;" onclick="app.submitNewVipCode()">
                    Mint Sanctum Code
                  </button>
                </div>
              </div>
            </div>

            <!-- Existing Codes Table -->
            <div class="admin-table-wrapper">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Voucher Code</th>
                    <th>Perk & Concession</th>
                    <th>Order Threshold</th>
                    <th>Uses Remaining</th>
                    <th>Target / Collector Note</th>
                    <th>Date Minted</th>
                  </tr>
                </thead>
                <tbody>
                  ${codesList.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No custom codes found in cloud ledger. Mint your first VIP code above!
                      </td>
                    </tr>
                  ` : codesList.map(c => `
                    <tr>
                      <td>
                        <strong style="color: var(--gold-primary); font-family: monospace; font-size: 0.95rem;">${c.code || c.id}</strong>
                      </td>
                      <td>
                        <strong style="color: var(--text-main); font-size: 0.85rem;">${c.title || 'Concession'}</strong>
                        <div style="font-size: 0.75rem; color: var(--gold-light);">₹${c.amount || 0} Off</div>
                      </td>
                      <td>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Min. ₹${c.minOrder || 0}</span>
                      </td>
                      <td>
                        <span class="glass-pill" style="font-size: 0.7rem; color: #10B981;">
                          ${c.maxUses ? `${c.usesCount || 0} / ${c.maxUses} used` : (c.used ? 'Redeemed' : 'Active')}
                        </span>
                      </td>
                      <td>
                        <div style="font-size: 0.75rem; color: var(--text-main);">${c.targetEmail || 'Universal (Anyone)'}</div>
                        ${c.note ? `<div style="font-size: 0.7rem; color: var(--text-muted);">${c.note}</div>` : ''}
                      </td>
                      <td>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">
                          ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
};

window.Components = Components;
window.components = Components;



