import crypto from 'crypto';

const FASTRR_API_KEY = process.env.FASTRR_API_KEY || 'GkmYB8JVVgvPFLiN';
const FASTRR_SECRET_KEY = process.env.FASTRR_SECRET_KEY || 'bgHG23KYS9CZi8Pvo2UgmuyBWlacgKqo';
const FASTRR_CHECKOUT_URL = process.env.FASTRR_CHECKOUT_URL || 'https://checkout-api.shiprocket.com/api/v1/access-token/checkout';

// Map human product & size IDs to Fastrr variant IDs
const VARIANT_MAP = {
  'king-scar': { 8: '10011', 50: '10012', 100: '10013' },
  'petralux': { 8: '10021', 50: '10022', 100: '10023' },
  'oud-rion': { 8: '10031', 50: '10032', 100: '10033' },
  'spark': { 8: '10041', 50: '10042', 100: '10043' },
  'wood-sera': { 8: '10051', 50: '10052', 100: '10053' },
  'ash': { 8: '10061', 50: '10062', 100: '10063' },
  'mytholis-discovery-set': { 60: '10071', default: '10071' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { items = [], redirect_url } = req.body || {};

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Format items to Fastrr variant_id & quantity
    const fastrrItems = items.map(item => {
      let variantId = item.variant_id;
      if (!variantId && item.productId) {
        const sizeMap = VARIANT_MAP[item.productId] || {};
        variantId = sizeMap[item.size] || sizeMap.default || '10022';
      }
      return {
        variant_id: String(variantId || '10022'),
        quantity: parseInt(item.quantity) || 1
      };
    });

    const host = req.headers['host'] || 'mytholis.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const finalRedirectUrl = redirect_url || `${protocol}://${host}/#track-order?checkout=fastrr`;

    const payload = {
      cart_data: {
        items: fastrrItems
      },
      redirect_url: finalRedirectUrl,
      timestamp: new Date().toISOString()
    };

    const rawBody = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', FASTRR_SECRET_KEY).update(rawBody).digest('base64');

    console.log('[Fastrr Access Token] Dispatching request to Fastrr Checkout API...');
    const fastrrRes = await fetch(FASTRR_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': FASTRR_API_KEY,
        'X-Api-HMAC-SHA256': hmac
      },
      body: rawBody
    });

    const resJson = await fastrrRes.json().catch(() => ({}));

    if (!fastrrRes.ok || !resJson.ok) {
      console.warn('[Fastrr Access Token] Fastrr returned error:', fastrrRes.status, resJson);
      return res.status(fastrrRes.status >= 400 && fastrrRes.status < 500 ? fastrrRes.status : 200).json({
        success: false,
        status: fastrrRes.status,
        error: resJson.error?.message || resJson.result || 'Fastrr catalog sync required by Shiprocket onboarding.',
        fastrrResponse: resJson,
        catalogSyncUrl: `${protocol}://${host}/api/fastrr/products`
      });
    }

    return res.status(200).json({
      success: true,
      token: resJson.result?.token,
      order_id: resJson.result?.data?.order_id,
      expires_at: resJson.result?.expires_at,
      redirect_url: finalRedirectUrl
    });

  } catch (error) {
    console.error('[Fastrr Access Token] Internal Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
