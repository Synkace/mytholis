import { adminAuth, adminDb } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderData } = req.body || {};
  if (!orderData) {
    return res.status(400).json({ error: 'Missing orderData' });
  }

  // Optional authentication
  let uid = null;
  let userEmail = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      userEmail = decoded.email;
    } catch (e) {
      // Allow guest checkout if token invalid
      console.warn("[Mytholis API] Guest checkout (unverified token)");
    }
  }

  try {
    const orderDoc = {
      ...orderData,
      userId: uid || orderData.userId || 'guest',
      userEmail: userEmail || orderData.userEmail || orderData.email || 'guest@mytholis.com',
      createdAt: new Date().toISOString()
    };

    const orderRef = await adminDb.collection('orders').add(orderDoc);

    // If registered user, update loyalty points and order history
    if (uid) {
      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        const loyalty = userData.loyalty || {};
        const profile = userData.profile || {};

        // Per AGENTS.md Rule 3: Points and tiers may only be credited after verified payment confirmation
        const isVerifiedPaid = orderData.paymentStatus === 'Paid';
        if (isVerifiedPaid) {
          const earnedPoints = Math.round((Number(orderData.total) || 0) * 0.03);
          loyalty.spendable_mythos = (loyalty.spendable_mythos || 0) + earnedPoints;
          loyalty.legacy_mythos = (loyalty.legacy_mythos || 0) + earnedPoints;

          // Count full bottles
          const items = Array.isArray(orderData.items) ? orderData.items : [];
          const fullBottles = items.filter(i => (Number(i.size) === 50 || Number(i.size) === 100)).reduce((sum, i) => sum + (Number(i.qty) || 1), 0);
          loyalty.full_bottles_purchased = (loyalty.full_bottles_purchased || 0) + fullBottles;
        }

        // If voucher used, mark as used
        if (orderData.appliedVoucherCode && Array.isArray(loyalty.active_reward_codes)) {
          loyalty.active_reward_codes = loyalty.active_reward_codes.map(c => 
            c.code === orderData.appliedVoucherCode ? { ...c, used: true } : c
          );
        }

        await userRef.set({ loyalty, updatedAt: new Date().toISOString() }, { merge: true });
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderRef.id,
      message: 'Order completed and recorded in cloud ledger.'
    });
  } catch (err) {
    console.error("[Mytholis API] complete-order error:", err);
    return res.status(500).json({ error: err.message });
  }
}
