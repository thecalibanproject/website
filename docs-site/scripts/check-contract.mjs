// Checks the console to docs link contract against the built docs.
//
//   node scripts/check-contract.mjs [--contract docs-links.md] [--dist dist] [--base /docs]
//   node scripts/check-contract.mjs --scan ../../web/src     # every /docs/... link found in a source tree
//
// Contract mode reads every line of the contract that names a page (`- /docs/start/gateway-quickstart/ ...`)
// and its anchors (`#point-your-app`, after "Anchors:" or a colon), and checks that the page exists in
// dist/ and that each anchor is an id on that page. Scan mode does the same for every `/docs/<route>#<anchor>`
// string it finds in .ts, .tsx, .js, .jsx, .md and .json files, so the console's links can be checked
// before they ship. Exit code 1 lists every missing page or anchor.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const dist = resolve(here, opt('--dist', 'dist'));
const base = opt('--base', '/docs').replace(/\/$/, '');
const scan = opt('--scan', null);
const contract = resolve(here, opt('--contract', 'docs-links.md'));

if (!existsSync(dist)) {
  console.error(`No build at ${dist}. Run npm run build first.`);
  process.exit(2);
}

/** @type {Map<string, Set<string>>} route -> anchors */
const wanted = new Map();
const want = (route, anchor) => {
  if (!wanted.has(route)) wanted.set(route, new Set());
  if (anchor) wanted.get(route).add(anchor);
};

if (scan) {
  const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
      if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) return [];
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.md', '.json']);
  // Literal links: "/docs/guides/privacy/#modes" (not "core/docs/nodes.md").
  const re = new RegExp(`(?<![\\w./-])${base.replace(/[/]/g, '\\/')}(\\/[a-z0-9\\-/]*)(#[a-z0-9\\-]+)?(?![\\w.])`, 'g');
  // The console's typed table (web/src/lib/docs.ts): DOCS_PAGES = { 'guides/privacy': ['modes', ...], start: [] }.
  const table = /(?:'([a-z0-9\-/]+)'|\b([a-z]+))\s*:\s*\[([^\]]*)\]/g;
  for (const f of walk(resolve(scan)).filter((f) => exts.has(extname(f)))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(re)) {
      const route = m[1].endsWith('/') ? m[1] : m[1] + '/';
      want(route, m[2]?.slice(1));
    }
    const at = src.indexOf('DOCS_PAGES');
    if (at >= 0) {
      const body = src.slice(at, src.indexOf('} as const', at) > 0 ? src.indexOf('} as const', at) : undefined);
      for (const m of body.matchAll(table)) {
        const route = `/${m[1] ?? m[2]}/`;
        want(route);
        for (const a of m[3].replace(/\/\/.*$/gm, '').matchAll(/'([a-z0-9-]+)'/g)) want(route, a[1]);
      }
    }
  }
  console.log(`Scanned ${scan}: ${wanted.size} docs pages linked.`);
} else {
  for (const line of readFileSync(contract, 'utf8').split('\n')) {
    const m = line.match(/^\s*-\s+(\/docs(\/[^\s:]*)?)\s*(?::|$)(.*)$/);
    if (!m) continue;
    let route = (m[2] ?? '/') || '/';
    if (!route.endsWith('/')) route += '/';
    want(route);
    // Anchors: every #slug on the line after the path ("Anchors: #a, #b" or ": #a, #b").
    for (const a of (m[3] ?? '').matchAll(/#([a-z0-9][a-z0-9-]*)/g)) want(route, a[1]);
  }
  console.log(`Contract ${contract}: ${wanted.size} pages.`);
}

const fileFor = (route) => {
  const f = join(dist, route, 'index.html');
  return existsSync(f) ? f : null;
};
const idsOf = (file) => new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const problems = [];
let anchors = 0;
for (const [route, set] of [...wanted].sort()) {
  const file = fileFor(route);
  if (!file) {
    problems.push(`missing page  ${base}${route}`);
    continue;
  }
  const ids = idsOf(file);
  for (const a of set) {
    anchors++;
    if (!ids.has(a)) problems.push(`missing anchor ${base}${route}#${a}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s): ${wanted.size} pages, ${anchors} anchors checked.`);
  process.exit(1);
}
console.log(`OK: ${wanted.size} pages and ${anchors} anchors exist in ${dist}.`);
