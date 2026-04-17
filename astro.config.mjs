import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://keygene.top',
  integrations: [
    preact(),
    AstroPWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{html,css,js,png,jpg,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/keygene\.top\/api\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /^https:\/\/.*\.r2\.dev\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'tile-cache', expiration: { maxEntries: 500, maxAgeSeconds: 86400 * 30 } },
          },
        ],
      },
    }),
  ],
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    ssr: {
      noExternal: ['leaflet'],
    },
  },
});
