// Checks every internal link of the built docs: each href or src under the base path must be a built
// file, and each #anchor must be an id on the target page (or on the same page for "#..." links).
//
//   node scripts/check-links.mjs [--dist dist] [--base /docs]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const dist = resolve(here, opt('--dist', 'dist'));
const base = opt('--base', process.env.DOCS_BASE ?? '/docs').replace(/\/$/, '');
if (!existsSync(dist)) {
  console.error(`No build at ${dist}. Run npm run build first.`);
  process.exit(2);
}
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const pages = walk(dist).filter((f) => f.endsWith('.html'));
const urlOf = (f) => base + '/' + relative(dist, f).split(sep).join('/').replace(/index\.html$/, '');
const ids = new Map();
const idsOf = (f) => {
  if (!ids.has(f)) ids.set(f, new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(f);
};
const fileFor = (path) => {
  if (!path.startsWith(base + '/')) return null;
  const rel = decodeURIComponent(path.slice(base.length));
  for (const c of rel.endsWith('/') ? [rel + 'index.html'] : [rel, rel + '/index.html']) {
    const f = join(dist, c);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
};

const broken = [];
let n = 0;
for (const page of pages) {
  const html = readFileSync(page, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
    n++;
    const [pathAndQuery, hash] = raw.split('#');
    const path = pathAndQuery.split('?')[0];
    const target = path === '' ? page : path.startsWith('/') ? fileFor(path) : fileFor(new URL(path, 'http://x' + urlOf(page)).pathname);
    if (!target) {
      broken.push(`${urlOf(page)} -> ${raw} (no such page)`);
      continue;
    }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) broken.push(`${urlOf(page)} -> ${raw} (no such anchor)`);
  }
}
if (broken.length) {
  console.error([...new Set(broken)].join('\n'));
  console.error(`\n${new Set(broken).size} broken link(s) out of ${n}.`);
  process.exit(1);
}
console.log(`OK: ${n} internal links across ${pages.length} pages resolve.`);
