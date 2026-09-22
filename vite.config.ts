import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_ANIME_API_URL': JSON.stringify('https://kinomaapi.vercel.app'),
      'process.env.REANIME_API_URL': JSON.stringify('https://kinomaapi.vercel.app')
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'tv-banner-320x180.png'],
        manifest: {
          id: '/',
          name: 'Kinoma - Anime & Movie Streaming',
          short_name: 'Kinoma',
          description: 'Unified anime streaming platform with modern layout, Netflix-style cinematic intro, and Android TV support.',
          theme_color: '#0b0c10',
          background_color: '#0b0c10',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          orientation: 'any',
          categories: ['entertainment', 'video'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/tv-banner-320x180.png',
              sizes: '320x180',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
