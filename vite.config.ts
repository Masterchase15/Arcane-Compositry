/**
 * vite.config.ts - builds the React front end (web/) into dist/, which server.js serves.
 *
 *   npm run dev:web    the React app with live reload on http://localhost:5173
 *                      (run `npm run dev` alongside it: /api requests go to the Node server on :3000)
 *   npm run build      makes dist/ for production
 */
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'web',
  publicDir: 'public', // web/public: icons, manifest, service worker - copied as-is
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'web/src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
