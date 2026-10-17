import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-gsap': ['gsap']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
