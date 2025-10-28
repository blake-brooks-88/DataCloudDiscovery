import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, 'client'),
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env['NODE_ENV'] !== 'production' && process.env['REPL_ID']
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) => m.cartographer()),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
  },
});
