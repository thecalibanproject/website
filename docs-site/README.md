# Caliban user docs

The user documentation for Caliban: how to install it, put it in front of a model, build and supervise assistants, and look things up. It is an [Astro Starlight](https://starlight.astro.build/) site (MIT) with [Pagefind](https://pagefind.app/) search (MIT), built to static files under `/docs/`.

It works fully offline, so the same build can ship inside an air-gapped install:
- fonts are self-hosted from `src/assets/fonts` (OFL; the licence texts ship in `public/licenses/`);
- no CDN, no analytics, no remote images, no edit links to a forge;
- search is a static Pagefind index in `dist/pagefind/`, loaded from the same origin;
- screenshots are WebP files in `src/assets/shots/`, copied as they are (no image service at build time).

`npm run check:offline` fails the build output if any page or stylesheet loads something from another origin, or if the Pagefind index is missing or does not cover every page.

## Build and preview

```sh
cd docs-site
npm ci
npm run build            # static site in dist/, served under /docs/
npm run preview          # http://localhost:4321/docs/
npm run check:contract   # every page and anchor of the console link contract exists in dist/
npm run check:offline    # no page loads anything from another origin; the search index covers every page
npm run check            # astro check (TypeScript 6: astro check does not support TypeScript 7)
npm run verify           # dashes, build, internal links, the contract, offline and search
```

CI (`.github/workflows/docs-site.yml`) runs `npm ci`, `npm run check` and `npm run verify` on pull requests and pushes to main that touch `docs-site/`.

`DOCS_BASE=/docs/0.2 npm run build` builds a copy for another path (a versioned bundle). The link contract is always checked against `/docs/`.

The website at the repo root is a separate Astro project and is unaffected: its `npm run build`, `check` and `check:links` do not read this folder.

## Layout

| Path | What |
|---|---|
| `src/content/docs/` | The pages, plain Markdown. One folder per Diataxis type: `start/` (tutorials), `guides/` (how-to), `concepts/` (explanation), `reference/` |
| `src/content/docs/reference/api.md` | Generated from core's `api/openapi.yaml` by `npm run gen:api` (see the file's header). Do not edit by hand |
| `src/assets/shots/` | Screenshots from the 2026-10-13 recordings, cropped and converted to WebP. Keys are blurred in the source shots; each one was checked before use |
| `src/plugins/remark-md-links.mjs` | Turns file links (`../guides/privacy.md#modes`) into site routes (`/docs/guides/privacy/#modes`) |
| `src/styles/caliban.css` | The theme, from the website's `DESIGN.md` tokens |
| `docs-links.md` | The console to docs link contract (a copy of the lead's file, plus the pages this site adds) |
| `scripts/check-contract.mjs` | Checks the contract, or the `/docs/` links found in another tree (the console) |
| `scripts/check-offline.mjs` | Checks that the build loads nothing from another origin |
| `scripts/gen-api-reference.mjs` | Writes `reference/api.md` from an OpenAPI file |

## Writing

- **Diataxis.** A tutorial teaches by doing one thing end to end. A how-to guide answers one task. A concept page explains why. A reference page lists facts. Do not mix them on one page; link instead.
- **Plain terms.** Use the plain name the console uses (Workspace, Assistant, Topic, Data dictionary, Query plan, ...). Give the internal or API name once, where it helps: "Workspace (`tenant` in the API)". The [glossary](src/content/docs/reference/glossary.md) maps every old name to its plain term.
- **Voice.** Short sentences, second person, the task first. No marketing. Say what the reader does, then what they see.
- **No em dashes** (and no en dashes). Use a comma, a colon or parentheses. `npm run check:dashes` fails on either.
- **Links** point at files, relative to the page: `[privacy modes](../guides/privacy.md#modes)`. The site turns them into routes, and they still work when the source moves to `core/docs`.
- **Anchors** come from heading text (lower case, spaces to hyphens). A heading that is the target of a contract anchor must keep its exact text.
- **Not built yet.** A feature that does not exist yet is written as the intended flow under a `:::caution[Coming soon]` aside that says what to do today instead.
- **Examples** are real: request bodies, headers and timings from the 2026-10-13 recordings and e2e scenarios. Keys are written `cal_...`.
- **Asides** use Starlight's directive syntax (`:::note`, `:::tip`, `:::caution`, `:::danger`), which reads as plain text elsewhere.

## On the public website

`npm run build:all` at the repo root builds the website, then this site, and copies it to `dist/docs/`, so the public site serves both from one `dist/`. The website's own `npm run build` is unchanged.

## Serving from the control plane (follow-up)

Today the page sources live here. The plan (research note 10, section 9) is to version them with the binary and serve them from the instance, so every "Learn more" link in the console stays on the customer's network. The steps:

1. **Move the sources.** Move `src/content/docs/**` and `src/assets/shots/` to `core/docs/user/` (same tree). Links are file-relative `.md` links, so they keep working on a forge and need no edit. Point Starlight's `docsLoader` at that folder with a glob loader (`base: '../../core/docs/user'`), as the website already does for research notes.
2. **Build per release.** The release pipeline checks out core at the release tag and this repo, runs `npm ci && npm run verify` here (dashes, build, internal links, the console link contract, offline check), and gets a static `dist/` of about 2 MB plus the Pagefind index.
3. **Ship it in the image.** Copy `dist/` into the control-plane image (for example `/usr/share/caliban/docs`) and into the air-gap bundle, next to the console build.
4. **Serve it.** The control plane serves that folder at `/docs/` on the console's origin, like `CALIBAN_WEB_DIR` serves the console (a `CALIBAN_DOCS_DIR` or `[server] docs_dir` setting; core change, not built yet). Static files only: no server code, no network.
5. **Check the console's links in CI.** In the web repo, run `node ../website/docs-site/scripts/check-contract.mjs --scan src` against the built docs, so a console link to a missing page or anchor fails the build.
6. **Versions.** Build with `DOCS_BASE=/docs/<version>` to keep older versions side by side on the public site; the instance serves only its own version at `/docs/`.
