import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Mandatory for CrazyGames - strictly relative asset paths
  server: {
    port: 3020,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
