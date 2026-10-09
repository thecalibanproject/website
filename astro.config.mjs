// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const calibanScope = JSON.parse(readFileSync(new URL('./src/lib/caliban-scope.theme.json', import.meta.url), 'utf8'));

// Canonical origin used for the sitemap, canonical links and absolute OG image URLs.
// Set SITE_URL at build time for the real deployment (see README).
const site = process.env.SITE_URL ?? 'https://caliban.example.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: calibanScope } },
});
