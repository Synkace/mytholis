/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - SOVEREIGN COMMAND ADMIN PANEL COMPONENTS
   Haute Parfumerie Dark Emerald & Liquid Gold 6-Module Operations Desk
   ========================================================================== */

export const AdminComponents = {
  renderAdmin() {
    const currentUser = (typeof firebaseService !== 'undefined' && firebaseService?.currentUser) || store.firebaseUser;
    const userEmail = (currentUser?.email || store.user?.email || '').trim().toLowerCase();
    const adminEmails = (store.globalSettings && Array.isArray(store.globalSettings.adminEmails)) 
      ? store.globalSettings.adminEmails 
      : ['gunhegarr@gmail.com', 'admin@mytholis.com', 'alexander@mytholis.com', 'founder@mytholis.com'];
    const isAuthorized = store.isAdmin() || (userEmail && adminEmails.some(e => e.toLowerCase().trim() === userEmail));

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
                  Collector Email Sign In
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
          <button class="sovereign-tab ${activeTab === 'patrons' || activeTab === 'collectors' ? 'active' : ''}" onclick="app.setAdminTab('patrons')">
            👑 Collector Registry (${usersList.length})
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
                          <td><img src="${p.image || 'assets/product/1kingscar.webp'}" class="sovereign-table-img" alt="${(p.name || '').replace(/<[^>]*>/g, ' ').replace(/"/g, '&quot;').trim()}" /></td>
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
              <input type="text" id="admin-order-search" class="sovereign-search-input" placeholder="Search by Order ID, Collector Name, Email, or WhatsApp..." oninput="app.filterAdminOrders()" />
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
              <button class="btn btn-gold" style="font-size: 0.78rem; padding: 0.5rem 1rem; display: inline-flex; align-items: center; gap: 0.4rem;" onclick="app.openShippingLabelStudio()">
                🏷️ Shipping Label Studio
              </button>
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
                  <p style="font-size: 0.85rem;">Orders placed by collectors will stream into this real-time ledger automatically.</p>
                </div>
              ` : ordersList.map(order => {
                const orderId = order.orderId || order.id || 'MYTH-0000';
                const patronName = order.userName || order.customer?.name || order.shipping?.name || 'Collector';
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
                      <!-- Collector Coordinates -->
                      <div class="sovereign-subpanel">
                        <div class="sovereign-subpanel-title">Collector Coordinates</div>
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
                      <button class="btn btn-glass" style="font-size: 0.75rem; padding: 0.45rem 0.8rem; border-color: ${isPaid ? '#10B981' : '#F59E0B'}; color: ${isPaid ? '#6EE7B7' : '#FCD34D'};" onclick="app.toggleAdminPaymentStatus('${orderId}', '${isPaid ? 'Paid' : 'Pending'}')">
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

                      <!-- 1-Click Actions: Shipping Label & WhatsApp -->
                      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-gold" style="font-size: 0.72rem; padding: 0.45rem 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem; background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%); color: #041812; font-weight: 700;" onclick="app.printShippingLabelForOrder('${orderId}')" title="Generate & Print 4x6 Thermal Shipping Label">
                          🏷️ Print Shipping Label
                        </button>
                        ${paymentMethod === 'COD' ? `
                          <button class="btn-whatsapp-verify" onclick="app.verifyCodWhatsApp('${orderId}', '${patronPhone}', ${finalPayable})" title="Send WhatsApp COD Confirmation">
                            <span>💬</span> Verify COD
                          </button>
                        ` : ''}
                        <button class="btn-whatsapp-dispatch" onclick="app.sendDispatchWhatsApp('${orderId}', '${patronPhone}')" title="Send WhatsApp Dispatch Notice">
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
                    <th style="min-width: 210px;">Flacon Editions & Sizes (50ml · 100ml)</th>
                    <th>Base Price (₹)</th>
                    <th>Stock Count</th>
                    <th>In Stock</th>
                    <th>Batch / Maceration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsList.map(prod => {
                    const catalogMatch = (typeof MYTHOLIS_CATALOG !== 'undefined' ? MYTHOLIS_CATALOG : []).find(c => c.id === prod.id);
                    const isCoffret = prod.id === 'mytholis-discovery-set' || (prod.collection && prod.collection.toLowerCase().includes('sixth sense')) || (prod.name && prod.name.toLowerCase().includes('sixth sense'));
                    const rawSizes = (Array.isArray(prod.sizes) && prod.sizes.length > 0)
                      ? prod.sizes
                      : (catalogMatch && Array.isArray(catalogMatch.sizes) ? catalogMatch.sizes : [
                          { ml: 50, price: 3999 },
                          { ml: 100, price: prod.price || 5999 }
                        ]);
                    const prodSizes = isCoffret 
                      ? [{ ml: 48, price: prod.price || 3999 }] 
                      : rawSizes.filter(s => s.ml !== 8 && s.ml !== 48 && s.ml !== 60);

                    return `
                    <tr>
                      <td>
                        <img src="${prod.image || 'assets/product/1kingscar.webp'}" class="sovereign-table-img" alt="${(prod.name || '').replace(/<[^>]*>/g, ' ').replace(/"/g, '&quot;').trim()}" />
                      </td>
                      <td>
                        <strong style="color: var(--gold-light); font-size: 0.95rem;">${isCoffret ? 'Sixth Sense' : prod.name}</strong>
                        <div style="font-size: 0.75rem; color: var(--gold-primary);">${isCoffret ? 'Extrait de Parfum (6 × 8ml Deluxe Vials)' : (prod.concentration || 'Extrait de Parfum (40%)')}</div>
                      </td>
                      <td>
                        <span class="glass-pill" style="font-size: 0.7rem; color: var(--text-muted);">${prod.collection || prod.subtitle || 'Signature'}</span>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 0.35rem; min-width: 200px;">
                          ${prodSizes.map(s => `
                            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.35); padding: 0.22rem 0.5rem; border-radius: 6px; border: 1px solid ${s.ml === 100 || isCoffret ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.12)'};">
                              <span style="font-size: 0.72rem; font-weight: 700; color: ${s.ml === 100 || isCoffret ? 'var(--gold-light)' : 'var(--text-main)'};">
                                ${isCoffret || s.ml === 48 || s.ml === 60 ? '6 × 8ml (48ml)' : `${s.ml}ml`}
                              </span>
                              <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span style="font-size: 0.7rem; color: var(--text-muted);">₹</span>
                                <input type="number" class="sovereign-inline-input" style="width: 78px; padding: 0.18rem 0.35rem; font-size: 0.78rem; text-align: right;" 
                                       value="${s.price || 0}" 
                                       title="Edit ${s.ml}ml price for ${(prod.name || '').replace(/<[^>]*>/g, ' ').replace(/"/g, '&quot;').trim()}"
                                       onchange="app.updateProductSizePrice('${prod.id}', ${isCoffret ? 48 : s.ml}, this.value)" />
                              </div>
                            </div>
                          `).join('')}
                        </div>
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
                    `;
                  }).join('')}
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
             MODULE E: COLLECTORS, MYTHOS COINS & TIER LEVELS
             ==================================================================== -->
        ${activeTab === 'patrons' || activeTab === 'collectors' ? `
          <div class="sovereign-tab-content">
            <!-- Collector Intelligence KPI Strip -->
            <div class="sovereign-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 1.5rem;">
              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Total Collectors & Customers</span>
                  <span class="sovereign-kpi-icon">👑</span>
                </div>
                <div class="sovereign-kpi-value gold-shimmer-text">${usersList.length}</div>
                <div class="sovereign-kpi-hint">Registered Profiles + Order Collectors</div>
              </div>
              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Verified Contact Phones</span>
                  <span class="sovereign-kpi-icon">📱</span>
                </div>
                <div class="sovereign-kpi-value" style="color: #25D366;">${usersList.filter(u => Boolean(u.phone || u.profile?.phone)).length}</div>
                <div class="sovereign-kpi-hint">Direct WhatsApp Reachable</div>
              </div>
              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Delivery Coordinates Saved</span>
                  <span class="sovereign-kpi-icon">📍</span>
                </div>
                <div class="sovereign-kpi-value" style="color: var(--gold-light);">${usersList.filter(u => Boolean(u.fullAddress || u.address || u.profile?.address)).length}</div>
                <div class="sovereign-kpi-hint">Full Shipping Address on File</div>
              </div>
              <div class="sovereign-kpi-card">
                <div class="sovereign-kpi-header">
                  <span class="sovereign-kpi-title">Collector Lifetime Spend (LTV)</span>
                  <span class="sovereign-kpi-icon">💰</span>
                </div>
                <div class="sovereign-kpi-value gold-shimmer-text">₹${Math.round(usersList.reduce((s, u) => s + Number(u.lifetimeSpend || 0), 0)).toLocaleString('en-IN')}</div>
                <div class="sovereign-kpi-hint">Total Gross Collector Commerce</div>
              </div>
            </div>

            <!-- Filter & Search Bar -->
            <div class="sovereign-filter-bar" style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
              <input type="text" id="admin-patron-search" class="sovereign-search-input" style="flex: 2; min-width: 260px;" placeholder="Search collectors by Name, Email, Phone / WhatsApp, Address, City, State, or UID..." oninput="app.filterAdminPatrons()" />
              <select id="admin-patron-filter-type" class="sovereign-select" onchange="app.filterAdminPatrons()" style="flex: 1; min-width: 170px;">
                <option value="ALL">Filter: All Collectors (${usersList.length})</option>
                <option value="HAS_PHONE">Has Phone / WhatsApp</option>
                <option value="HAS_ADDRESS">Has Delivery Address</option>
                <option value="HAS_ORDERS">Has Placed Orders</option>
                <option value="ADMINS">Admins Only</option>
              </select>
              <button class="btn btn-glass" onclick="app.refreshAdminDashboard()">
                ↻ Synchronize Collectors
              </button>
            </div>

            <!-- Collectors Table -->
            <div class="liquid-glass-card" style="padding: 0; overflow-x: auto;">
              <table class="sovereign-table">
                <thead>
                  <tr>
                    <th style="min-width: 180px;">Collector & Identity</th>
                    <th style="min-width: 190px;">Contact & WhatsApp</th>
                    <th style="min-width: 250px;">Shipping & Delivery Address</th>
                    <th style="min-width: 130px;">Orders & LTV</th>
                    <th style="min-width: 130px;">Standing & Tier</th>
                    <th style="min-width: 120px;">Mythos Balance</th>
                    <th style="min-width: 200px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-patrons-table-body">
                  ${usersList.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                        No collector profiles registered in Firestore yet.
                      </td>
                    </tr>
                  ` : usersList.map(u => {
                    const prof = u.profile || {};
                    const loyalty = u.loyalty || {};
                    const name = prof.name || u.name || 'Collector';
                    const email = prof.email || u.email || 'N/A';
                    const rawPhone = prof.phone || u.phone || '';
                    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');
                    const displayPhone = cleanPhone ? (cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`) : (rawPhone || '');
                    const initial = name.charAt(0).toUpperCase();
                    const isAdmin = u.role === 'admin' || u.isAdmin === true || prof.role === 'admin' || prof.isAdmin === true;
                    const spendable = Number(loyalty.spendable_mythos || 0);
                    const bottles = Number(loyalty.full_bottles_purchased || u.fullFlaconsOrdered || 0);
                    const legacy = Number(loyalty.legacy_mythos || spendable || 0);
                    const ordersCount = Number(u.ordersCount !== undefined ? u.ordersCount : (Array.isArray(u.orders) ? u.orders.length : 0));
                    const lifetimeSpend = Number(u.lifetimeSpend || 0);
                    const lastOrder = u.lastOrder || (Array.isArray(u.orders) && u.orders[0]) || null;
                    const lastOrderId = lastOrder ? (lastOrder.orderId || lastOrder.id || '') : '';

                    const rawAddr = u.fullAddress || prof.fullAddress || u.address || prof.address || '';
                    const city = u.city || prof.city || '';
                    const state = u.state || prof.state || '';
                    const pincode = u.pincode || prof.pincode || '';
                    const hasAddr = Boolean(rawAddr || city || state || pincode);
                    const cityStatePin = [city, state, pincode ? `(${pincode})` : ''].filter(Boolean).join(', ');
                    const copyAddrText = [name, displayPhone, rawAddr, city, state, pincode].filter(Boolean).join(', ').replace(/'/g, "\\'");

                    // Dynamically resolve tier from manual_tier_override or milestones
                    const tiers = (typeof store !== 'undefined' && store.LOYALTY_TIERS) || (typeof window !== 'undefined' && window.LOYALTY_TIERS) || [];
                    let tierObj = null;
                    if (loyalty.manual_tier_override) {
                      tierObj = tiers.find(t => t.level === Number(loyalty.manual_tier_override));
                    }
                    if (!tierObj) {
                      for (let i = tiers.length - 1; i >= 0; i--) {
                        const t = tiers[i];
                        if (legacy >= t.minLegacy && bottles >= t.minBottles) {
                          tierObj = t;
                          break;
                        }
                      }
                    }
                    if (!tierObj && tiers.length > 0) tierObj = tiers[0];
                    const currentTierName = (tierObj ? `Level ${tierObj.level}: ${tierObj.name}` : null) || prof.tier || 'Level 1: The Observer';
                    const currentTierLevel = tierObj ? tierObj.level : 1;

                    return `
                      <tr class="admin-patron-row" 
                          data-name="${name.toLowerCase()}" 
                          data-email="${email.toLowerCase()}" 
                          data-phone="${cleanPhone}" 
                          data-address="${rawAddr.toLowerCase()}" 
                          data-city="${city.toLowerCase()}" 
                          data-state="${state.toLowerCase()}" 
                          data-pincode="${pincode}" 
                          data-uid="${u.uid || ''}"
                          data-hasphone="${Boolean(cleanPhone)}"
                          data-hasaddress="${hasAddr}"
                          data-hasorders="${ordersCount > 0}"
                          data-isadmin="${isAdmin}">
                        <td>
                          <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--gold-light); font-size: 0.95rem;">
                              ${initial}
                            </div>
                            <div>
                              <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                                <strong style="color: var(--gold-light); font-size: 0.92rem;">${name}</strong>
                                ${isAdmin ? '<span class="sovereign-pill" style="font-size: 0.65rem; padding: 1px 5px; background: rgba(212, 175, 55, 0.2); border: 1px solid var(--gold-primary); color: var(--gold-light);">👑 Admin</span>' : ''}
                                ${u.isGuestOrder ? '<span class="glass-pill" style="font-size: 0.65rem; color: #6EE7B7; padding: 1px 5px;">Consignment</span>' : ''}
                              </div>
                              <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                                <span>UID: ${u.uid ? u.uid.slice(0, 10) + '...' : 'Guest'}</span>
                                ${u.uid ? `<button type="button" class="btn btn-glass" style="font-size: 0.6rem; padding: 0 4px; line-height: 1.2;" onclick="navigator.clipboard.writeText('${u.uid}'); app.showToast('Copied UID');" title="Copy UID">📋</button>` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="margin-bottom: 0.2rem;">
                            ${displayPhone ? `
                              <strong style="color: var(--text-main); font-size: 0.85rem; letter-spacing: 0.02em;">${displayPhone}</strong>
                              <div style="display: flex; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap;">
                                <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${name}, greetings from House of Mytholis!`)}" target="_blank" class="sovereign-pill" style="background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.4); color: #25D366; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; padding: 2px 7px;">
                                  <span>💬</span> WhatsApp
                                </a>
                                <a href="tel:+91${cleanPhone}" class="sovereign-pill" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; font-size: 0.72rem; padding: 2px 6px;">
                                  <span>📞</span> Call
                                </a>
                              </div>
                            ` : `
                              <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No Phone Provided</span>
                            `}
                          </div>
                          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                            ${email && email !== 'N/A' ? `<a href="mailto:${email}" style="color: var(--text-muted); text-decoration: none;">${email}</a>` : 'No Email'}
                          </div>
                        </td>
                        <td>
                          ${hasAddr ? `
                            <div style="font-size: 0.8rem; line-height: 1.4; color: var(--text-main); max-width: 280px; word-break: break-word;">
                              ${rawAddr}
                            </div>
                            ${cityStatePin ? `
                              <div style="font-size: 0.73rem; color: var(--gold-light); margin-top: 0.25rem; display: flex; align-items: center; gap: 4px;">
                                <span>📍</span> ${cityStatePin}
                              </div>
                            ` : ''}
                            <button type="button" class="btn btn-glass" style="font-size: 0.65rem; padding: 1px 6px; margin-top: 0.35rem; display: inline-flex; align-items: center; gap: 3px;" onclick="navigator.clipboard.writeText('${copyAddrText}'); app.showToast('Copied full shipping address');">
                              📋 Copy Address
                            </button>
                          ` : `
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No shipping address on file</span>
                          `}
                        </td>
                        <td>
                          <div style="font-weight: 700; color: var(--gold-light); font-size: 0.92rem;">
                            ₹${lifetimeSpend.toLocaleString('en-IN')}
                          </div>
                          <div style="font-size: 0.75rem; color: var(--text-main); margin-top: 2px;">
                            ${ordersCount} ${ordersCount === 1 ? 'order' : 'orders'}
                          </div>
                          ${lastOrderId ? `
                            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">
                              Last: #${lastOrderId}
                            </div>
                          ` : ''}
                        </td>
                        <td>
                          <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${currentTierName}</span>
                          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
                            <strong style="color: var(--text-main);">${bottles}</strong> flacons
                          </div>
                        </td>
                        <td>
                          <strong class="gold-shimmer-text" style="font-size: 0.95rem;">${spendable.toLocaleString()} M</strong>
                          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">${loyalty.legacy_mythos || spendable} Legacy M</div>
                        </td>
                        <td>
                          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                            <button class="btn btn-gold" style="font-size: 0.7rem; padding: 0.25rem 0.55rem;" onclick="app.openPatronDossier('${u.uid}')" title="View Full Collector Coordinates & Consignment Ledger">
                              🔍 Dossier
                            </button>
                            <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.25rem 0.55rem;" onclick="app.openAdjustMythosModal('${u.uid}', '${name.replace(/'/g, "\\'")}', ${spendable})">
                              &plusmn; Adjust M
                            </button>
                            <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.25rem 0.55rem;" onclick="app.openOverrideTierModal('${u.uid}', '${name.replace(/'/g, "\\'")}', ${bottles}, ${currentTierLevel})">
                              Tier
                            </button>
                            ${!u.isGuestOrder ? `
                              <button class="btn btn-glass" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; border-color: ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(212, 175, 55, 0.4)'};" onclick="app.togglePatronAdmin('${u.uid}', ${!isAdmin})">
                                ${isAdmin ? 'Demote' : 'Admin'}
                              </button>
                            ` : ''}
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
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Default 3% base return for Level 1 collectors.</div>
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
                      <label class="sovereign-field-label">New Collector Registration Bonus (M Coins)</label>
                      <input type="number" id="setting-signup-bonus" class="sovereign-form-input" value="${globalSettings.signupBonusMythos !== undefined ? globalSettings.signupBonusMythos : 200}" min="0" required />
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
                        <div style="font-size: 0.72rem; color: var(--text-muted);">Allow collectors to pay upon flacon delivery.</div>
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

                <!-- Razorpay Standard & UPI Payment Gateway Configuration -->
                ${(() => {
                  const activeKey = (globalSettings.razorpayKeyId || '').trim() || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAZORPAY_KEY_ID) || '';
                  const activeSecret = (globalSettings.razorpayKeySecret || '').trim() || '';
                  return `
                <div class="liquid-glass-card" style="padding: 1.5rem; grid-column: 1 / -1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem;">
                    <h4 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                      <span>💳</span> Razorpay Instant &amp; UPI Payment Gateway
                    </h4>
                    <div>
                      ${activeKey ? `
                        <span class="glass-pill" style="font-size: 0.72rem; color: #10B981; border-color: #10B981; background: rgba(16, 185, 129, 0.1);">
                          ● Razorpay Gateway Active (${activeKey.startsWith('rzp_live') ? 'Production Live' : 'Test Mode'})
                        </span>
                      ` : `
                        <span class="glass-pill" style="font-size: 0.72rem; color: #F59E0B; border-color: #F59E0B; background: rgba(245, 158, 11, 0.1);">
                          ⚠️ Razorpay Key Pending
                        </span>
                      `}
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
                    <div>
                      <label class="sovereign-field-label">Razorpay Key ID</label>
                      <input type="text" id="setting-razorpay-key-id" class="sovereign-form-input" style="font-family: monospace;" placeholder="rzp_test_... or rzp_live_..." value="${activeKey}" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Found in Razorpay Dashboard &gt; Settings &gt; API Keys.
                      </div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Razorpay Key Secret</label>
                      <div style="display: flex; gap: 0.5rem;">
                        <input type="password" id="setting-razorpay-key-secret" class="sovereign-form-input" style="font-family: monospace; flex: 1;" placeholder="Enter Razorpay Key Secret" value="${activeSecret}" />
                        <button type="button" class="btn btn-glass" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="
                          const secretInput = document.getElementById('setting-razorpay-key-secret');
                          if (secretInput) {
                            secretInput.type = secretInput.type === 'password' ? 'text' : 'password';
                            this.textContent = secretInput.type === 'password' ? 'Reveal' : 'Hide';
                          }
                        ">Reveal</button>
                      </div>
                      <div style="font-size: 0.72rem; color: ${activeSecret ? 'var(--text-muted)' : '#F59E0B'}; margin-top: 0.35rem;">
                        ${activeSecret ? 'Secret is securely configured for server-side HMAC validation.' : '⚠️ Action: Enter your Key Secret to enable server-side signature validation.'}
                      </div>
                    </div>
                  </div>

                  <div style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(212, 175, 55, 0.05); border: 1px dashed rgba(212, 175, 55, 0.2); border-radius: 6px; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
                    🔒 <strong>Razorpay Standard Checkout:</strong> Provides a 256-bit SSL encrypted popup supporting UPI (GPay, PhonePe, Paytm, QR scan), Credit &amp; Debit Cards, NetBanking across all Indian banks, and Wallets.
                  </div>
                </div>
                  `;
                })()}

                <!-- Marketing, Ad Tracking & Concierge Communications -->
                <div class="liquid-glass-card" style="padding: 1.5rem; grid-column: 1 / -1; margin-top: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 0.6rem;">
                    <h4 class="font-title" style="color: var(--gold-light); margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                      <span>🎯</span> Ad Attribution, Pixel &amp; Concierge Contacts
                    </h4>
                    <span class="glass-pill" style="font-size: 0.72rem; color: var(--gold-light);">Dynamic Global Configuration</span>
                  </div>

                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.2rem;">
                    <div>
                      <label class="sovereign-field-label">Meta Pixel ID (Facebook / Instagram Ads)</label>
                      <input type="text" id="setting-meta-pixel-id" class="sovereign-form-input" style="font-family: monospace;" placeholder="e.g. 123456789012345" value="${globalSettings.metaPixelId || ''}" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Automatically fires PageView, AddToCart, InitiateCheckout &amp; Purchase events.
                      </div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Concierge WhatsApp Number</label>
                      <input type="text" id="setting-support-phone" class="sovereign-form-input" style="font-family: monospace;" placeholder="+91 777000 9170" value="${globalSettings.supportPhone || '+91 777000 9170'}" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Updates all WhatsApp Concierge direct links across the storefront and orders.
                      </div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Concierge Support Email</label>
                      <input type="email" id="setting-support-email" class="sovereign-form-input" placeholder="concierge@mytholis.com" value="${globalSettings.supportEmail || 'concierge@mytholis.com'}" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Displayed in customer policy, metrology, and dispatch communications.
                      </div>
                    </div>

                    <div>
                      <label class="sovereign-field-label">Additional Sovereign Admin Emails</label>
                      <input type="text" id="setting-admin-emails" class="sovereign-form-input" placeholder="founder@mytholis.com, partner@mytholis.com" value="${Array.isArray(globalSettings.adminEmails) ? globalSettings.adminEmails.join(', ') : (globalSettings.adminEmails || '')}" />
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem;">
                        Comma-separated list of emails authorized to access Sovereign Command.
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
                            <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.2rem 0.6rem; border-color: ${pc.active !== false ? '#10B981' : '#EF4444'}; color: ${pc.active !== false ? '#6EE7B7' : '#FCA5A5'};" onclick="app.togglePromoCode('${pc.code}')">
                              ${pc.active !== false ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td>
                            <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.2rem 0.6rem; border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;" onclick="app.deletePromoCode('${pc.code}')">
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
    const catalogMatch = prod && prod.id ? (typeof MYTHOLIS_CATALOG !== 'undefined' ? MYTHOLIS_CATALOG : []).find(c => c.id === prod.id) : null;
    const isCoffret = (prod && prod.id === 'mytholis-discovery-set') || 
                      (prod && (prod.collection?.toLowerCase().includes('sixth sense') || prod.name?.toLowerCase().includes('sixth sense') || prod.id?.includes('coffret') || prod.id?.includes('discovery')));

    const sizes = isCoffret 
      ? [{ ml: 48, price: prod?.price || 3999, stock: prod?.stock !== undefined ? prod.stock : 50 }]
      : ((prod && Array.isArray(prod.sizes) && prod.sizes.length > 0)
        ? prod.sizes
        : (catalogMatch && Array.isArray(catalogMatch.sizes) ? catalogMatch.sizes : [
            { ml: 8, price: 899, stock: 50 },
            { ml: 50, price: 3999, stock: 50 },
            { ml: 100, price: 5999, stock: 50 }
          ]));

    const s8 = sizes.find(s => s.ml === 8);
    const s50 = sizes.find(s => s.ml === 50);
    const s100 = sizes.find(s => s.ml === 100);
    const otherSizes = isCoffret ? [] : sizes.filter(s => s.ml !== 8 && s.ml !== 50 && s.ml !== 100 && s.ml !== 48 && s.ml !== 60);

    const p = prod || {
      id: '',
      name: '',
      tagline: '',
      collection: 'Signature Men',
      price: s100 ? s100.price : (s50 ? s50.price : 4999),
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
                <label class="sovereign-field-label">Base Reference Price (₹)</label>
                <input type="number" id="prod-price" class="sovereign-form-input" value="${p.price || 4999}" min="0" required />
              </div>
              <div>
                <label class="sovereign-field-label">Compare At / MRP (₹)</label>
                <input type="number" id="prod-compare-price" class="sovereign-form-input" value="${p.compareAtPrice || 5999}" min="0" />
              </div>
              <div>
                <label class="sovereign-field-label">Global Stock Quantity</label>
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
              <div style="grid-column: 1 / -1;">
                <label class="sovereign-field-label">Bottle Image URL</label>
                <input type="text" id="prod-image" class="sovereign-form-input" value="${p.image || 'assets/product/1kingscar.webp'}" required />
              </div>
            </div>

            <!-- Flacon Editions or Discovery Coffret Volume Pricing -->
            ${isCoffret ? `
              <div style="margin-bottom: 1.5rem; background: rgba(0, 0, 0, 0.45); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.35);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="font-size: 0.78rem; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">
                    📦 Discovery Coffret Master Set (6 × 8ml Deluxe Vials)
                  </div>
                  <span class="glass-pill" style="font-size: 0.68rem; color: var(--gold-light); border-color: rgba(212, 175, 55, 0.4);">48ml Total Wardrobe</span>
                </div>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0 0 1rem; line-height: 1.5;">
                  The Sixth Sense is an exclusive vault discovery set featuring all 6 extraits in deluxe 8ml atomizers plus a complimentary ₹1,000 voucher. Individual 50ml or 100ml flacons do not exist for this discovery coffret.
                </p>

                <div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 8px; padding: 1rem; max-width: 320px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                    <span style="font-weight: 700; color: var(--gold-light); font-size: 0.88rem;">6 × 8ml Discovery Set</span>
                    <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light); border-color: rgba(212, 175, 55, 0.3);">48ml Total</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div>
                      <label class="sovereign-field-label" style="font-size: 0.7rem;">Coffret Price (₹)</label>
                      <input type="number" id="coffret-price" class="sovereign-form-input" value="${p.price || 3999}" min="0" />
                    </div>
                    <div>
                      <label class="sovereign-field-label" style="font-size: 0.7rem;">Vault Stock Count</label>
                      <input type="number" id="coffret-stock" class="sovereign-form-input" value="${p.stock !== undefined ? p.stock : 50}" min="0" />
                    </div>
                  </div>
                </div>
              </div>
            ` : `
              <div style="margin-bottom: 1.5rem; background: rgba(0, 0, 0, 0.45); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.25);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="font-size: 0.78rem; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">
                    🏺 Flacon Editions & Volume Pricing (50ml · 100ml)
                  </div>
                  <span class="glass-pill" style="font-size: 0.68rem; color: var(--gold-light);">Multi-Size Vault Matrix</span>
                </div>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0 0 1rem;">
                  Control pricing and inventory specifically for the <strong>50ml Signature Flacon</strong> and the <strong>100ml Grand Flacon</strong>. (Note: 8ml is exclusively available in the Sixth Sense vault set).
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                  <!-- 50ml Flacon Card -->
                  <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                      <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--gold-light); cursor: pointer; margin: 0;">
                        <input type="checkbox" id="size-enabled-50" ${s50 || !isEdit ? 'checked' : ''} />
                        <span>50ml Flacon</span>
                      </label>
                      <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light); border-color: rgba(212, 175, 55, 0.3);">50ml</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      <div>
                        <label class="sovereign-field-label" style="font-size: 0.7rem;">50ml Price (₹)</label>
                        <input type="number" id="size-price-50" class="sovereign-form-input" value="${s50 ? s50.price : 3999}" min="0" />
                      </div>
                      <div>
                        <label class="sovereign-field-label" style="font-size: 0.7rem;">50ml Stock Count</label>
                        <input type="number" id="size-stock-50" class="sovereign-form-input" value="${s50 && s50.stock !== undefined ? s50.stock : (p.stock !== undefined ? p.stock : 50)}" min="0" />
                      </div>
                    </div>
                  </div>

                  <!-- 100ml Grand Flacon Card -->
                  <div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 8px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                      <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--gold-light); cursor: pointer; margin: 0;">
                        <input type="checkbox" id="size-enabled-100" ${s100 || !isEdit ? 'checked' : ''} />
                        <span>100ml Grand Flacon</span>
                      </label>
                      <span class="glass-pill" style="font-size: 0.65rem; color: var(--gold-light); border-color: rgba(212, 175, 55, 0.3);">Grand</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      <div>
                        <label class="sovereign-field-label" style="font-size: 0.7rem;">100ml Price (₹)</label>
                        <input type="number" id="size-price-100" class="sovereign-form-input" value="${s100 ? s100.price : (p.price || 5999)}" min="0" />
                      </div>
                      <div>
                        <label class="sovereign-field-label" style="font-size: 0.7rem;">100ml Stock Count</label>
                        <input type="number" id="size-stock-100" class="sovereign-form-input" value="${s100 && s100.stock !== undefined ? s100.stock : (p.stock !== undefined ? p.stock : 50)}" min="0" />
                      </div>
                    </div>
                  </div>
                </div>

                ${otherSizes.length > 0 ? `
                  <div style="margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid rgba(212, 175, 55, 0.15); font-size: 0.75rem; color: var(--gold-light);">
                    <span>Custom / Coffret Editions: </span>
                    ${otherSizes.map(os => `<span class="glass-pill" style="margin-left: 0.4rem;">${os.ml}ml · ₹${os.price}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `}

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
                <div style="font-size: 0.72rem; color: var(--text-muted);">When active, collectors will discover this entry in House Lore.</div>
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
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Collector UID: ${uid}</div>
          </div>

          <form onsubmit="app.submitAdjustMythos(event, '${uid}')">
            <input type="hidden" id="adjust-mythos-uid" value="${uid}" />
            <div style="margin-bottom: 1rem;">
              <label class="sovereign-field-label">Coin Adjustment (+ to Grant, - to Deduct)</label>
              <input type="number" id="adjust-mythos-delta" class="sovereign-form-input" placeholder="e.g. +500 or -200" required />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Audit Reason / Justification</label>
              <input type="text" id="adjust-mythos-reason" class="sovereign-form-input" placeholder="e.g. VIP Concierge Courtesy, Sixth Sense credit" required />
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
  renderOverrideTierModal(uid, patronName, currentBottles = 0, currentLevel = 1) {
    const tierLevel = Number(currentLevel) || 1;
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
            <input type="hidden" id="override-tier-uid" value="${uid}" />
            <div style="margin-bottom: 1rem;">
              <label class="sovereign-field-label">Full Flacons Owned Count</label>
              <input type="number" id="override-bottles-input" class="sovereign-form-input" value="${currentBottles}" min="0" required />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="sovereign-field-label">Promote to Circle of Legends Standing Tier</label>
              <select id="override-tier-select" class="sovereign-select" style="width: 100%;">
                <option value="1" ${tierLevel === 1 ? 'selected' : ''}>Level 1: The Observer (Initiate)</option>
                <option value="2" ${tierLevel === 2 ? 'selected' : ''}>Level 2: The Curator (1+ Bottles, 2x Return)</option>
                <option value="3" ${tierLevel === 3 ? 'selected' : ''}>Level 3: The Collector (3+ Bottles, 3x Return)</option>
                <option value="4" ${tierLevel === 4 ? 'selected' : ''}>Level 4: The Archivist (6+ Bottles, 4x Return)</option>
                <option value="5" ${tierLevel === 5 ? 'selected' : ''}>Level 5: The Sovereign (12+ Bottles, 5x Return)</option>
              </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.8rem;">
              <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Cancel</button>
              <button type="button" class="btn btn-gold" style="padding: 0.7rem 1.8rem;" onclick="app.submitOverrideTier(event, '${uid}')">Apply Override</button>
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
  },

  /* ==========================================================================
     COLLECTOR DOSSIER MODAL: COMPLETE COORDINATES, PHONE & CONSIGNMENT LEDGER
     ========================================================================== */
  renderPatronDossierModal(patron) {
    const prof = patron.profile || {};
    const loyalty = patron.loyalty || {};
    const name = prof.name || patron.name || 'Collector';
    const email = prof.email || patron.email || 'N/A';
    const rawPhone = prof.phone || patron.phone || '';
    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');
    const displayPhone = cleanPhone ? (cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`) : (rawPhone || 'Not Provided');
    const initial = name.charAt(0).toUpperCase();
    const isAdmin = patron.role === 'admin' || patron.isAdmin === true || prof.role === 'admin' || prof.isAdmin === true;
    const spendable = Number(loyalty.spendable_mythos || 0);
    const bottles = Number(loyalty.full_bottles_purchased || patron.fullFlaconsOrdered || 0);
    const legacy = Number(loyalty.legacy_mythos || spendable || 0);
    const orders = Array.isArray(patron.orders) ? patron.orders : [];
    const lifetimeSpend = Number(patron.lifetimeSpend || 0);
    const address = patron.fullAddress || prof.fullAddress || patron.address || prof.address || '';
    const city = patron.city || prof.city || '';
    const state = patron.state || prof.state || '';
    const pincode = patron.pincode || prof.pincode || '';
    const addressCopyText = [name, displayPhone, address, city, state, pincode].filter(Boolean).join('\n');

    const tiers = (typeof store !== 'undefined' && store.LOYALTY_TIERS) || (typeof window !== 'undefined' && window.LOYALTY_TIERS) || [];
    let tierObj = null;
    if (loyalty.manual_tier_override) {
      tierObj = tiers.find(t => t.level === Number(loyalty.manual_tier_override));
    }
    if (!tierObj) {
      for (let i = tiers.length - 1; i >= 0; i--) {
        const t = tiers[i];
        if (legacy >= t.minLegacy && bottles >= t.minBottles) {
          tierObj = t;
          break;
        }
      }
    }
    if (!tierObj && tiers.length > 0) tierObj = tiers[0];
    const currentTierName = (tierObj ? `Level ${tierObj.level}: ${tierObj.name}` : null) || prof.tier || 'Level 1: The Observer';
    const currentTierLevel = tierObj ? tierObj.level : 1;

    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box" style="max-width: 820px; max-height: 90vh; overflow-y: auto;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(212, 175, 55, 0.15); border: 2px solid var(--gold-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.4rem; color: var(--gold-light);">
                ${initial}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <h3 class="font-title gold-shimmer-text" style="margin: 0; font-size: 1.35rem;">${name}</h3>
                  <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-light);">${currentTierName}</span>
                  ${isAdmin ? '<span class="sovereign-pill" style="background: rgba(212, 175, 55, 0.2); border: 1px solid var(--gold-primary); color: var(--gold-light); font-size: 0.7rem;">👑 Admin</span>' : ''}
                  ${patron.isGuestOrder ? '<span class="glass-pill" style="font-size: 0.68rem; color: #6EE7B7;">Consignment Customer</span>' : ''}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 0.2rem; display: flex; align-items: center; gap: 6px;">
                  <span>Collector UID: ${patron.uid || 'N/A'}</span>
                  ${patron.uid ? `<button type="button" class="btn btn-glass" style="font-size: 0.65rem; padding: 1px 5px;" onclick="navigator.clipboard.writeText('${patron.uid || ''}'); app.showToast('Copied UID');">📋 Copy</button>` : ''}
                </div>
              </div>
            </div>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.3rem; color: var(--gold-light);">✕</button>
          </div>

          <!-- Quick Action Contact Bar -->
          <div style="display: flex; gap: 0.6rem; margin-bottom: 1.5rem; flex-wrap: wrap; background: rgba(0, 0, 0, 0.35); padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.15); align-items: center;">
            ${cleanPhone ? `
              <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${name}, greetings from House of Mytholis!`)}" target="_blank" class="btn btn-glass" style="background: rgba(37, 211, 102, 0.15); border-color: rgba(37, 211, 102, 0.5); color: #25D366; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
                <span>💬</span> Chat on WhatsApp (${displayPhone})
              </a>
              <a href="tel:+91${cleanPhone}" class="btn btn-glass" style="font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
                <span>📞</span> Direct Call
              </a>
            ` : `
              <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">⚠️ No phone number registered</span>
            `}
            ${email && email !== 'N/A' ? `
              <a href="mailto:${email}" class="btn btn-glass" style="font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">
                <span>✉️</span> Email Collector
              </a>
            ` : ''}
            <button type="button" class="btn btn-glass" style="font-size: 0.78rem; margin-left: auto;" onclick="navigator.clipboard.writeText('${addressCopyText.replace(/'/g, "\\'")}'); app.showToast('Copied full shipping label coordinates!');">
              📋 Copy Delivery Label Data
            </button>
          </div>

          <!-- 2-Column Info Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.2rem; margin-bottom: 1.5rem;">
            <!-- Delivery & Address Coordinates -->
            <div class="sovereign-subpanel">
              <div class="sovereign-subpanel-title" style="color: var(--gold-light); display: flex; justify-content: space-between; align-items: center;">
                <span>📍 Shipping & Delivery Coordinates</span>
                <span class="glass-pill" style="font-size: 0.65rem;">Primary Destination</span>
              </div>
              <div style="margin-bottom: 0.8rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Full Address:</div>
                <div style="font-size: 0.88rem; line-height: 1.5; color: var(--text-main); background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); word-break: break-word;">
                  ${address || '<span style="color: var(--text-muted); font-style: italic;">No shipping address recorded yet.</span>'}
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.78rem;">
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">City</div>
                  <strong style="color: var(--gold-light);">${city || 'N/A'}</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">State</div>
                  <strong style="color: var(--gold-light);">${state || 'N/A'}</strong>
                </div>
                <div>
                  <div style="color: var(--text-muted); font-size: 0.7rem;">Pincode</div>
                  <strong style="color: var(--gold-light);">${pincode || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <!-- Economy, Flacons & Tier Standing -->
            <div class="sovereign-subpanel">
              <div class="sovereign-subpanel-title" style="color: var(--gold-light); display: flex; justify-content: space-between; align-items: center;">
                <span>🪙 Collector Economy & Circle of Legends</span>
                <span class="glass-pill" style="font-size: 0.65rem;">VIP Privileges</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-bottom: 0.8rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: 6px;">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Lifetime Spend (LTV)</div>
                  <div class="gold-shimmer-text" style="font-size: 1.15rem; font-weight: 700;">₹${lifetimeSpend.toLocaleString('en-IN')}</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: 6px;">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Total Consignments</div>
                  <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${orders.length} Orders</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: 6px;">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Spendable Mythos</div>
                  <div style="font-size: 1.15rem; font-weight: 700; color: var(--gold-light);">${spendable.toLocaleString()} M</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 0.6rem; border-radius: 6px;">
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Full Flacons (≥50ml)</div>
                  <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${bottles} Flacons</div>
                </div>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                Referral Code: <strong style="color: var(--gold-light);">${prof.referralCode || patron.referralCode || 'None generated'}</strong>
              </div>
            </div>
          </div>

          <!-- Consignments / Orders History Ledger -->
          <div class="sovereign-subpanel" style="margin-bottom: 1.5rem;">
            <div class="sovereign-subpanel-title" style="color: var(--gold-light); display: flex; justify-content: space-between; align-items: center;">
              <span>📦 Consignment Ledger & Order History (${orders.length})</span>
            </div>
            ${orders.length === 0 ? `
              <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.85rem;">
                No orders placed by this collector yet.
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${orders.map(ord => {
                  const ordId = ord.orderId || ord.id || 'MYTH-0000';
                  const ordStatus = ord.status || 'Pending';
                  const ordPay = (ord.paymentMethod || 'Prepaid').toUpperCase();
                  const ordAmount = Number(ord.finalPayable || ord.total || ord.subtotal || 0);
                  const ordDate = ord.timestamp?.toMillis ? new Date(ord.timestamp.toMillis()).toLocaleString('en-IN') : (ord.date || ord.createdAt ? new Date(ord.date || ord.createdAt).toLocaleString('en-IN') : 'Recent');
                  const items = Array.isArray(ord.items) ? ord.items : [];
                  const courier = ord.courierName || '';
                  const awb = ord.trackingNumber || '';

                  return `
                    <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 8px; padding: 0.8rem;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                          <strong style="color: var(--gold-light); font-size: 0.95rem;">Order #${ordId}</strong>
                          <span class="sovereign-pill status-${ordStatus.toLowerCase()}">${ordStatus}</span>
                          <span class="sovereign-pill payment-${ordPay.toLowerCase()}">${ordPay}</span>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">
                          ${ordDate}
                        </div>
                      </div>
                      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">
                        Items: ${items.map(it => `<span style="color: var(--text-main); font-weight: 600;">${it.name || it.id} (${it.size || 50}ml &times; ${it.quantity || 1})</span>`).join(', ') || 'No items listed'}
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.4rem; font-size: 0.8rem;">
                        <div>
                          ${courier || awb ? `<span style="color: var(--gold-primary);">🚚 ${courier} AWB: ${awb}</span>` : '<span style="color: var(--text-muted);">Dispatch Pending</span>'}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                          <strong class="gold-shimmer-text" style="font-size: 0.95rem;">₹${ordAmount.toLocaleString('en-IN')}</strong>
                          <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" onclick="app.closeAdminModal(); app.printShippingLabelForOrder('${ordId}')">
                            🏷️ Shipping Label
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Footer Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 0.8rem;">
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" class="btn btn-glass" style="font-size: 0.75rem;" onclick="app.closeAdminModal(); app.openAdjustMythosModal('${patron.uid}', '${name.replace(/'/g, "\\'")}', ${spendable})">
                &plusmn; Adjust Mythos
              </button>
              <button type="button" class="btn btn-glass" style="font-size: 0.75rem;" onclick="app.closeAdminModal(); app.openOverrideTierModal('${patron.uid}', '${name.replace(/'/g, "\\'")}', ${bottles}, ${currentTierLevel})">
                Override Tier
              </button>
            </div>
            <button type="button" class="btn btn-gold" style="font-size: 0.78rem; padding: 0.6rem 1.4rem;" onclick="app.closeAdminModal()">Close Dossier</button>
          </div>
        </div>
      </div>
    `;
  },

  /* ==========================================================================
     DIRECT 4x6 THERMAL SHIPPING LABEL STUDIO MODAL
     ========================================================================== */
  renderShippingLabelModal(targetOrder = null, config = {}) {
    return this.renderLabelRebranderModal(targetOrder, config);
  },

  renderLabelRebranderModal(targetOrder = null, config = {}) {
    const orderId = targetOrder ? (targetOrder.orderId || targetOrder.id || '') : '';
    const patronName = targetOrder ? (targetOrder.userName || targetOrder.name || targetOrder.customer?.name || '') : '';
    const courier = targetOrder ? (targetOrder.courierName || '') : '';
    const awb = targetOrder ? (targetOrder.trackingNumber || targetOrder.awbCode || '') : '';
    const existingLabelUrl = targetOrder ? (targetOrder.labelUrl || '') : '';

    const savedConfig = config || (typeof store !== 'undefined' && store.globalSettings && store.globalSettings.labelConfig) || {};
    const defaultPreset = savedConfig.preset || 'thermal-4x6-bottom';
    const maskX = savedConfig.maskX !== undefined ? savedConfig.maskX : 14;
    const maskY = savedConfig.maskY !== undefined ? savedConfig.maskY : 18;
    const maskWidth = savedConfig.maskWidth !== undefined ? savedConfig.maskWidth : 260;
    const maskHeight = savedConfig.maskHeight !== undefined ? savedConfig.maskHeight : 82;
    const fontSize = savedConfig.fontSize !== undefined ? savedConfig.fontSize : 10;
    const showLogo = savedConfig.showLogo !== false;
    const hasTopMask = savedConfig.hasTopHeaderMask === true;

    return `
      <div class="sovereign-modal-backdrop" onclick="if(event.target === this) app.closeAdminModal()">
        <div class="sovereign-modal-box" style="max-width: 980px; width: 95%;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.8rem; flex-wrap: wrap; gap: 0.8rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span class="glass-pill" style="font-size: 0.7rem; color: var(--gold-primary); letter-spacing: 0.1em;">AUTHENTIC DISPATCH</span>
                <span class="glass-pill" style="font-size: 0.7rem; color: #10B981; border-color: #10B981;">Direct 4x6 Thermal Ready</span>
              </div>
              <h3 class="font-title" style="color: var(--gold-light); margin: 0.3rem 0 0; font-size: 1.3rem;">
                Mytholis 4x6 Thermal Shipping Label Studio
              </h3>
            </div>
            <button class="icon-btn" onclick="app.closeAdminModal()" style="font-size: 1.3rem; color: var(--gold-light);">✕</button>
          </div>

          ${targetOrder ? `
            <!-- Attached Order Context Bar -->
            <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
              <div>
                <strong style="color: var(--gold-primary); font-size: 0.95rem;">Order #${orderId}</strong>
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">Collector: <strong style="color: var(--text-main);">${patronName}</strong></span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Courier: <strong style="color: var(--gold-light);">${courier || 'BlueDart Express'}</strong> &bull; AWB: <strong style="color: var(--gold-light); font-family: monospace;">${awb || 'Pending'}</strong>
              </div>
            </div>
          ` : ''}

          <!-- Two-Column Studio Layout -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
            
            <!-- Column 1: Native Generator & Controls -->
            <div style="display: flex; flex-direction: column; gap: 1.2rem;">
              
              ${targetOrder ? `
                <!-- Native Thermal Label Configuration -->
                <div class="calibration-card">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--gold-light); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">
                    1. Consignment Dispatch Parameters
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.7rem;">
                    <div>
                      <label class="sovereign-field-label">Assigned Courier</label>
                      <input type="text" id="label-courier-input" class="sovereign-form-input" value="${courier || 'BlueDart Express'}" onchange="app.refreshOrderShippingLabel()" />
                    </div>
                    <div>
                      <label class="sovereign-field-label">AWB / Courier Tracking #</label>
                      <input type="text" id="label-awb-input" class="sovereign-form-input" value="${awb}" placeholder="e.g. 84920194821" onchange="app.refreshOrderShippingLabel()" />
                    </div>
                    <div style="margin-top: 0.3rem;">
                      <button type="button" class="btn btn-gold" style="width: 100%; font-size: 0.8rem; font-weight: 700;" onclick="app.refreshOrderShippingLabel()">
                        ⚡ Update & Regenerate Label
                      </button>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- External PDF Fallback (Collapsible) -->
              <details class="calibration-card" ${targetOrder ? '' : 'open'}>
                <summary style="font-size: 0.85rem; font-weight: 700; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;">
                  External PDF Slip Import (Optional)
                </summary>

                <!-- Drag & Drop Zone -->
                <div class="label-dropzone" id="label-dropzone" style="margin-top: 0.8rem;" onclick="document.getElementById('rebrander-file-input').click()">
                  <input type="file" id="rebrander-file-input" accept="application/pdf" style="display: none;" onchange="app.handleLabelFileUpload(event)" />
                  <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">📄</div>
                  <div style="color: var(--gold-light); font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem;" id="dropzone-label-text">
                    Drop 4x6 Shipping Label PDF Here
                  </div>
                  <div style="color: var(--text-muted); font-size: 0.75rem;">
                    or click to browse from device
                  </div>
                </div>

                <!-- Alternative: Direct URL -->
                <div style="margin-top: 0.8rem;">
                  <div style="display: flex; gap: 0.4rem;">
                    <input type="text" id="rebrander-url-input" class="sovereign-form-input" placeholder="Or paste label PDF URL..." value="${existingLabelUrl}" style="font-size: 0.8rem; flex: 1;" />
                    <button type="button" class="btn btn-glass" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;" onclick="app.loadLabelFromUrl()">
                      Fetch
                    </button>
                  </div>
                </div>

                <div style="margin-top: 0.6rem; text-align: right;">
                  <button type="button" class="btn btn-glass" style="font-size: 0.7rem; padding: 0.3rem 0.6rem; color: var(--gold-primary);" onclick="app.loadSampleThermalLabel()">
                    ⚡ Test With Sample 4x6 Courier Label
                  </button>
                </div>
              </details>

              <!-- Alignment Presets & Geometry Slider Controls -->
              <div class="calibration-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.05em;">
                    2. Courier Alignment & Mask Presets
                  </div>
                  <button type="button" class="btn btn-glass" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;" onclick="app.saveLabelCalibrationAsDefault()">
                    💾 Save as Default
                  </button>
                </div>

                <!-- Preset Selector -->
                <div style="margin-bottom: 1rem;">
                  <label class="sovereign-field-label">Template Preset</label>
                  <select id="rebrander-preset-select" class="sovereign-select" style="width: 100%;" onchange="app.applyLabelPreset(this.value)">
                    <option value="thermal-4x6-bottom" ${defaultPreset === 'thermal-4x6-bottom' ? 'selected' : ''}>Standard 4x6 Thermal Label (Bottom Mask)</option>
                    <option value="thermal-4x6-top-bottom" ${defaultPreset === 'thermal-4x6-top-bottom' ? 'selected' : ''}>4x6 Thermal Label (Top Brand + Bottom Mask)</option>
                    <option value="a4-top-left" ${defaultPreset === 'a4-top-left' ? 'selected' : ''}>A4 Sheet Courier Label (Top-Left Quadrant)</option>
                    <option value="custom" ${defaultPreset === 'custom' ? 'selected' : ''}>Custom Manual Coordinates</option>
                  </select>
                </div>

                <!-- Numeric / Slider Controls for White-Out Mask -->
                <div class="calibration-slider-row">
                  <label>Mask X Offset (pt):</label>
                  <input type="range" id="slider-mask-x" min="0" max="100" value="${maskX}" oninput="app.updateMaskSliderVal('x', this.value)" />
                  <span class="calibration-val-badge" id="val-mask-x">${maskX}</span>
                </div>

                <div class="calibration-slider-row">
                  <label>Mask Y Position (pt):</label>
                  <input type="range" id="slider-mask-y" min="0" max="200" value="${maskY}" oninput="app.updateMaskSliderVal('y', this.value)" />
                  <span class="calibration-val-badge" id="val-mask-y">${maskY}</span>
                </div>

                <div class="calibration-slider-row">
                  <label>Mask Width (pt):</label>
                  <input type="range" id="slider-mask-w" min="150" max="320" value="${maskWidth}" oninput="app.updateMaskSliderVal('w', this.value)" />
                  <span class="calibration-val-badge" id="val-mask-w">${maskWidth}</span>
                </div>

                <div class="calibration-slider-row">
                  <label>Mask Height (pt):</label>
                  <input type="range" id="slider-mask-h" min="40" max="140" value="${maskHeight}" oninput="app.updateMaskSliderVal('h', this.value)" />
                  <span class="calibration-val-badge" id="val-mask-h">${maskHeight}</span>
                </div>

                <div class="calibration-slider-row">
                  <label>Brand Font Size (pt):</label>
                  <input type="range" id="slider-mask-font" min="8" max="14" value="${fontSize}" oninput="app.updateMaskSliderVal('font', this.value)" />
                  <span class="calibration-val-badge" id="val-mask-font">${fontSize}</span>
                </div>

                <!-- Toggles -->
                <div style="display: flex; gap: 1.5rem; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid rgba(212, 175, 55, 0.15);">
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--gold-light); cursor: pointer;">
                    <input type="checkbox" id="rebrander-show-logo" ${showLogo ? 'checked' : ''} onchange="app.triggerRebrandPreview()" style="accent-color: var(--gold-primary);" />
                    Embed Mytholis Crest Logo
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--gold-light); cursor: pointer;">
                    <input type="checkbox" id="rebrander-top-mask" ${hasTopMask ? 'checked' : ''} onchange="app.triggerRebrandPreview()" style="accent-color: var(--gold-primary);" />
                    Mask Top Banner
                  </label>
                </div>
              </div>

              <!-- Brand Identity Stamp Customization -->
              <div class="calibration-card">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--gold-light); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  3. Thermal Typography Stamp
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                  <div>
                    <label class="sovereign-field-label">Header Title</label>
                    <input type="text" id="rebrander-title" class="sovereign-form-input" value="MYTHOLIS LUXURY PARFUMS" oninput="app.triggerRebrandPreview()" />
                  </div>
                  <div>
                    <label class="sovereign-field-label">Subtitle</label>
                    <input type="text" id="rebrander-subtitle" class="sovereign-form-input" value="Extrait de Parfum | Luxury Olfactory House" oninput="app.triggerRebrandPreview()" />
                  </div>
                  <div>
                    <label class="sovereign-field-label">Return & Concierge Coordinates</label>
                    <input type="text" id="rebrander-return" class="sovereign-form-input" value="House of Mytholis • www.mytholis.com • concierge@mytholis.com" oninput="app.triggerRebrandPreview()" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Column 2: Live PDF Rebranding Preview & Print Desk -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div class="calibration-card" style="height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--gold-light); text-transform: uppercase; letter-spacing: 0.05em;">
                    Interactive Thermal Print Preview
                  </div>
                  <span id="rebrander-status-pill" class="glass-pill" style="font-size: 0.68rem; color: var(--gold-primary);">
                    Ready to Rebrand
                  </span>
                </div>

                <!-- PDF Preview Frame / Viewer -->
                <div style="flex: 1; min-height: 440px; position: relative; border-radius: 8px; overflow: hidden; background: #1a1a1a;">
                  <iframe id="rebrander-preview-frame" class="rebrander-preview-frame" style="width: 100%; height: 100%; min-height: 440px; border: 0;"></iframe>
                  <div id="rebrander-preview-placeholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(4, 28, 20, 0.95); padding: 2rem; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.8rem;">🏷️</div>
                    <h4 class="font-title" style="color: var(--gold-light); margin: 0 0 0.4rem;">No PDF Loaded</h4>
                    <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 320px; margin-bottom: 1.2rem;">
                      Upload a courier PDF label or click the test button on the left to calibrate the white-out mask.
                    </p>
                    <button type="button" class="btn btn-gold" style="font-size: 0.8rem; padding: 0.6rem 1.4rem;" onclick="app.loadSampleThermalLabel()">
                      Generate Sample 4x6 Label
                    </button>
                  </div>
                </div>

                <!-- Action Controls Below Preview -->
                <div style="margin-top: 1rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
                  <button type="button" class="btn btn-gold" style="flex: 1.5; padding: 0.75rem 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.4rem;" onclick="app.printRebrandedLabel()">
                    🖨️ Direct Thermal Print
                  </button>
                  <button type="button" class="btn btn-glass" style="flex: 1.2; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;" onclick="app.downloadRebrandedLabel('${orderId}')">
                    ⬇️ Download PDF
                  </button>
                  ${targetOrder ? `
                    <button type="button" class="btn btn-glass" style="flex: 1; padding: 0.75rem 1rem; color: #10B981; border-color: #10B981;" onclick="app.saveRebrandedLabelToOrder('${orderId}')">
                      ✓ Save to Order
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 0.8rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              🛡️ Method 3 Compliance: Legal KYC entity is preserved in courier manifests; shipping labels are branded exclusively for the collector.
            </span>
            <button type="button" class="btn btn-glass" onclick="app.closeAdminModal()">Close Studio</button>
          </div>
        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.AdminComponents = AdminComponents;
}
