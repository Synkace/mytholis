import crypto from 'crypto';

const FASTRR_SECRET_KEY = process.env.FASTRR_SECRET_KEY || 'bgHG23KYS9CZi8Pvo2UgmuyBWlacgKqo';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Mytholis Fastrr Order Webhook Gateway',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('[Fastrr Order Webhook] Received event:', JSON.stringify(payload).slice(0, 500));

    // Enforce HMAC validation
    const hmacHeader = req.headers['x-api-hmac-sha256'];
    if (FASTRR_SECRET_KEY) {
      if (!hmacHeader) {
        console.warn('[Fastrr Order Webhook] Missing X-Api-HMAC-SHA256 signature.');
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing HMAC signature' });
      }
      const calculatedHmac = crypto.createHmac('sha256', FASTRR_SECRET_KEY)
        .update(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        .digest('base64');
      if (calculatedHmac !== hmacHeader) {
        console.warn('[Fastrr Order Webhook] HMAC mismatch! Rejecting request.');
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid HMAC signature' });
      }
    }

    const orderId = payload.order_id || payload.channel_order_id || 'FASTRR_' + Date.now();
    const status = payload.status || 'SUCCESS';
    const paymentType = payload.payment_type || 'PREPAID';
    const totalPayable = parseFloat(payload.total_amount_payable || payload.total || 0);
    const patronPhone = payload.phone || payload.customer_phone || '';
    const patronEmail = payload.email || payload.customer_email || '';

    // Initialize adminDb
    let adminDb = null;
    try {
      const adminModule = await import('../_firebaseAdmin.js');
      adminDb = adminModule.adminDb;
    } catch (e) {}

    if (adminDb && status === 'SUCCESS') {
      const orderDocRef = adminDb.collection('orders').doc(orderId);
      await orderDocRef.set({
        orderId,
        source: 'FASTRR_CHECKOUT',
        status: paymentType === 'CASH_ON_DELIVERY' ? 'Pending COD' : 'Confirmed',
        paymentStatus: paymentType === 'CASH_ON_DELIVERY' ? 'Pending COD' : 'PAID',
        paymentMethod: paymentType === 'CASH_ON_DELIVERY' ? 'COD' : 'UPI / Card (Fastrr)',
        total: totalPayable,
        finalPayable: totalPayable,
        customerName: payload.name || payload.billing_name || 'Patron',
        email: patronEmail,
        phone: patronPhone,
        shippingAddress: payload.shipping_address || payload.billing_address || {},
        items: payload.cart_data?.items || [],
        rawFastrrPayload: payload,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Award 3% Mythos loyalty points if phone matched
      if (patronPhone) {
        const cleanPhone = String(patronPhone).replace(/[^0-9]/g, '');
        const userQuery = await adminDb.collection('users')
          .where('profile.phone', '==', cleanPhone)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          const currentMythos = userDoc.data().loyalty?.spendable_mythos || 0;
          const pointsEarned = Math.round(totalPayable * 0.03);
          await userDoc.ref.update({
            'loyalty.spendable_mythos': currentMythos + pointsEarned,
            'loyalty.total_spent': (userDoc.data().loyalty?.total_spent || 0) + totalPayable
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      order_id: orderId,
      status: 'ACKNOWLEDGED',
      message: 'Mytholis Sovereign Vault has recorded the Fastrr order.'
    });

  } catch (err) {
    console.error('[Fastrr Order Webhook] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
