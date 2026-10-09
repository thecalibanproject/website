// Helpers for docs rendered from ../docs.

/** First Markdown H1, without a leading "NN — " number prefix. */
export function docTitle(body: string | undefined, fallback: string): string {
  const m = body?.match(/^#\s+(.+)$/m);
  if (!m) return fallback;
  return m[1].replace(/^\d\d\s+[—–-]\s+/, '').trim();
}

/** The italic "*Research date …*" line that most notes start with, if present. */
export function docDateline(body: string | undefined): string | undefined {
  const m = body?.match(/^\*([^*\n]*(?:20\d\d-\d\d-\d\d)[^*\n]*)\*$/m);
  return m?.[1];
}

/** Rough reading time at ~230 words per minute. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** Map a path relative to the docs repo root (e.g. research/03-foo.md) to a site route, or null. */
export function docRoute(rel: string): string | null {
  const clean = rel.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (clean === 'research' || clean === 'research/' || clean === 'README.md') return '/research/';
  const m = clean.match(/^research\/(\d\d-[a-z0-9-]+)\.md$/);
  if (m) return `/research/${m[1]}/`;
  if (clean === 'architecture/caliban-reference-architecture.md') return '/architecture/reference/';
  if (clean === 'architecture/repos-and-conventions.md') return '/architecture/repos-and-conventions/';
  return null;
}

function resolveRel(fromDir: string, target: string): string {
  const parts = fromDir.split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/') + (target.endsWith('/') ? '/' : '');
}

/**
 * Post-process rendered doc HTML:
 * - rewrite relative links between docs (../research/03-x.md#y → /research/03-x/#y);
 *   relative links that leave the docs tree are unwrapped to plain text;
 * - open external links in a new tab;
 * - wrap tables in a focusable, horizontally scrollable region;
 * - drop the leading H1 (the page renders its own title).
 * `dir` is the doc's folder relative to the docs root, e.g. "research".
 */
export function processDocHtml(html: string, dir: string): string {
  let out = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/, '');
  out = out.replace(/<a href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (all, href: string, rest: string, text: string) => {
    if (/^https?:/.test(href)) return `<a href="${href}"${rest} target="_blank" rel="noopener noreferrer">${text}</a>`;
    if (/^(#|\/|mailto:)/.test(href)) return all;
    const [target, hash] = href.split('#');
    const route = docRoute(resolveRel(dir, target));
    if (!route) return text;
    return `<a href="${route}${hash ? `#${hash}` : ''}"${rest}>${text}</a>`;
  });
  out = out.replace(/<table>/g, '<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable table"><table>').replace(/<\/table>/g, '</table></div>');
  return out;
}
