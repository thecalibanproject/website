// Full-page screenshots of every page at 1440×900 and 390×844 using the locally installed Chrome.
// Usage: npm run preview (in another shell), then: node scripts/screenshots.mjs [baseUrl] [only-path…]
import { chromium } from 'playwright-core';
import { mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const base = process.argv[2] ?? 'http://localhost:4321';
const only = process.argv.slice(3);
const pages = [
  ['home', '/'], ['architecture', '/architecture/'], ['architecture-reference', '/architecture/reference/'],
  ['repos-and-conventions', '/architecture/repos-and-conventions/'], ['deployment', '/deployment/'],
  ['developers', '/developers/'], ['research', '/research/'], ['research-03', '/research/03-ontology-and-datasource-layer/'],
  ['research-09', '/research/09-open-models-on-prem/'], ['brand', '/brand/'],
  ['platform-ontology', '/platform/ontology/'], ['platform-routing', '/platform/routing/'], ['platform-privacy', '/platform/privacy/'],
  ['platform-caching', '/platform/caching/'], ['platform-nodes', '/platform/nodes/'], ['platform-open-models', '/platform/open-models/'],
  ['404', '/404.html'],
].filter(([n]) => !only.length || only.includes(n));
const sizes = [['desktop', 1440, 900], ['mobile', 390, 844]];

await mkdir('screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
for (const [label, width, height] of sizes) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  for (const [name, path] of pages) {
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} ${label}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${name} ${label}: ${e.message}`));
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    if (!res || (res.status() >= 400 && name !== '404')) errors.push(`${name}: HTTP ${res?.status()}`);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`${name} ${label}: horizontal overflow ${overflow}px`);
    // Chrome cannot capture more than ~16k px in one shot: capture 6000px slices and stitch them.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const out = `screenshots/${name}-${label}.png`;
    if (total <= 15000) {
      await page.screenshot({ path: out, fullPage: true });
    } else {
      const parts = [];
      for (let y = 0, i = 0; y < total; y += 6000, i++) {
        const part = `screenshots/.part-${i}.png`;
        await page.screenshot({ path: part, fullPage: true, clip: { x: 0, y, width, height: Math.min(6000, total - y) } });
        parts.push(part);
      }
      execFileSync('python3', ['-c', `import sys\nfrom PIL import Image\nims=[Image.open(p) for p in sys.argv[2:]]\nout=Image.new('RGB',(ims[0].width,sum(i.height for i in ims)),'white')\ny=0\nfor i in ims:\n    out.paste(i,(0,y)); y+=i.height\nout.save(sys.argv[1])`, out, ...parts]);
      for (const p of parts) await rm(p);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? `Issues:\n${errors.join('\n')}` : 'No console errors, HTTP errors or horizontal overflow.');
