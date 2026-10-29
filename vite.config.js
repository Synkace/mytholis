import { defineConfig } from 'vite';

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
