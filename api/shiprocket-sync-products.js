// Serverless route to sync Mytholis fragrance creations to Shiprocket Master Product Catalog
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const email = process.env.SHIPROCKET_EMAIL || process.env.SELLER_EMAIL || 'api@mytholis.com';
    const password = process.env.SHIPROCKET_PASSWORD || process.env.SELLER_PASSWORD || 'naR3$pTJstLRVzbADNIQoTMH0VsJ!YkN';

    // 1. Authenticate with Shiprocket API
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const authData = await authRes.json().catch(() => ({}));
    if (!authRes.ok || !authData.token) {
      return res.status(authRes.status || 401).json({
        success: false,
        error: authData.message || 'Shiprocket authentication failed'
      });
    }

    const token = authData.token;

    // 2. Standard Fastrr/Shiprocket Variant mapping
    const VARIANT_MAP = {
      'king-scar': { 8: '10011', 50: '10012', 100: '10013', default: '10012' },
      'petralux': { 8: '10021', 50: '10022', 100: '10023', default: '10022' },
      'oud-rion': { 8: '10031', 50: '10032', 100: '10033', default: '10032' },
      'spark': { 8: '10041', 50: '10042', 100: '10043', default: '10042' },
      'wood-sera': { 8: '10051', 50: '10052', 100: '10053', default: '10052' },
      'ash': { 8: '10061', 50: '10062', 100: '10063', default: '10062' },
      'mytholis-discovery-set': { 48: '10071', 60: '10071', default: '10071' }
    };

    // Default Catalog Extraits (50ml & 100ml) + Discovery Coffret
    const DEFAULT_CATALOG = [
      // Ash
      { id: 'ash', name: 'Ash - Extrait de Parfum 50ml', sku: '10062', price: 3999, stock: 100, weight: 0.35, height: 15 },
      { id: 'ash', name: 'Ash - Extrait de Parfum 100ml', sku: '10063', price: 4999, stock: 60, weight: 0.55, height: 18 },
      // King Scar
      { id: 'king-scar', name: 'King Scar - Extrait de Parfum 50ml', sku: '10012', price: 3999, stock: 150, weight: 0.35, height: 15 },
      { id: 'king-scar', name: 'King Scar - Extrait de Parfum 100ml', sku: '10013', price: 5999, stock: 100, weight: 0.55, height: 18 },
      // Petralux
      { id: 'petralux', name: 'Petralux - Extrait de Parfum 50ml', sku: '10022', price: 3999, stock: 200, weight: 0.35, height: 15 },
      { id: 'petralux', name: 'Petralux - Extrait de Parfum 100ml', sku: '10023', price: 5999, stock: 100, weight: 0.55, height: 18 },
      // Spark
      { id: 'spark', name: 'Spark - Extrait de Parfum 50ml', sku: '10042', price: 3999, stock: 110, weight: 0.35, height: 15 },
      { id: 'spark', name: 'Spark - Extrait de Parfum 100ml', sku: '10043', price: 5499, stock: 75, weight: 0.55, height: 18 },
      // Oud Rion
      { id: 'oud-rion', name: 'Oud Rion - Extrait de Parfum 50ml', sku: '10032', price: 3999, stock: 130, weight: 0.35, height: 15 },
      { id: 'oud-rion', name: 'Oud Rion - Extrait de Parfum 100ml', sku: '10033', price: 5499, stock: 75, weight: 0.55, height: 18 },
      // Wood Sera
      { id: 'wood-sera', name: 'Wood Sera - Extrait de Parfum 50ml', sku: '10052', price: 3999, stock: 90, weight: 0.35, height: 15 },
      { id: 'wood-sera', name: 'Wood Sera - Extrait de Parfum 100ml', sku: '10053', price: 5499, stock: 60, weight: 0.55, height: 18 },
      // Sixth Sense Discovery Coffret
      { id: 'mytholis-discovery-set', name: 'Sixth Sense Discovery Coffret (6x8ml)', sku: '10071', price: 3999, stock: 250, weight: 0.45, height: 6 }
    ];

    let itemsToSync = [];
    let customItems = null;

    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          customItems = Array.isArray(parsed.products) ? parsed.products : (Array.isArray(parsed) ? parsed : null);
        } catch (_) {}
      } else if (Array.isArray(req.body.products)) {
        customItems = req.body.products;
      } else if (Array.isArray(req.body)) {
        customItems = req.body;
      }
    }

    if (customItems && customItems.length > 0) {
      customItems.forEach(p => {
        const id = p.id || p.handle || '';
        const isCoffret = id === 'mytholis-discovery-set' || (p.name && p.name.toLowerCase().includes('sixth sense'));
        const cleanBaseName = (p.name || p.title || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/Extrait\s*de\s*Parfum/gi, '')
          .replace(/50ml|100ml|60ml|8ml|\(.*?\)/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (isCoffret) {
          itemsToSync.push({
            sku: '10071',
            name: 'Sixth Sense Discovery Coffret (6x8ml)',
            type: 'Single',
            category_code: 'default',
            hsn: '33030040',
            mrp: Number(p.price || 3999),
            weight: 0.45,
            length: 18,
            breadth: 14,
            height: 6,
            qty: Number(p.stock || p.quantity || 250)
          });
        } else {
          // Generate both 50ml and 100ml variant products for Shiprocket
          const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 
            ? p.sizes.filter(s => s.ml === 50 || s.ml === 100) 
            : [{ ml: 50, price: 3999, stock: 100 }, { ml: 100, price: p.price || 5999, stock: 75 }];

          // If product only had one size object or none, ensure both 50ml and 100ml exist
          if (!sizes.some(s => s.ml === 50)) {
            sizes.push({ ml: 50, price: 3999, stock: Number(p.stock || 100) });
          }
          if (!sizes.some(s => s.ml === 100)) {
            sizes.push({ ml: 100, price: Number(p.price || 5499), stock: Number(p.stock || 75) });
          }

          sizes.forEach(s => {
            const ml = Number(s.ml);
            const sku = VARIANT_MAP[id]?.[ml] || `${id}-${ml}`;
            itemsToSync.push({
              sku: String(sku),
              name: `${cleanBaseName} - Extrait de Parfum ${ml}ml`,
              type: 'Single',
              category_code: 'default',
              hsn: '33030040',
              mrp: Number(s.price || (ml === 100 ? (p.price || 5499) : 3999)),
              weight: ml === 100 ? 0.55 : 0.35,
              length: 12,
              breadth: 12,
              height: ml === 100 ? 18 : 15,
              qty: Number(s.stock !== undefined ? s.stock : (p.stock || 100))
            });
          });
        }
      });
    } else {
      itemsToSync = DEFAULT_CATALOG.map(p => ({
        sku: p.sku,
        name: p.name,
        type: 'Single',
        category_code: 'default',
        hsn: '33030040',
        mrp: p.price,
        weight: p.weight || 0.35,
        length: 12,
        breadth: 12,
        height: p.height || 15,
        qty: p.stock
      }));
    }

    const results = [];
    let syncedCount = 0;

    for (const prod of itemsToSync) {
      try {
        const prodRes = await fetch('https://apiv2.shiprocket.in/v1/external/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(prod)
        });

        const resText = await prodRes.text();
        let resJson = null;
        try { resJson = JSON.parse(resText); } catch (_) {}

        if (prodRes.status === 200 || prodRes.status === 201) {
          syncedCount++;
          results.push({ sku: prod.sku, name: prod.name, status: 'created' });
        } else if (prodRes.status === 422 && resText.includes('already been taken')) {
          syncedCount++;
          results.push({ sku: prod.sku, name: prod.name, status: 'already_registered' });
        } else {
          results.push({ sku: prod.sku, name: prod.name, status: 'failed', error: resJson?.message || resText });
        }
      } catch (err) {
        results.push({ sku: prod.sku, name: prod.name, status: 'error', error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      syncedCount,
      totalCount: itemsToSync.length,
      results
    });
  } catch (error) {
    console.error('[Shiprocket Sync Products API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
