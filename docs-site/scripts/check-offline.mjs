// Fails when the built docs would load anything from another origin, so the bundle works in an
// air-gapped install. Checks every HTML page (src, href of <link>, srcset, inline style url())
// and every CSS and JS file (url(), @import, fetch/import of absolute URLs).
// Outbound <a href> links are allowed: they are only followed when a reader clicks them.
// Also checks that the Pagefind search index is in the build and covers every page marked for search.
//
//   node scripts/check-offline.mjs [dist]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(fileURLToPath(new URL('..', import.meta.url)), process.argv[2] ?? 'dist');
if (!existsSync(dist)) {
  console.error(`No build at ${dist}. Run npm run build first.`);
  process.exit(2);
}
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const files = walk(dist);
const ext = /^(?:https?:)?\/\//i;
// Namespace URIs and spec links that never trigger a request.
const harmless = /^https?:\/\/(?:www\.w3\.org\/|schema\.org)/i;
const problems = [];
const flag = (file, url, what) => {
  if (!harmless.test(url)) problems.push(`${relative(dist, file)}: ${what} ${url}`);
};

for (const f of files) {
  const e = extname(f);
  if (e === '.html') {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<(script|img|iframe|video|audio|source|embed|object|track)\b[^>]*?\s(?:src|data)="([^"]+)"/gi))
      if (ext.test(m[2])) flag(f, m[2], `<${m[1]} src>`);
    for (const m of src.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const href = tag.match(/\shref="([^"]+)"/i)?.[1];
      const rel = tag.match(/\srel="([^"]+)"/i)?.[1] ?? '';
      // canonical, alternate and sitemap links name the public site; they load nothing.
      if (href && ext.test(href) && !/\b(canonical|alternate|sitemap)\b/i.test(rel)) flag(f, href, `<link rel="${rel}">`);
    }
    for (const m of src.matchAll(/\ssrcset="([^"]+)"/gi))
      for (const u of m[1].split(',').map((s) => s.trim().split(/\s+/)[0])) if (ext.test(u)) flag(f, u, 'srcset');
    for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)/gi)) if (ext.test(m[1])) flag(f, m[1], 'css url()');
  } else if (e === '.css') {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)/gi)) if (ext.test(m[1])) flag(f, m[1], 'css url()');
    for (const m of src.matchAll(/@import\s+(?:url\()?['"]?([^'");\s]+)/gi)) if (ext.test(m[1])) flag(f, m[1], '@import');
  } else if (e === '.js' || e === '.mjs') {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\b(?:fetch|import)\(\s*['"`](https?:\/\/[^'"`]+)/g)) flag(f, m[1], 'script request');
    for (const m of src.matchAll(/\bfrom\s*['"](https?:\/\/[^'"]+)/g)) flag(f, m[1], 'script import');
  }
}

// Search works offline only if the Pagefind index ships with the pages and covers each of them.
const entry = join(dist, 'pagefind', 'pagefind-entry.json');
const searchable = files.filter((f) => f.endsWith('.html') && readFileSync(f, 'utf8').includes('data-pagefind-body')).length;
let indexed = 0;
if (!existsSync(entry)) problems.push('pagefind/pagefind-entry.json: no Pagefind search index in the build');
else {
  indexed = Object.values(JSON.parse(readFileSync(entry, 'utf8')).languages ?? {}).reduce((n, l) => n + (l.page_count ?? 0), 0);
  if (searchable === 0) problems.push('no page is marked for search (data-pagefind-body)');
  if (indexed !== searchable) problems.push(`pagefind: ${indexed} page(s) indexed, ${searchable} marked for search`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${dist}.`);
  process.exit(1);
}
console.log(`OK: ${files.length} files in ${dist} load nothing from another origin; the search index covers ${indexed} pages.`);
