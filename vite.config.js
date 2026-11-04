import { defineConfig } from 'vite';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5001';
const isLocalApi = apiProxyTarget.startsWith('http://127.0.0.1') || apiProxyTarget.startsWith('http://localhost');

export default defineConfig({
  plugins: [],
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
          /* sanitize.js is used by both the storefront and the founder console.
             Without an explicit home, Rollup folds it into the lazy admin
             chunk, which turns that chunk into a static dependency of the entry
             and pulls the whole console back into the shopper bundle. */
          if (id.includes('/js/sanitize.js') || id.includes('\\js\\sanitize.js')) {
            return 'sanitize';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules/pdf-lib')) {
            return 'vendor-pdf';
          }
          /* Founder-only code, split so the storefront never loads it and the
             console does not drag in the PDF engine. Both are reached through
             dynamic import() in js/app.js. */
          if (id.includes('adminComponents')) {
            return 'admin-bundle';
          }
          if (id.includes('labelRebrander')) {
            return 'label-bundle';
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: !isLocalApi
      },
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
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: !isLocalApi
      },
      '/__/auth': {
        target: 'https://mytholis-1.firebaseapp.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
