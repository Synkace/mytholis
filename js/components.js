/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - COMPONENTS RENDERERS
   Generates dynamic HTML markup for views, modals, product cards, quiz, track order, faqs, contact,
   legal policies, and Razorpay/WhatsApp checkout integrations.
   ========================================================================== */

const Components = {
  /* Render Product Card with 3D Pop-out Overlap & Contained Glass Sheen */
  renderProductCard(product) {
    const isWishlisted = store.isInWishlist(product.id);
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
          <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy" decoding="async" />
        </div>
        <div class="product-card-info">
          <span class="product-card-collection">${product.collection}</span>
          <h3 class="product-card-title">${product.name}</h3>
          <p class="product-card-accord">${product.accords.slice(0, 3).join(' • ')}</p>
          <div class="product-card-footer">
            <div>
              <span class="product-price">${store.formatPrice(product.price)}</span>
              <span class="product-tax-note">MRP (Incl. taxes)</span>
            </div>
            <button class="btn btn-glass product-explore-btn" onclick="event.stopPropagation(); app.openProductView('${product.id}')">
              Explore ✦
            </button>
          </div>
        </div>
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
            <span class="kicker-text">HAUTE PARFUMERIE · 30% EXTRAIT CONCENTRATION</span>
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
            <span id="heroSublineName">Oud Rion Extrait</span> · <span>30% Pure Concentration</span> · <span>Hand-Distilled in Mayfair &amp; Ahmedabad</span>
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
            Alchemic extraits hand-formulated in Mayfair, London and artisanally distilled in Ahmedabad, India. Crafted with 28%–30% pure fragrance oil concentration and encased in flacons of liquid crystal.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-gold" onclick="app.openProductView('mytholis-discovery-set')">
              Order Discovery Set (6 × 10ml) • ₹1,999 ✦
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('know-us')">
              Read Our Heritage
            </button>
          </div>
        </div>
      </section>

      <!-- Discovery Coffret Spotlight Banner -->
      <section class="container" style="margin-bottom: 6rem;">
        <div class="discovery-vault-banner liquid-glass-card">
          <div class="discovery-banner-content">
            <span class="glass-pill" style="margin-bottom: 0.8rem;">✦ Master Discovery Edition</span>
            <h2 class="font-title gold-shimmer-text" style="font-size: clamp(1.6rem, 3vw, 2.3rem); margin-bottom: 0.8rem;">
              The Mytholis Vault Discovery Coffret
            </h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
              Cannot decide on your signature extract? Experience all 6 master creations in deluxe 10ml travel flacons. Includes a <strong>₹1,000 voucher</strong> redeemable against your first full 100ml flacon.
            </p>
            <div class="discovery-banner-perks">
              <span>✦ 6 × 10ml Deluxe Atomizers</span>
              <span>✦ All 6 Extraits de Parfum</span>
              <span>✦ Free Pan-India Armored Delivery</span>
            </div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
              <button class="btn btn-gold" onclick="app.openProductView('mytholis-discovery-set')">
                Explore Discovery Coffret (₹1,999) ✦
              </button>
              <button class="btn btn-glass" onclick="app.buyNowWhatsApp('mytholis-discovery-set')">
                💬 Order via WhatsApp
              </button>
            </div>
          </div>
          <div class="discovery-banner-visual bottle-pedestal-glow">
            <img src="assets/coffret_banner.webp" alt="Mytholis Vault Discovery Coffret" loading="lazy" decoding="async" style="max-height: 280px; width: 100%; max-width: 380px; object-fit: cover; border-radius: 18px; border: 1px solid rgba(212, 175, 55, 0.35); box-shadow: 0 15px 35px rgba(0,0,0,0.8);" />
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
              <div class="wrapper kingscar">
                <img src="assets/hero/kingscarcard.webp" class="cover-image base-card-img" alt="King Scar Cover" loading="eager" decoding="async" />
                <img src="assets/hero/kingscarbg.webp" class="cover-image hover-bg-img" alt="King Scar Atmosphere" loading="eager" decoding="async" />
              </div>
              <img src="assets/product/1kingscar.webp" class="character" alt="King Scar Bottle" loading="eager" decoding="async" />
            </div>
          </a>

          <a href="javascript:void(0)" onclick="app.openProductView('oud-rion')" alt="Oud Rion">
            <div class="card">
              <div class="wrapper oudrion">
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
            Explore All Extraits in Catalog ✦
          </button>
        </div>
      </section>

      <!-- Olfactory Notes Pyramid Showcase -->
      <section class="container" style="margin-bottom: 6rem;">
        <div class="section-header">
          <span class="tagline">Anatomie de Parfum</span>
          <h2>The Pyramid of Resonance</h2>
          <div class="divider"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
          <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--gold-primary);">✦</div>
            <h3 class="font-title" style="margin-bottom: 0.8rem; color: var(--gold-light);">Top Notes: Ether</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
              Solar Kashmiri saffron, Italian bergamot rind, and crushed pink peppercorn. The immediate spark of luminous energy that awakens the spirit.
            </p>
          </div>

          <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--gold-primary);">✦✦</div>
            <h3 class="font-title" style="margin-bottom: 0.8rem; color: var(--gold-light);">Heart Notes: Core</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
              Taif and Damascus rose, smoked frankincense, and Florentine orris root. The lingering, evocative emotional signature.
            </p>
          </div>

          <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--gold-primary);">✦✦✦</div>
            <h3 class="font-title" style="margin-bottom: 0.8rem; color: var(--gold-light);">Base Notes: Anchor</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
              Sustainably cultivated Assam agarwood accord, golden amber resin, and Haitian vetiver. An enduring presence lasting 8–10+ hours.
            </p>
          </div>
        </div>
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
            Each composition is blended with 28%–30% IFRA-certified fine perfume oils and undergoes 120 days of cold maceration inside dark emerald glass carboys before receiving hand-blown crystal encapsulation.
          </p>
        </div>

        <div class="scent-pyramid-container" style="margin-top: 2rem;">
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">120</h4>
            <p>Days Cold Barrel Maceration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">28–30%</h4>
            <p>Extrait de Parfum Concentration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">100%</h4>
            <p>IFRA Compliant & Cruelty-Free</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 3rem;">
          <button class="btn btn-gold" onclick="app.navigateTo('find-scent')">
            Begin Olfactory Quiz ✦
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
          { icon: "👑", text: "Regal presence & absinthe spice (Aromatic · Men)", product: "king-scar" },
          { icon: "🔥", text: "Smouldering embers & sacred woods (Woody · Unisex)", product: "ash" },
          { icon: "💎", text: "Radiant golden pineapple & chypre (Fruity · Unisex)", product: "petralux" },
          { icon: "⚡", text: "Electric neroli, citrus & leather (Aromatic · Unisex)", product: "spark" }
        ]
      },
      {
        step: 2,
        title: "Which presence do you wish to command?",
        options: [
          { icon: "👑", text: "The King of Woods: Royal Oud & Saffron", product: "oud-rion" },
          { icon: "🌲", text: "The Forest at Golden Hour: Velvet Rose & Oud", product: "wood-sera" },
          { icon: "✨", text: "Light Trapped in Stone: Golden Fruit & Birch", product: "petralux" },
          { icon: "🕯️", text: "Sacred Embers: Sandalwood & Amber", product: "ash" }
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
                <span class="glass-pill" style="font-size: 0.68rem; color: var(--gold-light);">✦ The Circle of Legends</span>
                <h4 style="font-size: 1.05rem; color: var(--gold-light); margin: 0.4rem 0 0.2rem;">Initiation Honorific Awarded</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">+150 Spendable Mythos & +100 Legacy Mythos credited to your Obsidian Vault.</p>
              </div>
              <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.5rem 1.1rem;" onclick="app.openProfileModal()">View Obsidian Dossier 👑</button>
            </div>

            <span class="glass-pill" style="margin-bottom: 1rem;">✦ 98.6% Olfactory Match</span>
            <h2 class="gold-shimmer-text quiz-match-title">Your Signature Extract Is: ${matchedProduct.name}</h2>
            <div style="max-width: 320px; margin: 0 auto 2rem;" class="bottle-pedestal-glow">
              <img src="${matchedProduct.image}" alt="${matchedProduct.name}" class="quiz-result-img" />
            </div>
            <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem;">${matchedProduct.name}</h3>
            <p class="subtitle" style="margin-bottom: 1.5rem;">${matchedProduct.subtitle}</p>
            <p style="color: var(--text-muted); max-width: 550px; margin: 0 auto 2rem;">
              "${matchedProduct.tagline}" ${matchedProduct.description}
            </p>
            <div class="quiz-result-actions">
              <button class="btn btn-gold" onclick="app.openProductView('${matchedProduct.id}')">View Scent Details</button>
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
                <span class="quiz-option-icon">${opt.icon}</span>
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
            <input type="text" id="track-order-input" class="engraving-input" style="flex-grow: 1; font-size: 1rem;" placeholder="e.g. MYTH-89021 or MYTH-VIP-99420" value="MYTH-89021" />
            <button class="btn btn-gold track-search-btn" onclick="app.searchTrackOrder()">Track Order ✦</button>
          </div>

          <div id="track-result-box" class="track-result-container">
            <div class="track-order-header">
              <div>
                <span class="glass-pill">Order #MYTH-89021</span>
                <h3 class="track-order-product-name">Petralux Extrait de Parfum (100ml)</h3>
              </div>
              <div class="track-delivery-est">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Estimated Delivery:</span>
                <p style="font-weight: 600; color: var(--gold-primary);">August 26, 2026</p>
              </div>
            </div>

            <!-- Progress Tracker -->
            <div class="tracker-steps-grid">
              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Order Placed</h5>
                <span>Aug 24</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Vault Packed</h5>
                <span>Aug 24</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Dispatched</h5>
                <span>Aug 25</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle active liquid-pulse">🚚</div>
                <h5>Out for Delivery</h5>
                <span style="color: var(--gold-primary);">BlueDart Express</span>
              </div>
            </div>

            <p class="track-location-status">
              📍 Current Location: BlueDart Armored Express Hub (Ahmedabad Air Cargo Terminal). Dispatched for destination delivery.
            </p>
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
        a: "While typical commercial perfumes contain only 10–15% fragrance oil (Eau de Toilette), Mytholis handcrafts Extraits de Parfum at a high 28%–30% concentration using IFRA-compliant fine fragrance oils. This yields extraordinary depth, rich sillage, and a lingering presence that lasts 8–10+ hours."
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
                Send Concierge Message ✦
              </button>
            </form>
          </div>

          <!-- Right: Registered Office & Atelier -->
          <div class="contact-info-col">
            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">🇮🇳 Registered Office (India)</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Mytholis Luxury Fragrances Pvt. Ltd.</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                Vasant Vihar 2, Nava Naroda,<br/>
                Ahmedabad, Gujarat 382330, India<br/>
                <strong>GSTIN:</strong> 24AAECM4821P1ZT<br/>
                ☎ +91 777000 9170 • ✉ concierge@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">🇬🇧 Formulation Design Studio</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Mytholis London Studio</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6;">
                18 Hanover Square, Mayfair,<br/>
                London W1S 1HN, United Kingdom<br/>
                ✉ london@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">⚡ Instant WhatsApp Concierge</span>
              <h4 style="font-size: 1.2rem; color: var(--gold-light); margin-bottom: 0.5rem;">Live Chat & Quick Buy</h4>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
                Connect directly with our fragrance concierge on WhatsApp for instant orders.
              </p>
              <button class="btn btn-gold btn-compact" onclick="window.open('https://wa.me/917770009170?text=' + encodeURIComponent('Hello Mytholis Concierge, I would like to inquire about your Extrait collection.'), '_blank')">
                💬 Chat on WhatsApp (+91 777000 9170)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* Render Single Product Detailed View */
  renderProductDetail(productId) {
    const product = MYTHOLIS_CATALOG.find(p => p.id === productId) || MYTHOLIS_CATALOG[0];
    const isWishlisted = store.isInWishlist(product.id);
    
    // Determine active size and price for this product
    let activeSizeObj = product.sizes.find(s => s.ml === app.selectedSize);
    if (!activeSizeObj) {
      activeSizeObj = product.sizes[product.sizes.length - 1] || product.sizes[0];
    }
    const currentMl = activeSizeObj.ml;
    const currentPrice = activeSizeObj.price;
    app.selectedSize = currentMl;
    app.selectedPrice = currentPrice;
    const unitPricePerMl = (currentPrice / currentMl).toFixed(2);

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
              <img src="${product.image}" alt="${product.name}" class="main-bottle-view-img tilt-element" id="transparent-bottle-img" />
            </div>
            <div class="subtitle" style="margin-top: 2rem; font-size: 1rem;">
              ✦ Handcrafted Crystal Flacon
            </div>
            <div style="margin-top: 0.5rem;">
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
              </div>
              <span style="color: var(--gold-primary); font-size: 0.9rem;">★ ${product.rating} (${product.reviewsCount} verified reviews)</span>
            </div>

            <p class="product-detail-desc">
              ${product.description}
            </p>

            <!-- Size Selector (50ml and 100ml only, no 200ml) -->
            <div style="margin-bottom: 1.5rem;">
              <label style="font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold-light); display: block; margin-bottom: 0.6rem;">
                Select Volume:
              </label>
              <div class="product-size-buttons" id="size-selector-group">
                ${product.sizes.map(s => `
                  <button class="btn ${s.ml === currentMl ? 'btn-gold' : 'btn-glass'} size-btn" 
                          data-ml="${s.ml}" data-price="${s.price}"
                          onclick="app.selectProductSize(${s.ml}, ${s.price})">
                    ${s.ml} ml — ${store.formatPrice(s.price)}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Engraving Option -->
            <div class="engraving-box">
              <label style="font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold-primary);">
                ✦ Complimentary Gold Initials Engraving:
              </label>
              <input type="text" id="engraving-text" class="engraving-input" placeholder="e.g. A.V. 2026" maxlength="12" />
            </div>

            <!-- Performance Gauges -->
            <div class="performance-meters">
              <div class="meter-card">
                <div class="meter-title">Longevity (${product.longevityHours}h)</div>
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

            <!-- Action Buttons: WhatsApp Buy, Razorpay Pay, Add to Cart -->
            <div class="product-detail-actions-stacked">
              <div class="action-btn-row">
                <button class="btn btn-gold btn-whatsapp-buy" onclick="app.buyNowWhatsApp('${product.id}')">
                  <span>💬</span> Order via WhatsApp Concierge ✦
                </button>
                <button class="btn btn-gold btn-razorpay-buy" onclick="app.buyNowRazorpay('${product.id}')">
                  <span>⚡</span> Pay via UPI / Razorpay
                </button>
              </div>

              <div class="action-btn-row secondary-actions">
                <button class="btn btn-glass" style="flex: 2;" onclick="app.addProductToCart('${product.id}')">
                  Add to Cart ✦
                </button>
                <button class="btn btn-glass ${isWishlisted ? 'active' : ''}" style="flex: 1;" onclick="store.toggleWishlist('${product.id}'); app.renderCurrentView();">
                  ♥ ${isWishlisted ? 'Saved' : 'Wishlist'}
                </button>
              </div>
            </div>

            <!-- Mandatory Legal Metrology Dossier Card -->
            <div class="legal-metrology-card liquid-glass-card" style="margin-top: 2rem;">
              <div class="legal-metrology-header">
                <span class="legal-metrology-badge">⚖️ Mandatory Legal Metrology Dossier</span>
                <span class="legal-metrology-country">Country of Origin: India 🇮🇳</span>
              </div>
              <div class="legal-metrology-grid">
                <div class="legal-metrology-item">
                  <span class="metrology-label">Generic Name:</span>
                  <span class="metrology-val">Extrait de Parfum (Fine Fragrance)</span>
                </div>
                <div class="legal-metrology-item">
                  <span class="metrology-label">Net Content:</span>
                  <span class="metrology-val" id="metrology-net-qty">${currentMl} ml / ${ (currentMl * 0.0338).toFixed(1) } fl. oz.</span>
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

        <!-- Detailed Notes Pyramid -->
        <div style="margin-top: 5rem;">
          <div class="section-header">
            <span class="tagline">Olfactory Architecture</span>
            <h2>Fragrance Notes Hierarchy</h2>
            <div class="divider"></div>
          </div>

          <div class="scent-pyramid-container">
            <div class="pyramid-node liquid-glass-card">
              <h5>TOP NOTES</h5>
              <p>${product.notes.top.join('<br/>')}</p>
            </div>
            <div class="pyramid-node liquid-glass-card">
              <h5>HEART NOTES</h5>
              <p>${product.notes.heart.join('<br/>')}</p>
            </div>
            <div class="pyramid-node liquid-glass-card">
              <h5>BASE NOTES</h5>
              <p>${product.notes.base.join('<br/>')}</p>
            </div>
          </div>
        </div>
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
          <div class="modal-crest-icon">🛍️</div>
          <div>
            <h3 class="modal-title font-title">Your Cart (${count})</h3>
            <p class="modal-subtitle">Complimentary express armored delivery across India</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeCartModal()" title="Close Cart">✕</button>
      </div>

      <div class="modal-scroll-body">
        ${store.cart.length === 0 ? `
          <div class="modal-empty-state liquid-glass-card">
            <div class="modal-empty-icon">✦</div>
            <h4 class="modal-empty-title">Your Scent Vault is Empty</h4>
            <p class="modal-empty-desc font-garamond">Explore our signature extraits or order the Vault Discovery Set (6 × 10ml).</p>
            <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
              <button class="btn btn-gold" onclick="app.closeCartModal(); app.openProductView('mytholis-discovery-set');">
                Discovery Set (₹1,999) ✦
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
                <img src="${item.image}" alt="${item.name}" class="modal-product-item-img" />
                <div class="modal-product-item-info">
                  <h5 class="modal-product-item-name">${item.name}</h5>
                  <p class="modal-product-item-meta">${item.size}ml ${item.engraving ? `• "${item.engraving}"` : ''}</p>
                  <span class="gold-text modal-product-item-price">${store.formatPrice(item.price * item.quantity)}</span>
                </div>
                <div class="modal-qty-control">
                  <button class="icon-btn qty-btn" onclick="store.updateCartQuantity(${idx}, -1)">-</button>
                  <span class="qty-num">${item.quantity}</span>
                  <button class="icon-btn qty-btn" onclick="store.updateCartQuantity(${idx}, 1)">+</button>
                </div>
                <button class="icon-btn modal-remove-btn" onclick="store.removeFromCart(${idx})" title="Remove item">✕</button>
              </div>
            `).join('')}
          </div>

          <!-- Vault Concessions & Voucher Input -->
          <div class="modal-section-box liquid-glass-card" style="margin-top: 1rem; padding: 1rem;">
            <div class="modal-section-header" style="margin-bottom: 0.6rem;">
              <h5 class="modal-section-title" style="font-size: 0.82rem;">✦ Mythos Society Concession / Voucher</h5>
              <span class="modal-section-hint">Margin guardrails applied</span>
            </div>

            ${appliedReward ? `
              <div class="applied-voucher-banner" style="background: rgba(212, 175, 55, 0.12); border: 1px solid var(--gold-primary); padding: 0.8rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">${appliedReward.code}</span>
                    <strong style="color: var(--gold-light); font-size: 0.85rem;">${appliedReward.title}</strong>
                  </div>
                  <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.2rem;">
                    ${appliedReward.type === 'discount' 
                      ? `Concession applied: -${store.formatPrice(discountAmount)} (Capped at 30% of cart / ₹2,500 max)` 
                      : `Complimentary Vault Gift: ${appliedGift ? appliedGift.name : 'Exclusive Flacon'} attached`
                    }
                  </div>
                </div>
                <button class="icon-btn" onclick="app.removeCartRewardCode()" title="Remove Voucher" style="color: #ff6b6b; font-size: 0.9rem;">✕</button>
              </div>
            ` : `
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.6rem;">
                <input type="text" id="cart-voucher-input" class="engraving-input" placeholder="Enter MYTH-... Code" style="margin: 0; text-transform: uppercase; font-size: 0.82rem; padding: 0.5rem 0.8rem;" />
                <button class="btn btn-gold" style="font-size: 0.75rem; padding: 0.5rem 1rem; white-space: nowrap;"
                        onclick="const el = document.getElementById('cart-voucher-input'); if(el && el.value.trim()){ app.applyCartRewardCode(el.value.trim()); }">
                  Apply ✦
                </button>
              </div>
            `}

            ${!appliedReward && unusedCodes.length > 0 ? `
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; margin-top: 0.5rem;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Quick apply:</span>
                ${unusedCodes.slice(0, 3).map(c => `
                  <button class="glass-pill" style="font-size: 0.65rem; cursor: pointer; padding: 0.2rem 0.6rem;" onclick="app.applyCartRewardCode('${c.code}')">
                    ${c.code} (${c.type === 'discount' ? `₹${c.amount}` : 'Gift'})
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <!-- Estimated Mythos Earnings -->
            <div style="margin-top: 0.8rem; padding: 0.6rem 0.8rem; border-radius: 8px; background: rgba(4, 24, 18, 0.4); border: 1px solid rgba(212, 175, 55, 0.15); font-size: 0.74rem; color: var(--gold-light); display: flex; align-items: center; gap: 0.5rem;">
              <span>✦</span>
              <div>
                Acquisition Earnings: <strong>+${estLoyalty.spendEarned} Spendable M</strong> & <strong>+${estLoyalty.legacyEarned} Legacy M</strong>
              </div>
            </div>
          </div>
        `}
      </div>

      ${store.cart.length > 0 ? `
        <div class="modal-footer modal-cart-footer">
          <div class="modal-subtotal-row" style="flex-direction: column; gap: 0.3rem;">
            ${discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-muted); width: 100%;">
                <span>Subtotal</span>
                <span>${store.formatPrice(rawSubtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--gold-light); width: 100%;">
                <span>Concession (${appliedReward ? appliedReward.code : 'Reward'})</span>
                <span>-${store.formatPrice(discountAmount)}</span>
              </div>
            ` : ''}
            ${appliedGift ? `
              <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--gold-light); width: 100%;">
                <span>Vault Flacon Gift (${appliedGift.name})</span>
                <span class="glass-pill" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">FREE</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1rem; width: 100%; margin-top: 0.2rem; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 0.4rem;">
              <span>Total (Incl. all taxes)</span>
              <span class="gold-text modal-total-amount">${store.formatPrice(finalTotal)}</span>
            </div>
          </div>
          <div class="modal-cart-actions-row">
            <button class="btn btn-gold" style="flex: 1;" onclick="app.openRazorpayModal()">
              <span>⚡</span> Pay via UPI / Razorpay ✦
            </button>
            <button class="btn btn-glass" style="flex: 1;" onclick="app.checkoutCartWhatsApp()">
              <span>💬</span> Order via WhatsApp
            </button>
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
          <div class="modal-crest-icon" style="color: #E74C3C;">♥</div>
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
            <div class="modal-empty-icon" style="color: #E74C3C;">♥</div>
            <h4 class="modal-empty-title">Your Wishlist is Empty</h4>
            <p class="modal-empty-desc font-garamond">Save your favorite signature extraits to revisit them anytime.</p>
            <button class="btn btn-gold" onclick="app.closeWishlistModal(); app.navigateTo('collections');">
              Explore Extraits ✦
            </button>
          </div>
        ` : `
          <div class="modal-items-list">
            ${items.map(p => `
              <div class="modal-product-item-card liquid-glass-card">
                <img src="${p.image}" alt="${p.name}" class="modal-product-item-img" />
                <div class="modal-product-item-info">
                  <span class="glass-pill" style="font-size: 0.62rem; padding: 0.15rem 0.5rem; margin-bottom: 0.2rem; display: inline-block;">${p.subtitle}</span>
                  <h5 class="modal-product-item-name">${p.name}</h5>
                  <span class="gold-text modal-product-item-price">${store.formatPrice(p.price)}</span>
                </div>
                <div class="modal-item-btn-group">
                  <button class="btn btn-gold modal-item-cta-btn" onclick="store.addToCart('${p.id}'); app.closeWishlistModal(); app.openCartModal();">
                    Add to Cart ✦
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
          Browse All Extraits ✦
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
              ${nextTier ? `Path to elevation: Level ${nextTier.level} — ${nextTier.name}` : 'Pinnacle Status Achieved — Patron of the Extrait Pantheon'}
            </p>
          </div>
          <div style="text-align: right;">
            <span class="glass-pill" style="border-color: var(--gold-primary); color: var(--gold-primary);">
              ✦ ${currentTier.multiplier || 1}x Earning Multiplier
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
            👑 <strong>Pinnacle Status:</strong> You hold the highest honor in the Mythos Society. Enjoy 5x Mythos on all acquisitions, 1-month early access to maceration vintages, and bespoke private flacon conciergerie.
          </div>
        `}
      </div>

      <!-- Initiation Hook Banner if not completed -->
      ${!loyalty.initiation_completed ? `
        <div class="modal-section-box liquid-glass-card" style="border: 1px solid var(--gold-primary); background: radial-gradient(circle at 10% 50%, rgba(212, 175, 55, 0.15) 0%, rgba(4, 24, 18, 0.6) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div>
              <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">✦ Scent Initiate Privilege</span>
              <h5 style="font-size: 0.95rem; color: var(--gold-light); margin: 0.3rem 0 0.2rem;">Claim Your 150 Mythos Initiation Bounty</h5>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">Register your olfactory signature in the VIP Dossier to unlock +150 Spendable & +100 Legacy Mythos.</p>
            </div>
            <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.45rem 1rem;" onclick="app.completeUserInitiation()">
              Claim Honorific ✦
            </button>
          </div>
        </div>
      ` : ''}

      <!-- 2. The Pantheon Codex (6-Flacon Grid) -->
      <div class="modal-section-box liquid-glass-card">
        <div class="modal-section-header">
          <div>
            <h4 class="modal-section-title">✦ The Pantheon Codex</h4>
            <span class="modal-section-hint">Acquire 50ml or 100ml flacons to illuminate and unlock legend milestones</span>
          </div>
          <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${unlockedCount} / 6 Illuminated</span>
        </div>

        <!-- Milestones Row -->
        <div class="codex-milestones-row">
          <div class="codex-milestone-box ${loyalty.trinity_claimed || unlockedCount >= 3 ? 'claimed' : ''}">
            <div>
              <strong style="color: var(--gold-light); font-size: 0.82rem;">✦ The Trinity (3 Core Scents)</strong>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">+300 Spendable & +300 Legacy Mythos</span>
            </div>
            <span class="glass-pill" style="font-size: 0.65rem;">
              ${loyalty.trinity_claimed || unlockedCount >= 3 ? 'Unlocked ✓' : `${unlockedCount}/3 Flacons`}
            </span>
          </div>

          <div class="codex-milestone-box ${loyalty.pantheon_claimed || unlockedCount >= 6 ? 'claimed' : ''}">
            <div>
              <strong style="color: var(--gold-light); font-size: 0.82rem;">👑 The Full Pantheon (All 6 Scents)</strong>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">+1,000 Spendable & +1,000 Legacy Mythos</span>
            </div>
            <span class="glass-pill" style="font-size: 0.65rem;">
              ${loyalty.pantheon_claimed || unlockedCount >= 6 ? 'Unlocked ✓' : `${unlockedCount}/6 Flacons`}
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
                  <img src="${product.image}" alt="${product.name}" class="codex-bottle-img" loading="lazy" decoding="async" />
                </div>
                <div>
                  <h5 style="font-family: var(--font-serif-title); font-size: 0.95rem; margin-bottom: 0.2rem; color: var(--gold-light);">${product.name}</h5>
                  <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0;">${product.subtitle}</p>
                </div>
                <div>
                  ${isUnlocked 
                    ? `<span class="codex-badge illuminated">✦ ILLUMINATED</span>` 
                    : `<span class="codex-badge locked">🔒 50ml / 100ml Needed</span>`
                  }
                  ${!isUnlocked ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.68rem; padding: 0.35rem 0.5rem; margin-top: 0.6rem;"
                            onclick="${isModal ? 'app.closeProfileModal();' : ''} app.openProductView('${id}')">
                      Acquire Flacon ✦
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
            <h4 class="modal-section-title">✦ The Vault Redemption</h4>
            <span class="modal-section-hint">Convert spendable Mythos into concessions or complimentary flacons</span>
          </div>
          <span class="gold-text" style="font-size: 0.85rem; font-weight: 700;">Balance: ${(loyalty.spendable_mythos || 0).toLocaleString()} M</span>
        </div>

        ${unusedCodes.length > 0 ? `
          <div style="margin-bottom: 1.2rem;">
            <div style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.6rem;">
              ✦ Ready to Apply Vouchers (${unusedCodes.length})
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
                      Apply to Cart ✦
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
                  <div class="reward-icon-wrap">${r.type === 'gift' ? '🎁' : '🏷️'}</div>
                  <span class="reward-cost-pill">${r.cost} M</span>
                </div>
                <h5 class="reward-title">${r.title}</h5>
                <p class="reward-desc">${r.desc}</p>
                <div>
                  ${isLevelLocked ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.7rem; padding: 0.45rem; opacity: 0.6; cursor: not-allowed;" disabled>
                      🔒 Unlocks at ${minTierObj ? minTierObj.name : `Level ${r.minLevel}`}
                    </button>
                  ` : !isAffordable ? `
                    <button class="btn btn-glass" style="width: 100%; font-size: 0.7rem; padding: 0.45rem; opacity: 0.6; cursor: not-allowed;" disabled>
                      Need ${(r.cost - loyalty.spendable_mythos).toLocaleString()} more M
                    </button>
                  ` : `
                    <button class="btn btn-gold" style="width: 100%; font-size: 0.72rem; padding: 0.45rem;" onclick="app.redeemReward('${r.id}')">
                      Redeem for ${r.cost} M ✦
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4. Tier Perks Comparative Table -->
      <div class="modal-section-box liquid-glass-card">
        <div class="modal-section-header">
          <h4 class="modal-section-title">✦ The Circle of Legends Hierarchy</h4>
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
      </div>
    `;
  },

  /* Render User Profile View */
  renderProfile() {
    const u = store.user;
    const currentTier = store.getCurrentTier();

    return `
      <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        <div class="profile-header-card liquid-glass-card" style="margin-bottom: 2rem;">
          <div class="vip-badge-icon">👑</div>
          <div>
            <span class="glass-pill" style="margin-bottom: 0.5rem;">${currentTier.name}</span>
            <h2 class="profile-welcome-title">Welcome, ${u.name}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${u.email} • ${(store.loyalty ? store.loyalty.spendable_mythos : 0).toLocaleString()} Spendable Mythos (${(store.loyalty ? store.loyalty.legacy_mythos : 0).toLocaleString()} Legacy M)</p>
          </div>
        </div>

        ${this.renderLoyaltyDossierContent(false)}

        <div class="liquid-glass-card profile-orders-card" style="margin-top: 2rem;">
          <h3 class="font-title" style="margin-bottom: 1.5rem;">Recent Vault Acquisitions</h3>
          <div class="table-responsive">
            <table class="order-history-table">
              <thead>
                <tr style="color: var(--gold-light);">
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${u.orders.map(o => `
                  <tr>
                    <td style="font-family: var(--font-serif-title);">${o.id}</td>
                    <td>${o.date}</td>
                    <td>${o.items}</td>
                    <td class="gold-text">${store.formatPrice(o.total)}</td>
                    <td><span class="glass-pill">${o.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /* Render VIP Profile & Vault Modal (Popup) with Currency and Track Order */
  renderProfileModal() {
    const u = store.user;
    const currentTier = store.getCurrentTier();
    const currencies = [
      { code: 'INR', flag: '🇮🇳', sym: '₹' },
      { code: 'USD', flag: '🇺🇸', sym: '$' },
      { code: 'GBP', flag: '🇬🇧', sym: '£' },
      { code: 'AED', flag: '🇦🇪', sym: 'AED' },
      { code: 'CNY', flag: '🇨🇳', sym: '¥' },
      { code: 'RUB', flag: '🇷🇺', sym: '₽' }
    ];

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon">👑</div>
          <div>
            <h3 class="modal-title font-title">The Obsidian Dossier</h3>
            <p class="modal-subtitle">The Circle of Legends • VIP Client Vault</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeProfileModal()" title="Close Vault">✕</button>
      </div>

      <div class="modal-scroll-body">
        <!-- VIP Member Overview -->
        <div class="profile-modal-user-card liquid-glass-card">
          <div class="profile-avatar-wrap">
            <span>👑</span>
          </div>
          <div class="profile-modal-user-info">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h4 class="profile-user-name">${u.name}</h4>
              <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">${currentTier.name}</span>
            </div>
            <p class="profile-user-email">${u.email}</p>
            <div class="profile-points-pill">
              ✦ <strong>${(store.loyalty ? store.loyalty.spendable_mythos : 0).toLocaleString()}</strong> Spendable Mythos &nbsp;|&nbsp; <strong>${(store.loyalty ? store.loyalty.legacy_mythos : 0).toLocaleString()}</strong> Legacy M
            </div>
          </div>
        </div>

        <!-- Full Circle of Legends Loyalty Program -->
        ${this.renderLoyaltyDossierContent(true)}

        <!-- 5. Currency Selector -->
        <div class="modal-section-box liquid-glass-card">
          <div class="modal-section-header">
            <h4 class="modal-section-title">✦ Store Currency (Base: INR ₹)</h4>
            <span class="modal-section-hint">Auto-converts all prices</span>
          </div>
          <div class="currency-modal-grid">
            ${currencies.map(c => `
              <button class="currency-modal-pill ${store.currency === c.code ? 'active' : ''}" 
                      onclick="app.setCurrency('${c.code}')">
                <span class="curr-flag">${c.flag}</span>
                <span class="curr-code">${c.code}</span>
                <span class="curr-sym">(${c.sym})</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 6. Live Consignment & Order Tracker -->
        <div class="modal-section-box liquid-glass-card">
          <div class="modal-section-header">
            <h4 class="modal-section-title">✦ Track Consignment</h4>
            <span class="modal-section-hint">Armored express telemetry</span>
          </div>
          
          <div class="modal-track-input-row">
            <input type="text" id="modal-track-input" class="engraving-input" value="MYTH-89021" placeholder="Enter Order / Tracking ID" />
            <button class="btn btn-gold modal-track-btn" onclick="app.searchTrackOrderModal()">
              Track ✦
            </button>
          </div>

          <div class="modal-track-result" id="modal-track-result-box">
            <div class="track-order-header" style="padding-bottom: 0.6rem; margin-bottom: 0.6rem;">
              <div>
                <span class="glass-pill" style="font-size: 0.65rem;">Order #MYTH-89021 • In Flight</span>
                <h5 style="font-size: 0.95rem; color: var(--text-main); margin-top: 0.3rem;">Petralux Extrait de Parfum (100ml)</h5>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">Est. Delivery:</span>
                <strong style="color: var(--gold-primary); font-size: 0.82rem; display: block;">Tomorrow, 2:00 PM</strong>
              </div>
            </div>

            <div class="tracker-steps-grid" style="margin-bottom: 0.8rem; gap: 0.4rem;">
              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed" style="width: 28px; height: 28px; font-size: 0.75rem;">✓</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem;">Maceration</h6>
                <span style="font-size: 0.62rem;">Sealed</span>
              </div>
              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed" style="width: 28px; height: 28px; font-size: 0.75rem;">✓</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem;">Gold Inlaid</h6>
                <span style="font-size: 0.62rem;">QC Passed</span>
              </div>
              <div class="tracker-step-item">
                <div class="tracker-icon-circle active liquid-pulse" style="width: 28px; height: 28px; font-size: 0.75rem;">🚚</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem; color: var(--gold-light);">In Transit</h6>
                <span style="font-size: 0.62rem; color: var(--gold-primary);">BlueDart</span>
              </div>
              <div class="tracker-step-item">
                <div class="tracker-icon-circle" style="width: 28px; height: 28px; font-size: 0.75rem; background: rgba(14, 66, 51, 0.4); color: var(--text-muted);">✦</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem;">Delivery</h6>
                <span style="font-size: 0.62rem;">Armored</span>
              </div>
            </div>

            <p class="track-location-status" style="font-size: 0.75rem; margin: 0; padding: 0.5rem 0.8rem;">
              📍 <strong>Telemetry:</strong> Dispatched from Ahmedabad Fragrance Vault Hub to regional delivery hub.
            </p>
          </div>
        </div>

        <!-- 7. Recent Vault Acquisitions -->
        <div class="modal-section-box liquid-glass-card">
          <div class="modal-section-header">
            <h4 class="modal-section-title">✦ Recent Vault Orders</h4>
          </div>
          <div class="modal-orders-list">
            ${u.orders.map(o => `
              <div class="modal-order-row">
                <div>
                  <div style="font-family: var(--font-serif-title); color: var(--gold-light); font-size: 0.85rem;">
                    ${o.id} <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-sans);">• ${o.date}</span>
                  </div>
                  <p style="font-size: 0.8rem; color: var(--text-main); margin-top: 0.15rem;">${o.items}</p>
                </div>
                <div style="text-align: right;">
                  <span class="gold-text" style="font-weight: 700; font-size: 0.85rem;">${store.formatPrice(o.total)}</span>
                  <span class="glass-pill" style="font-size: 0.62rem; display: inline-block; margin-top: 0.2rem; padding: 0.15rem 0.5rem;">${o.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-glass" style="width: 100%; font-size: 0.8rem; padding: 0.6rem 1rem;" onclick="app.closeProfileModal()">
          Close Dossier ✦
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
          All prices displayed are Maximum Retail Prices (MRP) inclusive of Goods and Services Tax (GST) and all applicable taxes in India. Payments are processed securely through RBI-compliant payment gateways including Razorpay, UPI, credit/debit cards, and NetBanking.
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
          We do not store complete credit card or debit card numbers on our servers. All financial transactions are securely handled by 256-bit SSL encrypted PCI-DSS Level 1 compliant gateway partners (Razorpay / UPI).
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
          <div class="modal-crest-icon">⚖️</div>
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
          I Understand & Agree ✦
        </button>
      </div>
    `;
  },

  /* Render Razorpay / UPI Instant Checkout Modal */
  renderRazorpayModal(productOrCart) {
    const isSingleProduct = !!productOrCart.id;
    const baseSubtotal = isSingleProduct ? (app.selectedPrice || productOrCart.price) : store.getCartTotal();
    const appliedReward = isSingleProduct ? null : store.getAppliedReward();
    const appliedGift = isSingleProduct ? null : store.getAppliedGift();
    const discount = isSingleProduct ? 0 : store.getDiscountAmount(baseSubtotal);
    const finalAmount = Math.max(0, baseSubtotal - discount);
    const title = isSingleProduct ? productOrCart.name : `Vault Cart (${store.getCartCount()} items)`;

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon" style="color: #3399CC;">⚡</div>
          <div>
            <h3 class="modal-title font-title">Razorpay Express Checkout</h3>
            <p class="modal-subtitle">256-Bit SSL Encrypted Instant Payment</p>
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
          <h5 style="font-size: 0.85rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem;">
            ✦ Select Payment Mode
          </h5>

          <!-- UPI Apps Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 1.2rem;">
            <div class="razorpay-method-pill active" onclick="app.selectPaymentMethod(this, 'upi_gpay')">
              <span style="font-size: 1.1rem;">📱</span>
              <span>Google Pay</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'upi_phonepe')">
              <span style="font-size: 1.1rem;">🟣</span>
              <span>PhonePe</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'upi_paytm')">
              <span style="font-size: 1.1rem;">🔵</span>
              <span>Paytm / UPI</span>
            </div>
          </div>

          <!-- Cards & NetBanking Options -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; margin-bottom: 1.2rem;">
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'cards')">
              <span style="font-size: 1.1rem;">💳</span>
              <span>Credit / Debit Card</span>
            </div>
            <div class="razorpay-method-pill" onclick="app.selectPaymentMethod(this, 'cod')">
              <span style="font-size: 1.1rem;">📦</span>
              <span>Cash on Delivery (COD)</span>
            </div>
          </div>

          <!-- Shipping Details Form -->
          <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
            <input type="text" class="engraving-input" placeholder="Full Delivery Name" value="${store.user.name}" />
            <div style="display: flex; gap: 0.6rem;">
              <input type="tel" class="engraving-input" placeholder="Mobile / WhatsApp (+91 777000 9170)" style="flex: 1;" />
              <input type="text" class="engraving-input" placeholder="PIN Code" style="flex: 1;" />
            </div>
            <input type="text" class="engraving-input" placeholder="Flat, Street, Area, Landmark Address" />
          </div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; gap: 0.8rem;">
        <button class="btn btn-gold" style="flex: 1;" onclick="app.completeRazorpayPayment(${finalAmount})">
          Authorize & Pay ${store.formatPrice(finalAmount)} ✦
        </button>
      </div>
    `;
  }
};

window.Components = Components;
window.components = Components;


