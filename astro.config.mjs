import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://keygene.top',
  integrations: [preact()],
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
