// House rule: no em dashes and no en dashes in the docs. Use a comma, a colon or parentheses.
//   node scripts/check-dashes.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dirs = ['src', 'scripts', 'README.md', 'docs-links.md', 'astro.config.mjs'];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p]);
const bad = [];
for (const d of dirs) {
  for (const f of walk(join(root, d))) {
    if (!/\.(md|mdx|mjs|js|ts|css|astro|json)$/.test(f)) continue;
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/[\u2013\u2014]/.test(line)) bad.push(`${relative(root, f)}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }
}
if (bad.length) {
  console.error(bad.join('\n'));
  console.error(`\n${bad.length} line(s) with an em or en dash.`);
  process.exit(1);
}
console.log('OK: no em or en dashes.');
