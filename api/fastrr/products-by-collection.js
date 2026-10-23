import { FASTRR_PRODUCTS } from './_catalogData.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const collectionId = parseInt(query.collection_id) || query.collection_id;
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;

  const filtered = collectionId
    ? FASTRR_PRODUCTS.filter(p => p.collection_id == collectionId)
    : FASTRR_PRODUCTS;

  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return res.status(200).json({
    data: {
      total: filtered.length,
      collection_id: collectionId,
      page: page,
      limit: limit,
      products: paginated
    }
  });
}
