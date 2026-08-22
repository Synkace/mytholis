/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - COMPONENTS RENDERERS
   Generates dynamic HTML markup for views, modals, product cards, quiz, track order, faqs, and contact.
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
          <img src="${product.image}" alt="${product.name}" class="product-card-img" />
        </div>
        <div class="product-card-info">
          <span class="product-card-collection">${product.collection}</span>
          <h3 class="product-card-title">${product.name}</h3>
          <p class="product-card-accord">${product.accords.slice(0, 3).join(' • ')}</p>
          <div class="product-card-footer">
            <span class="product-price">${store.formatPrice(product.price)}</span>
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
    const featuredProducts = MYTHOLIS_CATALOG.slice(0, 6);
    const heroIdx = typeof app !== 'undefined' && app.heroIndex !== undefined ? app.heroIndex : 0;
    const heroProduct = MYTHOLIS_CATALOG[heroIdx] || MYTHOLIS_CATALOG[0];

    return `
      <!-- Hero Section with Interactive Bottle Swiper -->
      <section class="container hero-wrapper" id="hero-section">
        <div class="hero-content" id="hero-text-content">
          <div class="hero-badge-wrap">
            <span class="glass-pill" id="hero-badge">✦ ${heroProduct.subtitle}</span>
            <span class="glass-pill" id="hero-edition" style="color: var(--gold-light);">No. 0${heroIdx + 1} of 06</span>
          </div>
          <h1 class="hero-title" id="hero-heading">
            Wear Your <span class="gold-shimmer-text" id="hero-fragrance-name">${heroProduct.name}</span>
          </h1>
          <p class="hero-subtitle" id="hero-desc">
            "${heroProduct.tagline}" ${heroProduct.description}
          </p>
          <div class="hero-accords-bar" id="hero-accords-list">
            ${heroProduct.accords.map(a => `<span class="hero-accord-tag">✦ ${a}</span>`).join('')}
          </div>
          <div class="hero-actions" id="hero-actions-row">
            <button class="btn btn-gold" id="hero-cta-btn" onclick="app.openProductView('${heroProduct.id}')">
              Discover ${heroProduct.name} ✦
            </button>
            <button class="btn btn-glass" id="hero-quickadd-btn" onclick="app.addProductToCart('${heroProduct.id}')">
              Quick Add • ${store.formatPrice(heroProduct.price)}
            </button>
            <button class="btn btn-glass" onclick="app.navigateTo('find-scent')">
              Find My Scent Quiz ✦
            </button>
          </div>
        </div>

        <div class="hero-product-viewport" id="hero-bottle-viewport" title="Swipe or Click to switch fragrance">
          <button class="hero-arrow-btn hero-arrow-prev" onclick="event.stopPropagation(); app.prevHeroProduct()" aria-label="Previous Fragrance">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="hero-bottle-stage" onclick="app.nextHeroProduct()">
            <div class="hero-liquid-halo"></div>
            <img src="${heroProduct.image}" alt="${heroProduct.name}" class="hero-bottle-img tilt-element" id="hero-bottle-img" />
          </div>

          <button class="hero-arrow-btn hero-arrow-next" onclick="event.stopPropagation(); app.nextHeroProduct()" aria-label="Next Fragrance">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Hero Numbered Pagination Selector -->
          <div class="hero-pagination-bar" id="hero-pagination-dots">
            ${MYTHOLIS_CATALOG.map((p, i) => `
              <button class="hero-page-pill ${i === heroIdx ? 'active' : ''}" 
                      onclick="event.stopPropagation(); app.setHeroProduct(${i})" 
                      title="${p.name}">
                0${i + 1} <span>${p.name.split(' ')[0]}</span>
              </button>
            `).join('')}
          </div>

          <div class="hero-swipe-hint">
            <span>✦</span> Click or Swipe to explore all 6 extracts <span>✦</span>
          </div>
        </div>
      </section>

      <!-- Brand Essence Spotlight -->
      <section class="container" style="margin: 6rem auto;">
        <div class="liquid-glass-card brand-essence-card">
          <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.3em; text-transform: uppercase;">Six elements. Six legends. One house.</span>
          <h2 class="brand-essence-title">
            "Wear Your Legend."
          </h2>
          <p class="font-garamond brand-essence-desc">
            Alchemic fragrances hand-distilled from nocturnal botanicals, wild harvested agarwood, and liquid amber. Encased in liquid glass crystal bottles.
          </p>
          <button class="btn btn-glass" onclick="app.navigateTo('know-us')">
            Read Our Heritage
          </button>
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
          <a href="javascript:void(0)" onclick="app.openProductView('smoky-musk')" alt="Smoky Musk">
            <div class="card">
              <div class="wrapper 2bg">
                <img src="hero/assets/2bg.png" class="cover-image" />
              </div>
              <img src="hero/assets/2.png" class="character" />
            </div>
          </a>

          <a href="javascript:void(0)" onclick="app.openProductView('white-spark')" alt="White Spark">
            <div class="card">
              <div class="wrapper 4bg">
                <img src="hero/assets/4bg.png" class="cover-image" />
              </div>
              <img src="hero/assets/4.png" class="character" />
            </div>
          </a>

          <a href="javascript:void(0)" onclick="app.openProductView('wood-sera')" alt="Wood Sera">
            <div class="card">
              <div class="wrapper 6bg">
                <img src="hero/assets/6bg.png" class="cover-image" />
              </div>
              <img src="hero/assets/6.png" class="character" />
            </div>
          </a>
        </div>

        <div style="text-align: center; margin-top: 5rem;">
          <button class="btn btn-gold" onclick="app.navigateTo('collections')">
            Explore All 6 Extraits in Catalog ✦
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
              Solar saffron, bergamot rind, and crushed pink peppercorn. The immediate spark of luminous energy that awakens the spirit.
            </p>
          </div>

          <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--gold-primary);">✦✦</div>
            <h3 class="font-title" style="margin-bottom: 0.8rem; color: var(--gold-light);">Heart Notes: Core</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
              Damascus night-blooming rose, smoked frankincense, and Florentine orris root. The lingering, evocative emotional signature.
            </p>
          </div>

          <div class="liquid-glass-card" style="padding: 2.5rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--gold-primary);">✦✦✦</div>
            <h3 class="font-title" style="margin-bottom: 0.8rem; color: var(--gold-light);">Base Notes: Anchor</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
              Wild harvested Cambodian agarwood, raw ambergris, and Haitian vetiver. The enduring phantom trail lasting up to 18 hours.
            </p>
          </div>
        </div>
      </section>
    `;
  },

  /* Render Collections View */
  renderCollections() {
    const categories = ['All', 'Woody · Mineral', 'Smoky · Sensual', 'Amber · Opulent', 'Fresh · Electric', 'Oud · Royal', 'Woody · Evening'];
    const active = store.activeCategory;
    const filteredProducts = active === 'All' 
      ? MYTHOLIS_CATALOG 
      : MYTHOLIS_CATALOG.filter(p => p.collection.toLowerCase() === active.toLowerCase());

    return `
      <div class="container">
        <div class="section-header">
          <span class="tagline">Six Elements. Six Legends. One House.</span>
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

        <!-- Products Grid -->
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
            Founded on the principle of uncompromised olfactory artistry, House Mytholis resurrects ancient extraction formulas through cutting-edge cold-extraction chemistry and rare sustainable nocturnal harvest botanicals.
          </p>
          <p class="craft-story-text">
            Each formula undergoes 180 days of cold barrel maceration inside dark emerald crystal carboys before receiving hand-blown crystal encapsulation.
          </p>
        </div>

        <div class="scent-pyramid-container" style="margin-top: 2rem;">
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">180</h4>
            <p>Days Cold Barrel Maceration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">35%</h4>
            <p>Pure Extrait Oil Concentration</p>
          </div>
          <div class="pyramid-node liquid-glass-card">
            <h4 class="gold-text" style="font-size: 2.2rem; margin-bottom: 0.5rem;">100%</h4>
            <p>Zero Synthetic Stabilizers</p>
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
          { icon: "🪨", text: "Cool ancient stone after rain (Woody · Mineral)", product: "terra-petra" },
          { icon: "🔥", text: "Embers & leather smoke (Smoky · Sensual)", product: "smoky-musk" },
          { icon: "💎", text: "Radiant golden luxury (Amber · Opulent)", product: "petralux" },
          { icon: "⚡", text: "Electric citrus & white tea (Fresh · Electric)", product: "white-spark" }
        ]
      },
      {
        step: 2,
        title: "Which presence do you wish to command?",
        options: [
          { icon: "👑", text: "The King of Woods: Royal Oud & Saffron", product: "oud-rion" },
          { icon: "🌲", text: "The Forest at Dusk: Sandalwood & Guaiac", product: "wood-sera" },
          { icon: "✨", text: "Light Trapped in Stone: Saffron & Rose", product: "petralux" },
          { icon: "🕯️", text: "Smouldering Fire: Incense & Leather", product: "smoky-musk" }
        ]
      }
    ];

    if (step > questions.length) {
      const matchedProduct = MYTHOLIS_CATALOG[0]; // Terra Petra
      return `
        <div class="container">
          <div class="quiz-wrapper quiz-result-card liquid-glass-card">
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
          <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.2em;">Step ${step} of 3</span>
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
                <h3 class="track-order-product-name">Petralux Elixir Privé (100ml)</h3>
              </div>
              <div class="track-delivery-est">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Estimated Delivery:</span>
                <p style="font-weight: 600; color: var(--gold-primary);">August 15, 2026</p>
              </div>
            </div>

            <!-- Progress Tracker -->
            <div class="tracker-steps-grid">
              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Order Placed</h5>
                <span>July 28</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Cold Maceration</h5>
                <span>August 02</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle completed">✓</div>
                <h5>Gold Engraved</h5>
                <span>August 10</span>
              </div>

              <div class="tracker-step-item">
                <div class="tracker-icon-circle active liquid-pulse">✈</div>
                <h5>In Transit</h5>
                <span style="color: var(--gold-primary);">On Schedule</span>
              </div>
            </div>

            <p class="track-location-status">
              📍 Current Location: FedEx International Luxury Priority Hub (Paris Charles de Gaulle). Sealed in climate-controlled vault packaging.
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
        q: "What makes Mytholis Extrait de Parfum different from mass perfume?",
        a: "Unlike commercial perfumes that dilute fragrance oil to 10-15%, Mytholis hand-crafts Grand Extraits at a lavish 30-36% pure essential oil concentration. Each batch undergoes 180 days of cold barrel maceration inside dark emerald glass carboys."
      },
      {
        q: "Are the gold bottle engravings permanent?",
        a: "Yes. Our master artisans hand-chase your personalized initials or date into the crystal glass and inlay 24-karat gold leaf gilding, creating a heirloom piece that lasts forever."
      },
      {
        q: "Where do you source your rare botanical ingredients?",
        a: "Our Damascus roses are harvested strictly at 4:00 AM in Grasse, France. Our wild agarwood is ethically harvested from 40-year-old sustainable reserves in Assam, and our orris butter is aged 3 years in Florence."
      },
      {
        q: "How does complimentary sample discovery work?",
        a: "Every full bottle order includes a 2ml matching discovery sample vial. You may test the 2ml sample vial first before unsealing the cellophaned main crystal flask. If it does not harmonize with your aura, returns are complimentary."
      },
      {
        q: "What is your worldwide delivery & shipping protocol?",
        a: "We ship globally via FedEx Express Luxury Priority in temperature-shielded velvet vault boxes. Delivery takes 2-4 business days worldwide."
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
            <h3 style="color: var(--gold-light); margin-bottom: 0.5rem; font-size: 1.6rem;">Inquire with our Olfactory Master</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem;">
              Whether seeking a bespoke bridal formula or private collection consultation, our concierge responds within 2 hours.
            </p>

            <form onsubmit="event.preventDefault(); app.submitContactForm();">
              <div class="contact-form-row">
                <div>
                  <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Your Name</label>
                  <input type="text" class="engraving-input" required placeholder="Lord / Lady..." />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Email Address</label>
                  <input type="email" class="engraving-input" required placeholder="concierge@..." />
                </div>
              </div>

              <div style="margin-bottom: 1.2rem;">
                <label style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em;">Inquiry Subject</label>
                <select class="engraving-input" style="cursor: pointer; background: #041812;">
                  <option>Bespoke Custom Fragrance Formula</option>
                  <option>Gold Engraving & Corporate Gifting</option>
                  <option>Order Status & Private Delivery</option>
                  <option>Boutique Press & Wholesale</option>
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

          <!-- Right: Flagship Boutiques & Info -->
          <div class="contact-info-col">
            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">Flagship Sanctuary</span>
              <h4 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 0.5rem;">Grasse Parfumerie Atelier</h4>
              <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                14 Route des Lavandes, 06130 Grasse, France<br/>
                ☎ +33 4 93 36 00 12 • ✉ grasse@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">Asian Reserve Atelier</span>
              <h4 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 0.5rem;">Kyoto Gion Sanctuary</h4>
              <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                588 Gionmachi Minamigawa, Higashiyama Ward, Kyoto, Japan<br/>
                ☎ +81 75 561 0088 • ✉ kyoto@mytholis.com
              </p>
            </div>

            <div class="liquid-glass-card" style="padding: 2rem;">
              <span class="glass-pill" style="margin-bottom: 0.8rem;">Global VIP Desk</span>
              <h4 style="font-size: 1.3rem; color: var(--gold-light); margin-bottom: 0.5rem;">Direct Concierge Email</h4>
              <p style="color: var(--text-muted); font-size: 0.9rem;">
                ✉ concierge@mytholis.com<br/>
                ☎ +1 (800) 948-6447 (24/7 VIP Line)
              </p>
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
              ✦ Translucent Crystal Flask
            </div>
          </div>

          <!-- Right: Product Specifications -->
          <div class="product-spec-col">
            <span class="tagline" style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 0.2em;">${product.collection}</span>
            <h1 class="product-detail-title">${product.name}</h1>
            <p class="subtitle" style="margin-bottom: 0.4rem;">${product.subtitle}</p>
            <p style="font-style: italic; color: var(--gold-light); font-size: 0.95rem; margin-bottom: 1.2rem; font-family: var(--font-serif-title);">"${product.tagline}"</p>

            <div class="product-detail-price-row">
              <span class="product-price" style="font-size: 2rem;">${store.formatPrice(product.price)}</span>
              <span style="color: var(--gold-primary); font-size: 0.9rem;">★ ${product.rating} (${product.reviewsCount} reviews)</span>
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
                  <button class="btn ${s.ml === 100 ? 'btn-gold' : 'btn-glass'} size-btn" 
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
                ✦ Complimentary Gold Engraving (Initials / Name):
              </label>
              <input type="text" id="engraving-text" class="engraving-input" placeholder="e.g. A.V. 2026" maxlength="12" />
            </div>

            <!-- Performance Gauges -->
            <div class="performance-meters">
              <div class="meter-card">
                <div class="meter-title">Longevity (${product.longevityHours}h)</div>
                <div class="meter-bar-track">
                  <div class="meter-bar-fill" style="width: ${(product.longevityHours / 18) * 100}%;"></div>
                </div>
              </div>
              <div class="meter-card">
                <div class="meter-title">Sillage Projection (${product.sillageRating}%)</div>
                <div class="meter-bar-track">
                  <div class="meter-bar-fill" style="width: ${product.sillageRating}%;"></div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="product-detail-actions">
              <button class="btn btn-gold" style="flex-grow: 1;" onclick="app.addProductToCart('${product.id}')">
                Add to Cart ✦
              </button>
              <button class="btn btn-glass ${isWishlisted ? 'active' : ''}" onclick="store.toggleWishlist('${product.id}'); app.renderCurrentView();">
                ♥ ${isWishlisted ? 'Saved' : 'Wishlist'}
              </button>
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
    const total = store.getCartTotal();
    const count = store.getCartCount();

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon">🛍️</div>
          <div>
            <h3 class="modal-title font-title">Your Cart (${count})</h3>
            <p class="modal-subtitle">Complimentary express armored courier</p>
          </div>
        </div>
        <button class="icon-btn modal-close-btn" onclick="app.closeCartModal()" title="Close Cart">✕</button>
      </div>

      <div class="modal-scroll-body">
        ${store.cart.length === 0 ? `
          <div class="modal-empty-state liquid-glass-card">
            <div class="modal-empty-icon">✦</div>
            <h4 class="modal-empty-title">Your Scent Vault is Empty</h4>
            <p class="modal-empty-desc font-garamond">Explore our six signature extraits and discover your legend.</p>
            <button class="btn btn-gold" onclick="app.closeCartModal(); app.navigateTo('collections');">
              Explore Catalog ✦
            </button>
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
        `}
      </div>

      ${store.cart.length > 0 ? `
        <div class="modal-footer modal-cart-footer">
          <div class="modal-subtotal-row">
            <span>Subtotal</span>
            <span class="gold-text modal-total-amount">${store.formatPrice(total)}</span>
          </div>
          <div class="modal-cart-actions-row">
            <button class="btn btn-gold" style="flex-grow: 1;" onclick="app.simulateCheckout()">
              Proceed to Checkout ✦
            </button>
            <button class="btn btn-glass" onclick="app.closeCartModal(); app.navigateTo('collections');">
              Add More ✦
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
          Browse All 6 Extraits ✦
        </button>
      </div>
    `;
  },

  /* Render Wishlist Full Page (fallback) */
  renderWishlist() {
    return this.renderWishlistModal();
  },

  /* Render User Profile View */
  renderProfile() {
    const u = store.user;
    return `
      <div class="container">
        <div class="profile-header-card liquid-glass-card">
          <div class="vip-badge-icon">👑</div>
          <div>
            <span class="glass-pill" style="margin-bottom: 0.5rem;">${u.tier}</span>
            <h2 class="profile-welcome-title">Welcome, ${u.name}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${u.email} • ${u.points} Vault Rewards Points</p>
          </div>
        </div>

        <div class="liquid-glass-card profile-orders-card">
          <h3 class="font-title" style="margin-bottom: 1.5rem;">Recent Order History</h3>
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
                    <td class="gold-text">${o.total}</td>
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
    const currencies = [
      { code: 'INR', flag: '🇮🇳', sym: '₹' },
      { code: 'GBP', flag: '🇬🇧', sym: '£' },
      { code: 'AED', flag: '🇦🇪', sym: 'AED' },
      { code: 'CNY', flag: '🇨🇳', sym: '¥' },
      { code: 'RUB', flag: '🇷🇺', sym: '₽' },
      { code: 'USD', flag: '🇺🇸', sym: '$' }
    ];

    return `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="modal-crest-icon">👑</div>
          <div>
            <h3 class="modal-title font-title">Obsidian Vault</h3>
            <p class="modal-subtitle">VIP Client Dossier & Controls</p>
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
              <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light);">${u.tier}</span>
            </div>
            <p class="profile-user-email">${u.email}</p>
            <div class="profile-points-pill">
              ✦ <strong>${u.points.toLocaleString()}</strong> Vault Loyalty Points
            </div>
          </div>
        </div>

        <!-- 1. Currency Selector -->
        <div class="modal-section-box liquid-glass-card">
          <div class="modal-section-header">
            <h4 class="modal-section-title">✦ Store Currency</h4>
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

        <!-- 2. Live Consignment & Order Tracker -->
        <div class="modal-section-box liquid-glass-card">
          <div class="modal-section-header">
            <h4 class="modal-section-title">✦ Track Consignment</h4>
            <span class="modal-section-hint">Armored courier telemetry</span>
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
                <h5 style="font-size: 0.95rem; color: var(--text-main); margin-top: 0.3rem;">Petralux (100ml Extrait)</h5>
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
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem;">24K Inlaid</h6>
                <span style="font-size: 0.62rem;">Customs OK</span>
              </div>
              <div class="tracker-step-item">
                <div class="tracker-icon-circle active liquid-pulse" style="width: 28px; height: 28px; font-size: 0.75rem;">✈</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem; color: var(--gold-light);">In Flight</h6>
                <span style="font-size: 0.62rem; color: var(--gold-primary);">Jet MY-702</span>
              </div>
              <div class="tracker-step-item">
                <div class="tracker-icon-circle" style="width: 28px; height: 28px; font-size: 0.75rem; background: rgba(14, 66, 51, 0.4); color: var(--text-muted);">✦</div>
                <h6 style="font-size: 0.7rem; margin-top: 0.3rem;">VIP Delivery</h6>
                <span style="font-size: 0.62rem;">White Glove</span>
              </div>
            </div>

            <p class="track-location-status" style="font-size: 0.75rem; margin: 0; padding: 0.5rem 0.8rem;">
              📍 <strong>Telemetry:</strong> Dispatched from Paris Charles de Gaulle Vault Hub to regional private terminal.
            </p>
          </div>
        </div>

        <!-- 3. Recent Vault Acquisitions -->
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
                  <span class="gold-text" style="font-weight: 700; font-size: 0.85rem;">${store.formatPrice(340)}</span>
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
  }
};

window.Components = Components;
window.components = Components;

