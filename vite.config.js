import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pwaOrigin =
  process.env.VITE_PWA_ORIGIN ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://snap-expense-gray.vercel.app');

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['se-192x192.png', 'se-512x512.png'],
      manifest: {
        id: '/',
        name: 'SnapExpense',
        short_name: 'SnapExpense',
        description:
          'Track UPI expenses from screenshots and view spending insights.',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'productivity', 'utilities'],
        launch_handler: {
          client_mode: 'navigate-existing',
        },
        share_target: {
          action: `${pwaOrigin}/share-target`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'image',
                accept: [
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'image/webp',
                  'image/*',
                  '.jpg',
                  '.jpeg',
                  '.png',
                  '.webp',
                ],
              },
            ],
          },
        },
        icons: [
          {
            src: '/se-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/se-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
