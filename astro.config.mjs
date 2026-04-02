// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://steveand.com',

  integrations: [mdx(), sitemap({
			filter: (page) => !page.includes('/reference/'),
  }), react()],

  redirects: {
      '/blog': '/',
	},

  vite: {
    plugins: [tailwindcss()],
  },
});