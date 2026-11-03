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
