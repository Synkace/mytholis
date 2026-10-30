import { adminAuth, adminDb } from './_firebaseAdmin.js';

// Authoritative Server-Side Loyalty Reward Table
const SERVER_REWARDS = {
  "DISC_200": { cost: 200, amount: 200, type: "discount", title: "₹200 Off Voucher" },
  "DISC_400": { cost: 400, amount: 400, type: "discount", title: "₹400 Off Voucher" },
  "FREE_8ML": { cost: 500, amount: 0, type: "gift", title: "Free 8ml Deluxe Travel Spray" },
  "DISC_800": { cost: 800, amount: 800, type: "discount", title: "₹800 Off Voucher" },
  "FREE_15ML": { cost: 1100, amount: 0, type: "gift", title: "Exclusive 15ml Vault Flacon" },
  "DISC_2500": { cost: 2500, amount: 2500, type: "discount", title: "₹2,500 Off Voucher" },
  "FREE_50ML": { cost: 3500, amount: 0, type: "gift", title: "Free 50ml Extrait Bottle" },
  "FREE_100ML": { cost: 5000, amount: 0, type: "gift", title: "Free 100ml Extrait Bottle" }
};

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

  const { rewardId } = req.body || {};
  if (!rewardId || !SERVER_REWARDS[rewardId]) {
    return res.status(400).json({ error: 'Invalid or unsupported rewardId' });
  }

  const rewardConfig = SERVER_REWARDS[rewardId];

  try {
    const userRef = adminDb.collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : { loyalty: {} };
    const loyalty = userData.loyalty || {};

    const currentPoints = loyalty.spendable_mythos || 0;
    const requiredCost = rewardConfig.cost;

    if (currentPoints < requiredCost) {
      return res.status(400).json({ error: 'Insufficient Spendable Mythos' });
    }

    loyalty.spendable_mythos = currentPoints - requiredCost;
    const uniqueCode = `MYTH-${rewardId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReward = {
      code: uniqueCode,
      id: rewardId,
      title: rewardConfig.title,
      type: rewardConfig.type,
      amount: rewardConfig.amount,
      minOrder: 0,
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
