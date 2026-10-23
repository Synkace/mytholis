import { defineConfig } from 'vite';
import crypto from 'crypto';
import shiprocketSyncProductsHandler from './api/shiprocket-sync-products.js';

const shiprocketSyncMiddleware = (req, res, next) => {
  if (req.url && (req.url.startsWith('/api/shiprocket-sync-products') || req.url.startsWith('/api/shiprocket-sync-products/'))) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (_) {
        req.body = {};
      }
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      await shiprocketSyncProductsHandler(req, res);
    });
  } else {
    next();
  }
};

const fastrrApiMiddleware = (req, res, next) => {
  if (req.url && req.url.startsWith('/api/fastrr/create-checkout') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const items = data.items || [];
        const VARIANT_MAP = {
          'king-scar': { 8: '10011', 50: '10012', 100: '10013', default: '10012' },
          'petralux': { 8: '10021', 50: '10022', 100: '10023', default: '10022' },
          'oud-rion': { 8: '10031', 50: '10032', 100: '10033', default: '10032' },
          'spark': { 8: '10041', 50: '10042', 100: '10043', default: '10042' },
          'wood-sera': { 8: '10051', 50: '10052', 100: '10053', default: '10052' },
          'ash': { 8: '10061', 50: '10062', 100: '10063', default: '10062' },
          'mytholis-discovery-set': { 48: '10071', 60: '10071', default: '10071' }
        };
        const fastrrItems = items.map(item => {
          let variantId = item.variant_id;
          if (!variantId && item.productId) {
            const sizeMap = VARIANT_MAP[item.productId] || {};
            const parsedSize = parseInt(item.size, 10);
            variantId = sizeMap[item.size] || sizeMap[parsedSize] || sizeMap[50] || sizeMap.default || '10022';
          }
          return { variant_id: String(variantId || '10022'), quantity: parseInt(item.quantity, 10) || 1 };
        });

        const payload = {
          cart_data: { items: fastrrItems },
          redirect_url: data.redirect_url || 'https://mytholis.com/#track-order',
          timestamp: new Date().toISOString()
        };

        const rawBody = JSON.stringify(payload);
        const secret = 'bgHG23KYS9CZi8Pvo2UgmuyBWlacgKqo';
        const apiKey = 'GkmYB8JVVgvPFLiN';
        const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

        const resp = await fetch('https://checkout-api.shiprocket.com/api/v1/access-token/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
            'X-Api-HMAC-SHA256': hmac
          },
          body: rawBody
        });

        const resJson = await resp.json().catch(() => ({}));
        res.setHeader('Content-Type', 'application/json');
        if (resJson.ok && resJson.result?.token) {
          res.end(JSON.stringify({
            success: true,
            token: resJson.result.token,
            order_id: resJson.result?.data?.order_id,
            redirect_url: data.redirect_url
          }));
        } else {
          res.end(JSON.stringify({ success: false, error: resJson.error?.message || 'Fastrr catalog notice' }));
        }
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
  } else {
    next();
  }
};

const fastrrPlugin = () => ({
  name: 'fastrr-local-api',
  configureServer(server) {
    server.middlewares.use(shiprocketSyncMiddleware);
    server.middlewares.use(fastrrApiMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use(shiprocketSyncMiddleware);
    server.middlewares.use(fastrrApiMiddleware);
  }
});

export default defineConfig({
  plugins: [fastrrPlugin()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules/pdf-lib')) {
            return 'vendor-pdf';
          }
          if (id.includes('adminComponents') || id.includes('labelRebrander')) {
            return 'admin-bundle';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/__/auth': {
        target: 'https://mytholis-1.firebaseapp.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    port: 3000,
    proxy: {
      '/__/auth': {
        target: 'https://mytholis-1.firebaseapp.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
