// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mangochutney.com.au',
  trailingSlash: 'never',
  build: { format: 'file' },

  output: 'static',

  integrations: [sitemap({ filter: (page) => !page.endsWith('/contact/sent') })],

  vite: {
    plugins: [tailwindcss()],
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  // Self hosted with metric matched fallbacks
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Figtree',
      cssVariable: '--font-brand',
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
