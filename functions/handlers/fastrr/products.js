import { FASTRR_PRODUCTS } from './_catalogData.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;
  const startIndex = (page - 1) * limit;
  const paginatedProducts = FASTRR_PRODUCTS.slice(startIndex, startIndex + limit);

  return res.status(200).json({
    data: {
      total: FASTRR_PRODUCTS.length,
      page: page,
      limit: limit,
      products: paginatedProducts
    }
  });
}
