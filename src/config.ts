// Site-wide constants. Change CONTACT_EMAIL here; every "Talk to us" link reads it.
export const CONTACT_EMAIL = 'elie@internalizable.dev';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Caliban')}`;

export const SITE_NAME = 'Caliban';
export const SITE_TAGLINE = 'The sovereign AI gateway for your company’s data';
export const SITE_DESCRIPTION =
  'Caliban is one endpoint for every model: grounded in your data through an ontology, private by default with reversible pseudonymization, and able to run 100% on your own hardware.';

export const COPYRIGHT = '© 2026 Elie Sfeir. All rights reserved.';

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  /** Three-letter strip code (platform pages). */
  code?: string;
}

export const PLATFORM_LINKS: NavLink[] = [
  { label: 'Ontology', code: 'ONT', href: '/platform/ontology/', description: 'Ground every answer in a governed model of your data' },
  { label: 'Routing', code: 'RTE', href: '/platform/routing/', description: 'Send each request to the cheapest model that meets the bar' },
  { label: 'Privacy', code: 'PII', href: '/platform/privacy/', description: 'Reversible pseudonymization, streaming rehydration' },
  { label: 'Caching', code: 'CCH', href: '/platform/caching/', description: 'Provider prefix steering and tenant-scoped caches' },
  { label: 'Nodes', code: 'NOD', href: '/platform/nodes/', description: 'Typed, budgeted AI sub-apps over MCP and A2A' },
  { label: 'Open models', code: 'OPN', href: '/platform/open-models/', description: 'Qwen, gpt-oss and friends on your GPUs or CPUs' },
];

export const MAIN_NAV: NavLink[] = [
  { label: 'Architecture', href: '/architecture/' },
  { label: 'Deployment', href: '/deployment/' },
  { label: 'Developers', href: '/developers/' },
  { label: 'Research', href: '/research/' },
];
