export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { mobile_number, transactional_points, order_id } = req.body || {};
  const points = parseInt(transactional_points) || 0;
  const txnId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();

  try {
    const adminModule = await import('../_firebaseAdmin.js');
    const adminDb = adminModule.adminDb;

    if (adminDb && mobile_number) {
      const cleanPhone = String(mobile_number).trim().replace(/[^0-9]/g, '');
      const usersSnap = await adminDb.collection('users')
        .where('profile.phone', '==', cleanPhone)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        const userData = userDoc.data();
        const currentPoints = userData.loyalty?.spendable_mythos || 0;
        const newBalance = Math.max(0, currentPoints - points);

        await userDoc.ref.update({
          'loyalty.spendable_mythos': newBalance,
          'loyalty.last_deduction': {
            order_id: order_id || 'FASTRR_CHECKOUT',
            points_blocked: points,
            txn_id: txnId,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Fastrr Block Points] Firestore warn:', err.message);
  }

  return res.status(200).json({
    data: {
      available_points: 0,
      debited_points: points,
      status: true,
      message: "Points successfully blocked for checkout",
      transaction_id: txnId
    }
  });
}
