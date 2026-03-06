import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://hbimplants.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thank-you') && !page.includes('/referral'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
    tailwind(),
  ],
});
