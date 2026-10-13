// @ts-check
// Caliban user docs: an Astro Starlight site, built to static files under /docs/.
// Offline by construction: self-hosted fonts, no CDN, no analytics, no external images,
// Pagefind search as a static index. The same build is meant to be served by the control
// plane at /docs/ inside an air-gapped install (see README.md, "Serving from the control plane").
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { fileURLToPath } from 'node:url';
import remarkMdLinks from './src/plugins/remark-md-links.mjs';

// SITE_URL only feeds canonical links; the docs never fetch from it.
const site = process.env.SITE_URL ?? 'https://caliban.example.com';
// The path the docs are served under. /docs on the website and in the control plane;
// a versioned bundle can be built with DOCS_BASE=/docs/0.2 (the console links stay /docs/...).
const base = process.env.DOCS_BASE ?? '/docs';
const contentDir = fileURLToPath(new URL('./src/content/docs', import.meta.url));

export default defineConfig({
  site,
  base,
  // The unified (remark) processor runs the link plugin; Starlight's asides work on it too.
  markdown: { processor: unified({ remarkPlugins: [[remarkMdLinks, { base, contentDir }]] }) },
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // Screenshots are optimised to WebP once, by hand (see README). No image pipeline at build time.
  image: { service: passthroughImageService() },
  integrations: [
    starlight({
      title: 'Caliban docs',
      description: 'Install, run and build on Caliban, the sovereign AI gateway.',
      logo: { light: './src/assets/logo.svg', dark: './src/assets/logo-white.svg', replacesTitle: false, alt: 'Caliban' },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/caliban.css'],
      // Nothing that phones home: no edit links to a forge, no social links, no last-updated from git.
      lastUpdated: false,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      // Pagefind is Starlight's default search and builds a static index next to the pages.
      pagefind: true,
      // Code samples: the expressive-code defaults, no remote themes.
      expressiveCode: { themes: ['github-dark-default', 'github-light-default'], styleOverrides: { borderRadius: '0px' } },
      // Room for French and Arabic (RTL) later: Starlight's i18n takes a `locales` map here.
      defaultLocale: 'root',
      locales: { root: { label: 'English', lang: 'en' } },
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Where to begin', link: '/start/' },
            { label: 'Gateway quickstart', link: '/start/gateway-quickstart/' },
            { label: 'Install and check', link: '/start/install/' },
            { label: 'Your first assistant', link: '/start/first-assistant/' },
            { label: 'The sample workspace', link: '/start/sandbox/' },
          ],
        },
        {
          label: 'How-to guides',
          items: [
            { label: 'Models', link: '/guides/models/' },
            { label: 'Workspaces', link: '/guides/workspaces/' },
            { label: 'Privacy and personal data', link: '/guides/privacy/' },
            { label: 'Data connections', link: '/guides/data-connections/' },
            { label: 'Data dictionary', link: '/guides/data-dictionary/' },
            { label: 'Topics', link: '/guides/topics/' },
            { label: 'Assistants', link: '/guides/assistants/' },
            { label: 'Knowledge', link: '/guides/knowledge/' },
            { label: 'Tests and going live', link: '/guides/tests-and-go-live/' },
            { label: 'Approvals', link: '/guides/approvals/' },
            { label: 'Connected systems', link: '/guides/connected-systems/' },
            { label: 'Conversations and runs', link: '/guides/conversations-and-runs/' },
            { label: 'Usage and costs', link: '/guides/usage-and-costs/' },
            { label: 'Audit log', link: '/guides/audit/' },
            { label: 'People and roles', link: '/guides/people-and-roles/' },
            { label: 'API keys', link: '/guides/api-keys/' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'How routing works', link: '/concepts/how-routing-works/' },
            { label: 'How privacy works', link: '/concepts/how-privacy-works/' },
            { label: 'The safety model', link: '/concepts/safety-model/' },
            { label: 'Assistants and versions', link: '/concepts/assistants-and-versions/' },
            { label: 'The data dictionary', link: '/concepts/data-dictionary/' },
            { label: 'Caching', link: '/concepts/caching/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Glossary', link: '/reference/glossary/' },
            { label: 'HTTP API', link: '/reference/api/' },
            { label: 'Assistant spec', link: '/reference/assistant-spec/' },
            { label: 'SDKs', link: '/reference/sdks/' },
            { label: 'Response headers', link: '/reference/response-headers/' },
            { label: 'Errors', link: '/reference/errors/' },
            { label: 'Limits', link: '/reference/limits/' },
            { label: 'Configuration', link: '/reference/configuration/' },
          ],
        },
      ],
    }),
  ],
});
