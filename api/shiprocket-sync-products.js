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

    // Default Catalog Extraits + Discovery Coffret
    const DEFAULT_CATALOG = [
      {
        id: 'ash',
        name: 'Ash - Extrait de Parfum 50ml',
        sku: '10062',
        price: 3999,
        stock: 100
      },
      {
        id: 'king-scar',
        name: 'King Scar - Extrait de Parfum 50ml',
        sku: '10012',
        price: 3999,
        stock: 150
      },
      {
        id: 'petralux',
        name: 'Petralux - Extrait de Parfum 50ml',
        sku: '10022',
        price: 3999,
        stock: 200
      },
      {
        id: 'spark',
        name: 'Spark - Extrait de Parfum 50ml',
        sku: '10042',
        price: 3999,
        stock: 110
      },
      {
        id: 'oud-rion',
        name: 'Oud Rion - Extrait de Parfum 50ml',
        sku: '10032',
        price: 3999,
        stock: 130
      },
      {
        id: 'wood-sera',
        name: 'Wood Sera - Extrait de Parfum 50ml',
        sku: '10052',
        price: 3999,
        stock: 90
      },
      {
        id: 'mytholis-discovery-set',
        name: 'Sixth Sense',
        sku: '10071',
        price: 3999,
        stock: 250
      }
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
      itemsToSync = customItems.map(p => {
        const id = p.id || p.handle || '';
        const defaultSku = VARIANT_MAP[id]?.default || VARIANT_MAP[id]?.[50] || p.sku || String(p.id);
        let rawName = (p.name || p.title || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (id === 'mytholis-discovery-set') {
          rawName = 'Sixth Sense';
        } else if (!rawName.includes('50ml')) {
          rawName = `${rawName} 50ml`;
        }
        const price = Number(p.price || (p.sizes && p.sizes.find(s => s.ml === 50)?.price) || 3999);
        const stock = Number(p.stock || p.quantity || 100);
        return {
          sku: String(p.sku || defaultSku),
          name: rawName,
          type: 'Single',
          category_code: 'default',
          hsn: '33030040',
          mrp: price,
          weight: 0.35,
          length: 12,
          breadth: 12,
          height: 15,
          qty: stock
        };
      });
    } else {
      itemsToSync = DEFAULT_CATALOG.map(p => ({
        sku: p.sku,
        name: p.name,
        type: 'Single',
        category_code: 'default',
        hsn: '33030040',
        mrp: p.price,
        weight: 0.35,
        length: 12,
        breadth: 12,
        height: 15,
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
