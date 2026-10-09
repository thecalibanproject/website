// Verifies that every internal href/src in dist/ resolves to a built file, including #anchors.
// Usage: npm run build && node scripts/check-links.mjs [distDir]
// Exit code 1 if any link is broken. External links (http:, https:, mailto:, …) are not fetched.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
if (!existsSync(dist)) {
  console.error(`No build output at ${dist}. Run npm run build first.`);
  process.exit(2);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const css = files.filter((f) => f.endsWith('.css'));

/** URL path of a built file, e.g. dist/research/index.html → /research/ */
const urlOf = (file) => {
  const rel = '/' + relative(dist, file).split(sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

/** Built file for a URL path, or null. */
function fileFor(pathname) {
  let p = decodeURIComponent(pathname);
  const candidates = p.endsWith('/') ? [p + 'index.html'] : [p, p + '/index.html', p + '.html'];
  for (const c of candidates) {
    const f = join(dist, c);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const src = readFileSync(file, 'utf8');
    const ids = new Set();
    for (const m of src.matchAll(/\s(?:id|name)="([^"]+)"/g)) ids.add(m[1]);
    idCache.set(file, ids);
  }
  return idCache.get(file);
}

const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i; // any scheme (http:, mailto:, data:, …) or protocol-relative
const broken = [];
let checked = 0;
let anchors = 0;

function check(ref, fromFile, baseUrl, kind) {
  const raw = ref.trim().replace(/&amp;/g, '&');
  if (!raw || SKIP.test(raw)) return;
  checked++;
  const url = new URL(raw, `http://site${baseUrl}`);
  const target = url.pathname === new URL(`http://site${baseUrl}`).pathname && raw.startsWith('#') ? fromFile : fileFor(url.pathname);
  const where = `${relative(dist, fromFile)} (${kind})`;
  if (!target) {
    broken.push(`${where}: ${raw} → no file for ${url.pathname}`);
    return;
  }
  if (url.hash && url.hash.length > 1) {
    anchors++;
    if (!target.endsWith('.html')) return;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!idsOf(target).has(id)) broken.push(`${where}: ${raw} → no id="${id}" in ${relative(dist, target)}`);
  }
}

for (const file of html) {
  const src = readFileSync(file, 'utf8');
  const base = urlOf(file);
  for (const m of src.matchAll(/\s(href|src)="([^"]*)"/g)) check(m[2], file, base, m[1]);
  for (const m of src.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) check(part.trim().split(/\s+/)[0], file, base, 'srcset');
  }
}
for (const file of css) {
  const src = readFileSync(file, 'utf8');
  const base = urlOf(file);
  for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) check(m[1], file, base, 'css url');
}

console.log(`Checked ${checked} internal links (${anchors} with anchors) in ${html.length} HTML and ${css.length} CSS files.`);
if (broken.length) {
  console.error(`\n${broken.length} broken:\n` + broken.map((b) => `  ✗ ${b}`).join('\n'));
  process.exit(1);
}
console.log('No broken internal links.');
