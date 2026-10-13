// Rewrites file-relative Markdown links (`../guides/privacy.md#modes`) to site routes
// (`/docs/guides/privacy/#modes`).
//
// Why: the pages are written as plain Markdown that also reads correctly on a forge or in
// core/docs, where `privacy.md` is the real file. The site needs the route instead. Writing
// links to files keeps the content portable when its source moves to core/docs (see README).
import path from 'node:path';

const SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i;

/** @param {{ base: string, contentDir: string }} opts */
export default function remarkMdLinks({ base, contentDir }) {
  const root = base.replace(/\/$/, '');
  return (tree, file) => {
    const from = file?.history?.[0] ?? file?.path;
    if (!from) return;
    const dir = path.dirname(from);
    const visit = (node) => {
      if ((node.type === 'link' || node.type === 'definition') && typeof node.url === 'string' && !SCHEME.test(node.url)) {
        const m = node.url.match(/^([^#?]+\.mdx?)(#.*)?$/);
        if (m) {
          const target = path.resolve(dir, m[1]);
          let rel = path.relative(contentDir, target).split(path.sep).join('/');
          if (rel.startsWith('..')) throw new Error(`${from}: link leaves the docs tree: ${node.url}`);
          rel = rel.replace(/\.mdx?$/, '');
          rel = rel === 'index' ? '' : rel.replace(/\/index$/, '') + '/';
          node.url = `${root}/${rel}${m[2] ?? ''}`;
        }
      }
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}
