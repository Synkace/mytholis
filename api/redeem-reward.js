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

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  const { rewardId, cost, rewardTitle, rewardType, amount, minOrder } = req.body || {};
  if (!rewardId) {
    return res.status(400).json({ error: 'Missing rewardId' });
  }

  try {
    const userRef = adminDb.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : { loyalty: {} };
    const loyalty = userData.loyalty || {};

    const currentPoints = loyalty.spendable_mythos || 0;
    const requiredCost = Number(cost) || 0;

    if (currentPoints < requiredCost) {
      return res.status(400).json({ error: 'Insufficient Spendable Mythos' });
    }

    loyalty.spendable_mythos = currentPoints - requiredCost;
    const uniqueCode = `MYTH-${rewardId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReward = {
      code: uniqueCode,
      id: rewardId,
      title: rewardTitle || 'Vault Concession',
      type: rewardType || 'discount',
      amount: Number(amount) || 0,
      minOrder: Number(minOrder) || 0,
      used: false,
      createdAt: new Date().toISOString()
    };

    const activeCodes = Array.isArray(loyalty.active_reward_codes) ? loyalty.active_reward_codes : [];
    activeCodes.unshift(newReward);
    loyalty.active_reward_codes = activeCodes;

    await userRef.set({ loyalty, updatedAt: new Date().toISOString() }, { merge: true });

    return res.status(200).json({
      success: true,
      code: uniqueCode,
      reward: newReward,
      remainingMythos: loyalty.spendable_mythos
    });
  } catch (err) {
    console.error("[Mytholis API] redeem-reward error:", err);
    return res.status(500).json({ error: err.message });
  }
}
