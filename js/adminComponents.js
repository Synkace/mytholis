/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - SOVEREIGN COMMAND ADMIN PANEL COMPONENTS
   Haute Parfumerie Dark Emerald & Liquid Gold 6-Module Operations Desk
   ========================================================================== */

export const AdminComponents = {
  renderAdmin() {
    const currentUser = (typeof firebaseService !== 'undefined' && firebaseService?.currentUser) || store.firebaseUser;
    const userEmail = (currentUser?.email || store.user?.email || '').trim().toLowerCase();
    const whitelist = ['gunhegarr@gmail.com', 'admin@mytholis.com', 'alexander@mytholis.com', 'founder@mytholis.com'];
    const isAuthorized = store.isAdmin() || (userEmail && (whitelist.includes(userEmail) || userEmail.includes('gunhegarr')));

    // 1. Unauthenticated or Unauthorized Gate
    if (!isAuthorized) {
      return `
        <div class="container" style="min-height: 80vh; max-width: 900px; margin: 0 auto; padding-top: 3rem;">
          <div class="admin-auth-card liquid-glass-card" style="margin: 2rem auto; text-align: center;">
            <span class="glass-pill" style="color: var(--gold-primary); letter-spacing: 0.25em; margin-bottom: 1.2rem; font-size: 0.7rem;">
              RESTRICTED SOVEREIGN GATEWAY
            </span>
            <h1 class="gold-shimmer-text font-title" style="font-size: 2.2rem; margin-bottom: 0.5rem;">
              Sovereign Command
            </h1>
            <p class="font-garamond" style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
              Operations desk, dispatch vault, VIP society ledger, and fragrance alchemy switchboard. Access restricted strictly to verified Mytholis Founders & Sovereign Administrators.
            </p>

            ${currentUser ? `
              <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 1.2rem; margin-bottom: 1.8rem; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div style="color: #FCA5A5; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  Access Denied
                </div>
                <div style="color: var(--text-muted); font-size: 0.82rem; line-height: 1.5;">
                  Authenticated account: <strong style="color: var(--text-main);">${userEmail}</strong> does not possess Sovereign Administrator privileges.
                </div>
              </div>
              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-gold" onclick="app.navigateTo('home')">
                  Return to Storefront
                </button>
                <button class="btn btn-glass" onclick="app.logoutUser()">
                  Sign Out
                </button>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 0 auto;">
                <button class="btn btn-gold" style="width: 100%; padding: 0.9rem; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; gap: 0.8rem;" onclick="app.handleAdminGoogleSignIn()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  Founder Google Authentication
                </button>
                <button class="btn btn-glass" style="width: 100%;" onclick="app.openAuthModal('signin')">
                  Patron Email Sign In
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }

    // 2. Authorized Sovereign Admin Panel
    const activeTab = app.adminActiveTab || 'telemetry';
    const adminData = app.adminData || { orders: [], users: [], products: [], posts: [], settings: {} };
    const ordersList = adminData.orders || [];
    const usersList = adminData.users || [];
    const productsList = (adminData.products && adminData.products.length) ? adminData.products : store.getProducts();
    const postsList = adminData.posts || [];
    const globalSettings = adminData.settings || store.globalSettings || {};

    // Module A: Telemetry KPIs Calculation
    let settledRevenue = 0;
    let pendingCodCount = 0;
    let pendingCodValue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let packedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    ordersList.forEach(o => {
      const st = (o.status || 'Pending').toLowerCase();
      const pm = (o.paymentMethod || 'Prepaid').toUpperCase();
      const ps = (o.paymentStatus || 'Pending').toLowerCase();
      const val = Number(o.finalPayable || o.total || o.subtotal || 0);

      // Status counters
      if (st === 'pending') pendingCount++;
      else if (st === 'confirmed') confirmedCount++;
      else if (st === 'packed') packedCount++;
      else if (st === 'shipped') shippedCount++;
      else if (st === 'delivered') deliveredCount++;
      else if (st === 'cancelled' || st === 'rto') cancelledCount++;

      // Revenue: Settled Paid orders + Delivered Paid COD orders
      if (ps === 'paid') {
        settledRevenue += val;
      }

      // COD Pipeline
      if (pm === 'COD' && ps !== 'paid' && st !== 'cancelled' && st !== 'rto') {
        pendingCodCount++;
        pendingCodValue += val;
      }
    });

    // Total Mythos Economy Liability across all patrons
    let totalMythosLiability = 0;
    usersList.forEach(u => {
      totalMythosLiability += Number(u.loyalty?.spendable_mythos || 0);
    });

    // Low Stock Alerts (stock <= 5)
    const lowStockItems = productsList.filter(p => Number(p.stock !== undefined ? p.stock : 50) <= 5);

    return `
      <div class="sovereign-container">
        <!-- Sovereign Header Bar -->
        <div class="sovereign-header-card">
          <div class="sovereign-header-left">
            <div class="sovereign-crest">M</div>
            <div class="sovereign-title-group">
              <span class="glass-pill" style="color: var(--gold-primary); font-size: 0.65rem; margin-bottom: 0.3rem;">SOVEREIGN COMMAND DESK</span>
              <h1 class="gold-shimmer-text font-title">Operations & Alchemy Ledger</h1>
              <div class="sovereign-auth-indicator">
                <span class="sovereign-live-dot"></span>
                <span>Founder: <strong style="color: var(--gold-light);">${userEmail}</strong> &bull; Verified High Sovereign</span>
              </div>
            </div>
          </div>
          <div class="sovereign-header-actions">
            <button class="btn btn-glass" style="font-size: 0.78rem; padding: 0.6rem 1.1rem;" onclick="app.refreshAdminDashboard()" title="Synchronize with Firestore">
              ↻ Refresh Cloud Ledger
            </button>
            <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.6rem 1.1rem;" onclick="app.navigateTo('home')">
              Storefront Preview
            </button>
            <button class="btn btn-glass" style="font-size: 0.78rem; padding: 0.6rem 1.1rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.logoutUser()">
              Exit Sanctum
            </button>
          </div>
        </div>

        <!-- Sticky Sovereign Navigation Tabs -->
        <div class="sovereign-nav-bar">
          <button class="sovereign-tab ${activeTab === 'telemetry' ? 'active' : ''}" onclick="app.setAdminTab('telemetry')">
            📊 Executive Telemetry
          </button>
          <button class="sovereign-tab ${activeTab === 'orders' ? 'active' : ''}" onclick="app.setAdminTab('orders')">
            📦 Orders & COD (${ordersList.length})
          </button>
          <button class="sovereign-tab ${activeTab === 'vault' ? 'active' : ''}" onclick="app.setAdminTab('vault')">
            🏺 Fragrance Vault (${productsList.length})
          </button>
          <button class="sovereign-tab ${activeTab === 'editorial' ? 'active' : ''}" onclick="app.setAdminTab('editorial')">
            📜 Lore & Editorial (${postsList.length})
          </button>
          <button class="sovereign-tab ${activeTab === 'patrons' ? 'active' : ''}" onclick="app.setAdminTab('patrons')">
            👑 Patron Registry (${usersList.length})
          </button>
          <button class="sovereign-tab ${activeTab === 'economy' ? 'active' : ''}" onclick="app.setAdminTab('economy')">
            ⚙️ Economy & Settings
          </button>
        </div>

        <!-- ====================================================================
             MODULE A: EXECUTIVE TELEMETRY
             ==================================================================== -->
        ${activeTab === 'telemetry' ? `
          <div class="sovereign-tab-content">
            <!-- 5 Real-Time KPI Cards -->
            <div class="sovereign-kpi-grid">
              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Settled Revenue</span>
                  <span class="sovereign-kpi-icon">💰</span>
                </div>
                <div class="sovereign-kpi-value gold-shimmer-text">₹${Math.round(settledRevenue).toLocaleString('en-IN')}</div>
                <div class="sovereign-kpi-hint">Paid Online + Delivered COD</div>
              </div>

              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Pending COD Pipeline</span>
                  <span class="sovereign-kpi-icon">⏳</span>
                </div>
                <div class="sovereign-kpi-value" style="color: #FBBF24;">₹${Math.round(pendingCodValue).toLocaleString('en-IN')}</div>
                <div class="sovereign-kpi-hint">${pendingCodCount} uncollected COD consignments</div>
              </div>

              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Total Consignments</span>
                  <span class="sovereign-kpi-icon">📦</span>
                </div>
                <div class="sovereign-kpi-value">${ordersList.length}</div>
                <div class="sovereign-kpi-hint">${deliveredCount} successfully delivered</div>
              </div>

              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Mythos Liability</span>
                  <span class="sovereign-kpi-icon">🪙</span>
                </div>
                <div class="sovereign-kpi-value gold-shimmer-text">${totalMythosLiability.toLocaleString()} M</div>
                <div class="sovereign-kpi-hint">₹${totalMythosLiability.toLocaleString()} concession exposure</div>
              </div>

              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Low Stock Reserves</span>
                  <span class="sovereign-kpi-icon">⚠️</span>
                </div>
                <div class="sovereign-kpi-value" style="color: ${lowStockItems.length > 0 ? '#EF4444' : '#10B981'};">
                  ${lowStockItems.length}
                </div>
                <div class="sovereign-kpi-hint">${lowStockItems.length > 0 ? 'Extraits with &le; 5 flacons' : 'All flacons well-stocked'}</div>
              </div>
            </div>

            <!-- Order Status Breakdown Bar -->
            <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
              <h3 class="font-title" style="color: var(--gold-light); font-size: 1.15rem; margin-bottom: 1rem;">
                Consignment Pipeline Status Breakdown
              </h3>
              <div style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
                <div class="sovereign-counter-pill">
                  <span style="color: #FCD34D;">Pending:</span>
                  <span class="sovereign-counter-num">${pendingCount}</span>
                </div>
                <div class="sovereign-counter-pill">
                  <span style="color: #93C5FD;">Confirmed:</span>
                  <span class="sovereign-counter-num">${confirmedCount}</span>
                </div>
                <div class="sovereign-counter-pill">
                  <span style="color: #E9D5FF;">Packed:</span>
                  <span class="sovereign-counter-num">${packedCount}</span>
                </div>
                <div class="sovereign-counter-pill">
                  <span style="color: #BAE6FD;">Shipped:</span>
                  <span class="sovereign-counter-num">${shippedCount}</span>
                </div>
                <div class="sovereign-counter-pill">
                  <span style="color: #6EE7B7;">Delivered:</span>
                  <span class="sovereign-counter-num">${deliveredCount}</span>
                </div>
                <div class="sovereign-counter-pill">
                  <span style="color: #FCA5A5;">Cancelled / RTO:</span>
                  <span class="sovereign-counter-num">${cancelledCount}</span>
                </div>
              </div>
            </div>

            <!-- Low Stock Warnings Table if any -->
            ${lowStockItems.length > 0 ? `
              <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem; border-color: rgba(239, 68, 68, 0.4);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h3 class="font-title" style="color: #FCA5A5; font-size: 1.15rem; margin: 0;">
                    ⚠️ Immediate Stock Attention Required
                  </h3>
                  <button class="btn btn-gold" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;" onclick="app.setAdminTab('vault')">
                    Adjust in Fragrance Vault &rarr;
                  </button>
                </div>
                <div class="sovereign-table-wrap">
                  <table class="sovereign-table">
                    <thead>
                      <tr>
                        <th>Flacon</th>
                        <th>Extrait Name</th>
                        <th>Category</th>
                        <th>Remaining Stock</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${lowStockItems.map(p => `
                        <tr>
                          <td><img src="${p.image || 'assets/product/1kingscar.webp'}" class="sovereign-table-img" alt="${p.name}" /></td>
                          <td><strong style="color: var(--gold-light);">${p.name}</strong></td>
                          <td><span style="color: var(--text-muted); font-size: 0.78rem;">${p.collection || p.subtitle || 'Signature'}</span></td>
                          <td><strong style="color: #EF4444; font-size: 0.95rem;">${p.stock !== undefined ? p.stock : 50} left</strong></td>
                          <td>₹${Number(p.price || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- Quick Action Shortcuts -->
            <div class="liquid-glass-card" style="padding: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
              <div>
                <h4 style="color: var(--gold-light); margin: 0 0 0.3rem; font-size: 1rem;">Direct Cloud Catalog Seeder</h4>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Upload all 7 local extraits into the Firestore <code>products</code> collection.</p>
              </div>
              <button class="btn btn-gold" onclick="app.seedCatalogToFirestore()">
                Seed Local Catalog to Firestore
              </button>
            </div>
          </div>
        ` : ''}

        <!-- ====================================================================
             MODULE B: ORDER, PAYMENT & COD COMMAND
             ==================================================================== -->
        ${activeTab === 'orders' ? `
          <div class="sovereign-tab-content">
            <!-- Filter Bar -->
            <div class="sovereign-filter-bar">
              <input type="text" id="admin-order-search" class="sovereign-search-input" placeholder="Search by Order ID, Patron Name, Email, or WhatsApp..." oninput="app.filterAdminOrders()" />
              <select id="admin-order-status-filter" class="sovereign-select" onchange="app.filterAdminOrders()">
                <option value="All">Filter Status: All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="RTO">RTO</option>
              </select>
              <select id="admin-order-payment-filter" class="sovereign-select" onchange="app.filterAdminOrders()">
                <option value="All">Filter Payment: All</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Prepaid">Prepaid / Online</option>
                <option value="Paid">Status: Paid</option>
                <option value="PendingPay">Status: Unpaid / Pending COD</option>
              </select>
              <button class="btn btn-glass" onclick="app.refreshAdminDashboard()">
                ↻ Reload Orders
              </button>
            </div>

            <!-- Orders Cards List -->
            <div class="sovereign-orders-list" id="admin-orders-container">
              ${ordersList.length === 0 ? `
                <div class="liquid-glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
                  <h3 class="font-title" style="color: var(--gold-light);">No Consignments Recorded</h3>
                  <p style="font-size: 0.85rem;">Orders placed by patrons will stream into this real-time ledger automatically.</p>
                </div>
              ` : ordersList.map(order => {
                const orderId = order.orderId || order.id || 'MYTH-0000';
                const patronName = order.userName || order.customer?.name || order.shipping?.name || 'Patron';
                const patronEmail = order.userEmail || order.customer?.email || order.shipping?.email || 'N/A';
                const patronPhone = order.phone || order.customer?.phone || order.shipping?.phone || '';
                const shippingAddr = order.address || order.shippingAddress || order.shipping?.address || 'Standard Address';
                const items = Array.isArray(order.items) ? order.items : [];
                const currentStatus = order.status || 'Pending';
                const paymentMethod = (order.paymentMethod || 'Prepaid').toUpperCase();
                const paymentStatus = (order.paymentStatus || (paymentMethod === 'PREPAID' ? 'Paid' : 'Pending')).toLowerCase();
                const isPaid = paymentStatus === 'paid';
                const finalPayable = Number(order.finalPayable || order.total || order.subtotal || 0);
                const subtotal = Number(order.subtotal || order.cartTotal || finalPayable);
                const discount = Number(order.discount || 0);
                const mythosUsed = Number(order.mythosUsed || 0);
                const courier = order.courierName || '';
                const awb = order.trackingNumber || '';
                const orderDate = order.timestamp?.toMillis ? new Date(order.timestamp.toMillis()).toLocaleString('en-IN') : (order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleString('en-IN') : 'Recent');

                return `
                  <div class="sovereign-order-card" id="order-card-${orderId}" data-orderid="${orderId.toLowerCase()}" data-name="${patronName.toLowerCase()}" data-email="${patronEmail.toLowerCase()}" data-phone="${patronPhone}" data-status="${currentStatus}" data-method="${paymentMethod}" data-paid="${isPaid}">
                    <!-- Head -->
                    <div class="sovereign-order-head">
                      <div>
                        <div class="sovereign-order-id">Order #${orderId}</div>
                        <div class="sovereign-order-date">${orderDate} &bull; Consignment UID: ${order.userId || 'Guest'}</div>
                      </div>
                      <div class="sovereign-badges-wrap">
                        <span class="sovereign-pill status-${currentStatus.toLowerCase()}">${currentStatus}</span>
                        <span class="sovereign-pill payment-${paymentMethod.toLowerCase()}">${paymentMethod}</span>
                        <span class="sovereign-pill payment-${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Paid' : 'Pending Payment'}</span>
                        ${order.rewardsCredited ? `
                          <span class="sovereign-pill" style="background: rgba(212, 175, 55, 0.2); border: 1px solid var(--gold-primary); color: var(--gold-light);">🪙 Rewards Settled</span>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Body -->
                    <div class="sovereign-order-body">
                      <!-- Patron Coordinates -->
                      <div class="sovereign-subpanel">
                        <div class="sovereign-subpanel-title">Patron Coordinates</div>
                        <div style="font-weight: 700; color: var(--gold-light); font-size: 0.95rem; margin-bottom: 0.2rem;">${patronName}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">${patronEmail}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">WhatsApp / Tel: <strong style="color: var(--text-main);">${patronPhone || 'Not provided'}</strong></div>
                        <div style="font-size: 0.78rem; line-height: 1.4; color: var(--text-muted); background: rgba(0, 0, 0, 0.3); padding: 0.5rem; border-radius: 6px;">
                          📍 ${shippingAddr}
                        </div>
                      </div>

                      <!-- Itemized Bottles -->
                      <div class="sovereign-subpanel">
                        <div class="sovereign-subpanel-title">Itemized Extraits (${items.length} Bottles)</div>
                        ${items.map(item => `
                          <div class="sovereign-item-row">
                            <span>${item.name || item.id} <span style="color: var(--gold-primary);">(${item.size || 50}ml)</span> &times; ${item.quantity || 1}</span>
                            <span style="color: var(--gold-light);">₹${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</span>
                          </div>
                        `).join('')}
                      </div>

                      <!-- Financial Breakdown -->
                      <div class="sovereign-subpanel">
                        <div class="sovereign-subpanel-title">Financial Ledger</div>
                        <div class="sovereign-finance-row">
                          <span style="color: var(--text-muted);">Subtotal:</span>
                          <span>₹${subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        ${discount > 0 ? `
                          <div class="sovereign-finance-row" style="color: #10B981;">
                            <span>Discount / Key Voucher:</span>
                            <span>-₹${discount.toLocaleString('en-IN')}</span>
                          </div>
                        ` : ''}
                        ${mythosUsed > 0 ? `
                          <div class="sovereign-finance-row" style="color: var(--gold-light);">
                            <span>Mythos Coins Redeemed:</span>
                            <span>${mythosUsed} M</span>
                          </div>
                        ` : ''}
                        <div class="sovereign-finance-row total-row">
                          <span>Final Payable:</span>
                          <span class="gold-shimmer-text">₹${finalPayable.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Interactive Admin Controls & Actions -->
                    <div class="sovereign-order-actions">
                      <!-- Status Dropdown -->
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Status:</span>
                        <select id="status-${orderId}" class="sovereign-select" style="min-width: 140px; padding: 0.45rem 0.6rem; font-size: 0.8rem;" onchange="app.updateAdminOrderStatus('${orderId}', this.value)">
                          <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                          <option value="Confirmed" ${currentStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                          <option value="Packed" ${currentStatus === 'Packed' ? 'selected' : ''}>Packed</option>
                          <option value="Shipped" ${currentStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                          <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                          <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                          <option value="RTO" ${currentStatus === 'RTO' ? 'selected' : ''}>RTO</option>
                        </select>
                      </div>

                      <!-- Payment Status Toggle -->
                      <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.45rem 0.8rem; border-color: ${isPaid ? '#10B981' : '#F59E0B'}; color: ${isPaid ? '#6EE7B7' : '#FCD34D'};" onclick="app.toggleAdminPaymentStatus('${orderId}')">
                        ${isPaid ? '✓ Marked Paid (Click to Unpay)' : '⚠ Unpaid (Mark as Paid)'}
                      </button>

                      <!-- Courier & Tracking -->
                      <div style="display: flex; gap: 0.4rem; flex: 1; min-width: 280px;">
                        <input type="text" id="courier-${orderId}" class="sovereign-form-input" style="padding: 0.45rem 0.6rem; font-size: 0.8rem; flex: 1;" placeholder="Courier (e.g. BlueDart)" value="${courier}" />
                        <input type="text" id="tracking-${orderId}" class="sovereign-form-input" style="padding: 0.45rem 0.6rem; font-size: 0.8rem; flex: 1.2;" placeholder="AWB / Tracking #" value="${awb}" />
                        <button class="btn btn-gold" style="font-size: 0.72rem; padding: 0.45rem 0.8rem;" onclick="app.saveAdminOrderTracking('${orderId}')">
                          Save
                        </button>
                      </div>

                      <!-- 1-Click WhatsApp Buttons -->
                      <div style="display: flex; gap: 0.5rem;">
                        ${paymentMethod === 'COD' ? `
                          <button class="btn-whatsapp-verify" onclick="app.verifyCodWhatsApp('${orderId}')" title="Send WhatsApp COD Confirmation">
                            <span>💬</span> Verify COD
                          </button>
                        ` : ''}
                        <button class="btn-whatsapp-dispatch" onclick="app.sendDispatchWhatsApp('${orderId}')" title="Send WhatsApp Dispatch Notice">
                          <span>📦</span> Send Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ====================================================================
             MODULE C: FRAGRANCE VAULT & PRODUCT MANAGER
             ==================================================================== -->
        ${activeTab === 'vault' ? `
          <div class="sovereign-tab-content">
            <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h3 class="font-title" style="color: var(--gold-light); margin: 0 0 0.3rem;">Fragrance Vault Inventory</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Adjust bottle pricing, stock counts, batch codes, and formula notes in real-time.</p>
              </div>
              <div style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
                <button class="btn btn-glass" onclick="app.seedCatalogToFirestore()">
                  ↻ Sync Local Catalog to Firestore
                </button>
                <button class="btn btn-gold" onclick="app.openProductEditorModal()">
                  + Inscribe New Fragrance Extrait
                </button>
              </div>
            </div>

            <!-- Products Table -->
            <div class="liquid-glass-card" style="padding: 0; overflow-x: auto;">
              <table class="sovereign-table">
                <thead>
                  <tr>
                    <th>Flacon</th>
                    <th>Name & Concentration</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Stock Count</th>
                    <th>In Stock</th>
                    <th>Batch / Maceration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsList.map(prod => `
                    <tr>
                      <td>
                        <img src="${prod.image || 'assets/product/1kingscar.webp'}" class="sovereign-table-img" alt="${prod.name}" />
                      </td>
                      <td>
                        <strong style="color: var(--gold-light); font-size: 0.95rem;">${prod.name}</strong>
                        <div style="font-size: 0.75rem; color: var(--gold-primary);">${prod.concentration || 'Extrait de Parfum (40%)'}</div>
                      </td>
                      <td>
                        <span class="glass-pill" style="font-size: 0.7rem; color: var(--text-muted);">${prod.collection || prod.subtitle || 'Signature'}</span>
                      </td>
                      <td>
                        <input type="number" class="sovereign-inline-input" value="${prod.price || 0}" onchange="app.updateProductInline('${prod.id}', 'price', this.value)" />
                      </td>
                      <td>
                        <input type="number" class="sovereign-inline-input" value="${prod.stock !== undefined ? prod.stock : 50}" onchange="app.updateProductInline('${prod.id}', 'stock', this.value)" style="color: ${(prod.stock !== undefined ? prod.stock : 50) <= 5 ? '#EF4444' : 'var(--gold-light)'};" />
                      </td>
                      <td>
                        <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.25rem 0.6rem; border-color: ${prod.inStock !== false ? '#10B981' : '#EF4444'}; color: ${prod.inStock !== false ? '#6EE7B7' : '#FCA5A5'};" onclick="app.updateProductInline('${prod.id}', 'inStock', ${prod.inStock === false ? 'true' : 'false'})">
                          ${prod.inStock !== false ? 'In Stock' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${prod.batchCode || 'MYTH-2026-X'}</div>
                        <div style="font-size: 0.7rem; color: var(--gold-primary);">${prod.macerationDate || 'Jan 2026'}</div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 0.4rem;">
                          <button class="btn btn-glass" style="font-size: 0.72rem; padding: 0.35rem 0.6rem;" onclick="app.openProductEditorModal('${prod.id}')">
                            Edit
                          </button>
                          <button class="btn btn-glass" style="font-size: 0.72rem; padding: 0.35rem 0.6rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.deleteAdminProduct('${prod.id}')">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- ====================================================================
             MODULE D: POSTS, EDITORIAL & LORE MANAGER
             ==================================================================== -->
        ${activeTab === 'editorial' ? `
          <div class="sovereign-tab-content">
            <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h3 class="font-title" style="color: var(--gold-light); margin: 0 0 0.3rem;">House Chronicles & Scent Lore</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Inscribe olfactory stories, launch announcements, behind-the-alchemy lore, and press pieces.</p>
              </div>
              <button class="btn btn-gold" onclick="app.openPostEditorModal()">
                + Inscribe New Lore / Post
              </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
              ${postsList.length === 0 ? `
                <div class="liquid-glass-card" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">📜</div>
                  <h3 class="font-title" style="color: var(--gold-light);">No Lore Inscribed Yet</h3>
                  <p style="font-size: 0.85rem;">Click the button above to publish your first olfactory chronicle or launch post!</p>
                </div>
              ` : postsList.map(post => `
                <div class="liquid-glass-card" style="display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                  ${post.coverImage ? `
                    <div style="height: 180px; overflow: hidden; position: relative;">
                      <img src="${post.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="${post.title}" />
                      <span class="glass-pill" style="position: absolute; top: 12px; left: 12px; font-size: 0.65rem; color: var(--gold-light); background: rgba(0, 0, 0, 0.7);">
                        ${post.category || 'Olfactory Lore'}
                      </span>
                    </div>
                  ` : ''}
                  <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <h4 class="font-title" style="font-size: 1.2rem; color: var(--gold-light); margin: 0 0 0.4rem;">${post.title}</h4>
                      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 1rem;">
                        ${post.subtitle || (post.body ? post.body.slice(0, 100) + '...' : '')}
                      </p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1rem;">
                      <span class="sovereign-pill" style="background: ${post.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; border: 1px solid ${post.isPublished ? '#10B981' : '#F59E0B'}; color: ${post.isPublished ? '#6EE7B7' : '#FCD34D'};">
                        ${post.isPublished ? 'Published Live' : 'Draft'}
                      </span>
                      <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-glass" style="font-size: 0.72rem; padding: 0.35rem 0.65rem;" onclick="app.openPostEditorModal('${post.id}')">
                          Edit
                        </button>
                        <button class="btn btn-glass" style="font-size: 0.72rem; padding: 0.35rem 0.65rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.deleteAdminPost('${post.id}')">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ====================================================================
             MODULE E: PATRONS, MYTHOS COINS & TIER LEVELS
             ==================================================================== -->
        ${activeTab === 'patrons' ? `
          <div class="sovereign-tab-content">
            <div class="sovereign-filter-bar">
              <input type="text" id="admin-patron-search" class="sovereign-search-input" placeholder="Search patrons by name, email, WhatsApp, or UID..." oninput="app.filterAdminPatrons(this.value)" />
              <button class="btn btn-glass" onclick="app.refreshAdminDashboard()">
                ↻ Reload Patrons
              </button>
            </div>

            <!-- Patrons Table -->
            <div class="liquid-glass-card" style="padding: 0; overflow-x: auto;">
              <table class="sovereign-table">
                <thead>
                  <tr>
                    <th>Patron</th>
                    <th>Email & Phone</th>
                    <th>Role</th>
                    <th>Mythos Balance</th>
                    <th>Full Flacons</th>
                    <th>Standing Tier</th>
                    <th>Admin Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-patrons-table-body">
                  ${usersList.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                        No patron profiles registered in Firestore yet.
                      </td>
                    </tr>
                  ` : usersList.map(u => {
                    const prof = u.profile || {};
                    const loyalty = u.loyalty || {};
                    const name = prof.name || 'Patron';
                    const email = prof.email || 'N/A';
                    const phone = prof.phone || 'N/A';
                    const initial = name.charAt(0).toUpperCase();
                    const isAdmin = u.role === 'admin' || u.isAdmin === true;
                    const spendable = Number(loyalty.spendable_mythos || 0);
                    const bottles = Number(loyalty.full_bottles_purchased || 0);
                    const currentTierName = prof.tier || 'Level 1: The Observer';

                    return `
                      <tr class="admin-patron-row" data-name="${name.toLowerCase()}" data-email="${email.toLowerCase()}" data-phone="${phone}" data-uid="${u.uid}">
                        <td>
                          <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--gold-light);">
                              ${initial}
                            </div>
                            <div>
                              <strong style="color: var(--gold-light); font-size: 0.9rem;">${name}</strong>
                              <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">UID: ${u.uid ? u.uid.slice(0, 10) + '...' : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-size: 0.82rem; color: var(--text-main);">${email}</div>
                          <div style="font-size: 0.75rem; color: var(--text-muted);">${phone}</div>
                        </td>
                        <td>
                          <span class="sovereign-pill" style="${isAdmin ? 'background: rgba(212, 175, 55, 0.25); border: 1px solid var(--gold-primary); color: var(--gold-light);' : 'background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-muted);'}">
                            ${isAdmin ? '👑 Admin' : 'Patron'}
                          </span>
                        </td>
                        <td>
                          <strong class="gold-shimmer-text" style="font-size: 1rem;">${spendable.toLocaleString()} M</strong>
                          <div style="font-size: 0.7rem; color: var(--text-muted);">${loyalty.legacy_mythos || spendable} Legacy M</div>
                        </td>
                        <td>
                          <strong style="font-size: 0.95rem; color: var(--text-main);">${bottles}</strong>
                          <span style="font-size: 0.72rem; color: var(--text-muted);">flacons</span>
                        </td>
                        <td>
                          <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${currentTierName}</span>
                        </td>
                        <td>
                          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                            <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;" onclick="app.openAdjustMythosModal('${u.uid}', '${name.replace(/'/g, "\\'")}', ${spendable})">
                              &plusmn; Adjust M
                            </button>
                            <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.3rem 0.6rem;" onclick="app.openOverrideTierModal('${u.uid}', '${name.replace(/'/g, "\\'")}', ${bottles})">
                              Override Tier
                            </button>
                            <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.3rem 0.6rem; border-color: ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(212, 175, 55, 0.4)'};" onclick="app.togglePatronAdmin('${u.uid}', ${!isAdmin})">
                              ${isAdmin ? 'Demote' : 'Make Admin'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- ====================================================================
             MODULE F: ECONOMY, LEVELS & CHECKOUT SETTINGS
             ==================================================================== -->
        ${activeTab === 'economy' ? `
          <div class="sovereign-tab-content">
            <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
              <h3 class="font-title" style="color: var(--gold-light); margin: 0 0 0.3rem;">House Economy & Checkout Settings</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Configure loyalty cashback rates, coin redemptions, Cash on Delivery boundaries, and discount promo keys.</p>
            </div>

            <form onsubmit="app.saveGlobalSettings(event)">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- Mythos Coin Economy -->
                <div class="liquid-glass-card" style="padding: 1.5rem;">
                  <h4 class="font-title" style="color: var(--gold-light); margin-bottom: 1.2rem; font-size: 1.1rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.6rem;">
                    🪙 Mythos Coin Economy
                  </h4>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                      <label class="sovereign-field-label">Cashback Earn Rate (% Return on Paid Orders)</label>
                      <input type="number" id="setting-mythos-earn" class="sovereign-form-input" value="${globalSettings.mythosEarnPct !== undefined ? globalSettings.mythosEarnPct : 3}" min="1" max="25" required />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Default 3% base return for Level 1 patrons.</div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Coin Redemption Ratio (₹ Concession per 1 Mythos)</label>
                      <input type="number" id="setting-redemption-ratio" class="sovereign-form-input" value="${globalSettings.redemptionRatio !== undefined ? globalSettings.redemptionRatio : 1}" min="0.1" step="0.1" required />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">1 Mythos = ₹1 concession credit.</div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Max Cart Redemption Allowance (%)</label>
                      <input type="number" id="setting-max-redemption-pct" class="sovereign-form-input" value="${globalSettings.maxMythosRedemptionPct !== undefined ? globalSettings.maxMythosRedemptionPct : 30}" min="1" max="100" required />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Max percentage of cart subtotal payable via Mythos coins (Default: 30%).</div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">New Patron Registration Bonus (M Coins)</label>
                      <input type="number" id="setting-signup-bonus" class="sovereign-form-input" value="${globalSettings.signupBonusMythos !== undefined ? globalSettings.signupBonusMythos : 100}" min="0" required />
                    </div>
                  </div>
                </div>

                <!-- COD & Shipping Rules -->
                <div class="liquid-glass-card" style="padding: 1.5rem;">
                  <h4 class="font-title" style="color: var(--gold-light); margin-bottom: 1.2rem; font-size: 1.1rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.6rem;">
                    🚚 COD & Shipping Governance
                  </h4>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.8rem; background: rgba(0, 0, 0, 0.4); border-radius: 8px;">
                      <div>
                        <strong style="color: var(--gold-light); font-size: 0.88rem;">Enable Cash on Delivery (COD)</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">Allow patrons to pay upon flacon delivery.</div>
                      </div>
                      <input type="checkbox" id="setting-cod-enabled" style="width: 20px; height: 20px; accent-color: var(--gold-primary);" ${globalSettings.codEnabled !== false ? 'checked' : ''} />
                    </div>

                    <div>
                      <label class="sovereign-field-label">COD Convenience Fee (₹)</label>
                      <input type="number" id="setting-cod-fee" class="sovereign-form-input" value="${globalSettings.codFee || 0}" min="0" />
                    </div>

                    <div>
                      <label class="sovereign-field-label">Max Order Value Allowed for COD (₹)</label>
                      <input type="number" id="setting-max-cod-amount" class="sovereign-form-input" value="${globalSettings.maxCodAmount || 15000}" min="1000" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Orders above this limit mandate prepaid clearance.</div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Complimentary Shipping Threshold (₹)</label>
                      <input type="number" id="setting-free-ship-threshold" class="sovereign-form-input" value="${globalSettings.freeShippingThreshold || 3000}" min="0" />
                    </div>

                    <div>
                      <label class="sovereign-field-label">Standard Shipping Fee (₹)</label>
                      <input type="number" id="setting-standard-ship-fee" class="sovereign-form-input" value="${globalSettings.standardShippingFee !== undefined ? globalSettings.standardShippingFee : 150}" min="0" />
                    </div>
                  </div>
                </div>

                <!-- Razorpay & UPI Payment Gateway Configuration -->
                <div class="liquid-glass-card" style="padding: 1.5rem; grid-column: 1 / -1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h4 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.1rem;">
                      💳 Razorpay & UPI Payment Gateway
                    </h4>
                    <div>
                      ${(globalSettings.razorpayKeyId || '').trim() ? `
                        <span class="glass-pill" style="font-size: 0.72rem; color: #10B981; border-color: #10B981; background: rgba(16, 185, 129, 0.1);">
                          ● Gateway Active (${(globalSettings.razorpayKeyId || '').startsWith('rzp_test') ? 'Test Mode' : 'Live Mode'})
                        </span>
                      ` : `
                        <span class="glass-pill" style="font-size: 0.72rem; color: #F59E0B; border-color: #F59E0B; background: rgba(245, 158, 11, 0.1);">
                          ⚠️ Key Missing (Prepaid Orders Mocked / Fallback)
                        </span>
                      `}
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                      <label class="sovereign-field-label">Razorpay Key ID (API Key)</label>
                      <input type="text" id="setting-razorpay-key-id" class="sovereign-form-input" style="font-family: monospace;" placeholder="rzp_live_xxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxx" value="${globalSettings.razorpayKeyId || ''}" />
                      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Get your API Key from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" style="color: var(--gold-primary); text-decoration: underline;">Razorpay Dashboard → Settings → API Keys</a>. Paste it here to enable genuine UPI (GPay, PhonePe, Paytm, BHIM, QR), Debit/Credit Cards, and NetBanking on the checkout window.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Promo Codes & Vault Keys Manager -->
              <div class="liquid-glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 0.8rem;">
                  <div>
                    <h4 class="font-title" style="color: var(--gold-light); margin: 0 0 0.2rem; font-size: 1.1rem;">
                      🗝️ Promo Codes & Vault Keys
                    </h4>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">Active discount voucher keys accepted across checkout.</p>
                  </div>
                  <button type="button" class="btn btn-gold" style="font-size: 0.75rem; padding: 0.4rem 0.9rem;" onclick="app.openAddPromoModal()">
                    + Add Promo Key
                  </button>
                </div>

                <div class="sovereign-table-wrap">
                  <table class="sovereign-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Discount Value</th>
                        <th>Min. Order</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Array.isArray(globalSettings.promoCodes) && globalSettings.promoCodes.length > 0 ? globalSettings.promoCodes.map((pc, idx) => `
                        <tr>
                          <td><strong style="color: var(--gold-primary); font-family: monospace; font-size: 0.95rem;">${pc.code}</strong></td>
                          <td><span class="glass-pill" style="font-size: 0.7rem;">${pc.discountType === 'percent' ? 'Percentage %' : 'Flat ₹'}</span></td>
                          <td><strong style="color: var(--gold-light);">${pc.discountType === 'percent' ? `${pc.value}%` : `₹${pc.value}`}</strong></td>
                          <td>₹${pc.minOrder || 0}</td>
                          <td>
                            <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.2rem 0.6rem; border-color: ${pc.active !== false ? '#10B981' : '#EF4444'}; color: ${pc.active !== false ? '#6EE7B7' : '#FCA5A5'};" onclick="app.togglePromoCode(${idx})">
                              ${pc.active !== false ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td>
                            <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.2rem 0.6rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.deletePromoCode(${idx})">
                              Delete
                            </button>
                          </td>
                        </tr>
                      `).join('') : `
                        <tr>
                          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                            No custom promo keys configured. Click "+ Add Promo Key" above!
                          </td>
                        </tr>
                      `}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style="text-align: right;">
                <button type="submit" class="btn btn-gold" style="padding: 0.9rem 2.5rem; font-size: 0.95rem;">
                  Save Global Economy Configuration
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        <!-- Active Admin Modals Container -->
        <div id="sovereign-modal-container"></div>
      </div>
    `;
  },

  /* Product Modal (Create / Edit) */
  renderProductModal(prod = null) {
    const isEdit = Boolean(prod && prod.id);
    const p = prod || {
      id: '',
      name: '',
      tagline: '',
      collection: 'Signature Men',
      price: 4999,
      compareAtPrice: 5999,
      stock: 50,
      inStock: true,
      concentration: 'Extrait de Parfum (40% Concentration)',
      batchCode: 'MYTH-2026-X01',
      macerationDate: 'March 2026',
      image: 'assets/product/1kingscar.webp',
      description: '',
      notesTop: 'Bergamot, Pink Pepper',
      notesHeart: 'Lavender, Rose',
      notesBase: 'Vetiver, Amber, Musk',
      accords: 'Aromatic, Spicy, Woody'
    };

    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <h3 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.3rem;">
              ${isEdit ? `Edit Extrait: ${p.name}` : 'Inscribe New Fragrance Extrait'}
            </h3>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.2rem; color: var(--gold-light);">✕</button>
          </div>

          <form onsubmit="app.saveAdminProduct(event, '${isEdit ? p.id : ''}')">
            <div class="sovereign-form-grid">
              <div>
                <label class="sovereign-field-label">Flacon Slug / ID</label>
                <input type="text" id="prod-id" class="sovereign-form-input" value="${p.id}" ${isEdit ? 'readonly style="opacity: 0.6;"' : 'required'} placeholder="e.g. oud-noir" />
              </div>
              <div>
                <label class="sovereign-field-label">Extrait Name</label>
                <input type="text" id="prod-name" class="sovereign-form-input" value="${p.name}" required placeholder="e.g. Oud Noir Extrait de Parfum" />
              </div>
              <div>
                <label class="sovereign-field-label">Tagline</label>
                <input type="text" id="prod-tagline" class="sovereign-form-input" value="${p.tagline || ''}" placeholder="A commanding presence..." />
              </div>
              <div>
                <label class="sovereign-field-label">Collection / Category</label>
                <input type="text" id="prod-collection" class="sovereign-form-input" value="${p.collection || p.subtitle || 'Aromatic · Men'}" />
              </div>
              <div>
                <label class="sovereign-field-label">Price (₹)</label>
                <input type="number" id="prod-price" class="sovereign-form-input" value="${p.price || 4999}" min="0" required />
              </div>
              <div>
                <label class="sovereign-field-label">Stock Quantity</label>
                <input type="number" id="prod-stock" class="sovereign-form-input" value="${p.stock !== undefined ? p.stock : 50}" min="0" required />
              </div>
              <div>
                <label class="sovereign-field-label">Concentration</label>
                <input type="text" id="prod-concentration" class="sovereign-form-input" value="${p.concentration || 'Extrait de Parfum (40% Concentration)'}" />
              </div>
              <div>
                <label class="sovereign-field-label">Batch Code</label>
                <input type="text" id="prod-batch" class="sovereign-form-input" value="${p.batchCode || 'MYTH-2026-X01'}" />
              </div>
              <div>
                <label class="sovereign-field-label">Maceration Date</label>
                <input type="text" id="prod-maceration" class="sovereign-form-input" value="${p.macerationDate || 'March 2026'}" />
              </div>
              <div>
                <label class="sovereign-field-label">Bottle Image URL</label>
                <input type="text" id="prod-image" class="sovereign-form-input" value="${p.image || 'assets/product/1kingscar.webp'}" required />
              </div>
            </div>

            <!-- Notes & Accords -->
            <div style="margin-bottom: 1.5rem; background: rgba(0, 0, 0, 0.4); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);">
              <div style="font-size: 0.75rem; color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8rem; font-weight: 600;">Olfactory Pyramids & Accords</div>
              <div class="sovereign-form-grid" style="margin-bottom: 0;">
                <div>
                  <label class="sovereign-field-label">Top Notes (comma-separated)</label>
                  <input type="text" id="prod-notes-top" class="sovereign-form-input" value="${Array.isArray(p.notes?.top) ? p.notes.top.join(', ') : (p.notesTop || '')}" />
                </div>
                <div>
                  <label class="sovereign-field-label">Heart Notes (comma-separated)</label>
                  <input type="text" id="prod-notes-heart" class="sovereign-form-input" value="${Array.isArray(p.notes?.heart) ? p.notes.heart.join(', ') : (p.notesHeart || '')}" />
                </div>
                <div>
                  <label class="sovereign-field-label">Base Notes (comma-separated)</label>
                  <input type="text" id="prod-notes-base" class="sovereign-form-input" value="${Array.isArray(p.notes?.base) ? p.notes.base.join(', ') : (p.notesBase || '')}" />
                </div>
                <div>
                  <label class="sovereign-field-label">Accords (comma-separated)</label>
                  <input type="text" id="prod-accords" class="sovereign-form-input" value="${Array.isArray(p.accords) ? p.accords.join(', ') : (p.accords || '')}" />
                </div>
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Poetic Lore / Description</label>
              <textarea id="prod-description" class="sovereign-form-textarea" placeholder="Detailed description of the fragrance...">${p.description || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" style="padding: 0.7rem 2rem;">Save Extrait to Vault</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /* Post/Lore Modal (Create / Edit) */
  renderPostModal(post = null) {
    const isEdit = Boolean(post && post.id);
    const p = post || {
      id: '',
      title: '',
      subtitle: '',
      category: 'Olfactory Lore',
      coverImage: 'assets/hero/kingscarbg.webp',
      body: '',
      linkedProductId: '',
      isPublished: true
    };

    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <h3 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.3rem;">
              ${isEdit ? 'Edit Lore Entry' : 'Inscribe New Chronicle & Lore'}
            </h3>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.2rem; color: var(--gold-light);">✕</button>
          </div>

          <form onsubmit="app.saveAdminPost(event, '${isEdit ? p.id : ''}')">
            <div class="sovereign-form-grid">
              <div style="grid-column: 1 / -1;">
                <label class="sovereign-field-label">Post Title</label>
                <input type="text" id="post-title" class="sovereign-form-input" value="${p.title}" required placeholder="The Alchemy of King Scar..." />
              </div>
              <div style="grid-column: 1 / -1;">
                <label class="sovereign-field-label">Subtitle / Excerpt</label>
                <input type="text" id="post-subtitle" class="sovereign-form-input" value="${p.subtitle || ''}" placeholder="A reflection on maceration in Mayfair..." />
              </div>
              <div>
                <label class="sovereign-field-label">Category</label>
                <select id="post-category" class="sovereign-select" style="width: 100%;">
                  <option value="Olfactory Lore" ${p.category === 'Olfactory Lore' ? 'selected' : ''}>Olfactory Lore</option>
                  <option value="New Drop" ${p.category === 'New Drop' ? 'selected' : ''}>New Drop</option>
                  <option value="Behind the Alchemy" ${p.category === 'Behind the Alchemy' ? 'selected' : ''}>Behind the Alchemy</option>
                  <option value="Press & Society" ${p.category === 'Press & Society' ? 'selected' : ''}>Press & Society</option>
                </select>
              </div>
              <div>
                <label class="sovereign-field-label">Linked Extrait Flacon (Optional)</label>
                <select id="post-linked-product" class="sovereign-select" style="width: 100%;">
                  <option value="">None</option>
                  <option value="king-scar" ${p.linkedProductId === 'king-scar' ? 'selected' : ''}>King Scar</option>
                  <option value="petralux" ${p.linkedProductId === 'petralux' ? 'selected' : ''}>Petralux</option>
                  <option value="oud-rion" ${p.linkedProductId === 'oud-rion' ? 'selected' : ''}>Oud Rion</option>
                  <option value="spark" ${p.linkedProductId === 'spark' ? 'selected' : ''}>Spark</option>
                  <option value="wood-sera" ${p.linkedProductId === 'wood-sera' ? 'selected' : ''}>Wood Sera</option>
                  <option value="ash" ${p.linkedProductId === 'ash' ? 'selected' : ''}>Ash</option>
                </select>
              </div>
              <div style="grid-column: 1 / -1;">
                <label class="sovereign-field-label">Cover Artwork / Image URL</label>
                <input type="text" id="post-cover" class="sovereign-form-input" value="${p.coverImage || ''}" placeholder="assets/hero/kingscarbg.webp" />
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Chronicle Body Content</label>
              <textarea id="post-body" class="sovereign-form-textarea" style="min-height: 180px;" required placeholder="Write the story, formula notes, or announcement here...">${p.body || ''}</textarea>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; background: rgba(0, 0, 0, 0.4); padding: 0.8rem 1rem; border-radius: 8px;">
              <div>
                <strong style="color: var(--gold-light); font-size: 0.85rem;">Publish Live to Storefront</strong>
                <div style="font-size: 0.72rem; color: var(--text-muted);">When active, patrons will discover this entry in House Lore.</div>
              </div>
              <input type="checkbox" id="post-published" style="width: 20px; height: 20px; accent-color: var(--gold-primary);" ${p.isPublished !== false ? 'checked' : ''} />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" style="padding: 0.7rem 2rem;">Inscribe Lore Entry</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /* Adjust Mythos Modal */
  renderAdjustMythosModal(uid, patronName, currentBalance) {
    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box" style="max-width: 520px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <h3 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.2rem;">
              Adjust Mythos Coins: ${patronName}
            </h3>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.2rem; color: var(--gold-light);">✕</button>
          </div>

          <div style="background: rgba(212, 175, 55, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1.2rem; border: 1px solid rgba(212, 175, 55, 0.25);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Current Balance</div>
            <div class="gold-shimmer-text" style="font-size: 1.8rem; font-family: var(--font-serif-title);">${currentBalance.toLocaleString()} M</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Patron UID: ${uid}</div>
          </div>

          <form onsubmit="app.submitAdjustMythos(event, '${uid}')">
            <div style="margin-bottom: 1rem;">
              <label class="sovereign-field-label">Coin Adjustment (+ to Grant, - to Deduct)</label>
              <input type="number" id="adjust-mythos-delta" class="sovereign-form-input" placeholder="e.g. +500 or -200" required />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Audit Reason / Justification</label>
              <input type="text" id="adjust-mythos-reason" class="sovereign-form-input" placeholder="e.g. VIP Concierge Courtesy, Discovery set credit" required />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" style="padding: 0.7rem 1.8rem;">Confirm Adjustment</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /* Override Tier Modal */
  renderOverrideTierModal(uid, patronName, currentBottles) {
    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box" style="max-width: 520px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <h3 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.2rem;">
              Override Standing: ${patronName}
            </h3>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.2rem; color: var(--gold-light);">✕</button>
          </div>

          <form onsubmit="app.submitOverrideTier(event, '${uid}')">
            <div style="margin-bottom: 1rem;">
              <label class="sovereign-field-label">Full Flacons Owned Count</label>
              <input type="number" id="override-bottles-input" class="sovereign-form-input" value="${currentBottles}" min="0" required />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Promote to Circle of Legends Standing Tier</label>
              <select id="override-tier-select" class="sovereign-select" style="width: 100%;">
                <option value="1">Level 1: The Observer (Initiate)</option>
                <option value="2">Level 2: The Curator (1+ Bottles, 2x Return)</option>
                <option value="3">Level 3: The Collector (3+ Bottles, 3x Return)</option>
                <option value="4">Level 4: The Archivist (6+ Bottles, 4x Return)</option>
                <option value="5">Level 5: The Patron (12+ Bottles, 5x Return)</option>
              </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" style="padding: 0.7rem 1.8rem;">Apply Override</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  /* Add Promo Key Modal */
  renderAddPromoModal() {
    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box" style="max-width: 520px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <h3 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.2rem;">
              Mint New Promo Code / Vault Key
            </h3>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.2rem; color: var(--gold-light);">✕</button>
          </div>

          <form onsubmit="app.submitAddPromoCode(event)">
            <div style="margin-bottom: 1rem;">
              <label class="sovereign-field-label">Promo Code Key</label>
              <input type="text" id="new-promo-code" class="sovereign-form-input" style="text-transform: uppercase;" placeholder="e.g. MAYFAIR20" required />
            </div>

            <div class="sovereign-form-grid" style="margin-bottom: 1rem;">
              <div>
                <label class="sovereign-field-label">Discount Type</label>
                <select id="new-promo-type" class="sovereign-select" style="width: 100%;">
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Concession (₹)</option>
                </select>
              </div>
              <div>
                <label class="sovereign-field-label">Discount Value</label>
                <input type="number" id="new-promo-value" class="sovereign-form-input" placeholder="e.g. 15 or 500" required />
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Minimum Order Requirement (₹)</label>
              <input type="number" id="new-promo-minorder" class="sovereign-form-input" placeholder="e.g. 1999" value="0" min="0" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" style="padding: 0.7rem 1.8rem;">Mint & Activate Key</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.AdminComponents = AdminComponents;
}
