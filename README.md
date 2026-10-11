<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thecalibanproject/website/main/public/brand/logo-white.svg">
  <img alt="Caliban" src="https://raw.githubusercontent.com/thecalibanproject/website/main/public/brand/logo.svg" width="200">
</picture>

# Caliban Website

The static site that presents Caliban's architecture, platform, deployment model, developer API and research.

[Docs](https://github.com/thecalibanproject/docs) · [Core](https://github.com/thecalibanproject/core) · [Console](https://github.com/thecalibanproject/web) · [Deploy](https://github.com/thecalibanproject/deploy)

## What this is

Caliban is a sovereign AI gateway: one OpenAI- and Anthropic-compatible endpoint for a company, with intent routing, PII pseudonymisation before anything reaches an outside provider, an ontology layer that compiles typed queries (CQIR) to MongoDB pipelines or to SQL over a CDC replica, caching, nodes (agents) and on-prem open-weight models. It is BYOK only and can run fully on-prem with zero egress.

This repo is the public face of that work and doubles as the architecture reference. It is an [Astro](https://astro.build) 7 site with static output and no client framework. Most of its long-form content is not written here: it is rendered at build time from the [docs](https://github.com/thecalibanproject/docs) repo and the API contract in [core](https://github.com/thecalibanproject/core).

The site is not hosted publicly yet. Run it locally as described below.

## Page map

| Route | Source | Content |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Home: hero with the radar scope and strip bay, the request stages, published evidence, sovereignty, the model fleet, developer entry points, research notes, questions. |
| `/architecture/` | `src/pages/architecture/index.astro` | System overview and diagram, the six capabilities, the 14-stage request lifecycle, evidence, deployment shapes, per-crate build status, roadmap, repositories, and the decisions made and still open. |
| `/architecture/reference/` | `src/pages/architecture/[doc].astro` | Full rendering of `docs/architecture/caliban-reference-architecture.md`. |
| `/architecture/repos-and-conventions/` | `src/pages/architecture/[doc].astro` | Full rendering of `docs/architecture/repos-and-conventions.md`. |
| `/architecture/p3-nodes-plan/` | `src/pages/architecture/[doc].astro` | Full rendering of `docs/architecture/p3-nodes-plan.md`. |
| `/platform/ontology/` | `src/pages/platform/ontology.astro` | The ontology layer: typed CQIR compiled to a MongoDB pipeline or to SQL over a CDC-fed replica. |
| `/platform/routing/` | `src/pages/platform/routing.astro` | Intent classification and routing within tenant trust tiers and policies. |
| `/platform/privacy/` | `src/pages/platform/privacy.astro` | Pseudonymisation with realistic surrogates and streaming rehydration. |
| `/platform/caching/` | `src/pages/platform/caching.astro` | Provider prompt-cache steering and tenant-scoped exact and semantic caches. |
| `/platform/nodes/` | `src/pages/platform/nodes.astro` | Nodes: typed, budgeted AI sub-apps callable over HTTP, MCP and A2A. |
| `/platform/open-models/` | `src/pages/platform/open-models.astro` | Open-weight models on your own GPUs or CPUs, with a recommended model per hardware tier. |
| `/deployment/` | `src/pages/deployment.astro` | Deployment shapes, hardware tiers, single-host compose and Helm, the air-gap procedure, the PII NER tier and a hardening checklist. |
| `/developers/` | `src/pages/developers.astro` | Quick start with the OpenAI and Anthropic SDKs and the Caliban SDKs, the API reference, the `caliban` request extension and `x-caliban` response headers. |
| `/research/` | `src/pages/research/index.astro` | Index of the research notes. |
| `/research/<NN-slug>/` | `src/pages/research/[slug].astro` | One page per research note, with prev/next and the related platform page. |
| `/brand/` | `src/pages/brand.astro` | The name, mark, colour tokens, typography, components and usage rules, with asset downloads. |
| `/404.html` | `src/pages/404.astro` | Not found. |

## Where the content comes from

The build reads sibling checkouts of two other repos. Both must sit next to this one (`../docs` and `../core`) or the build fails.

- **Research notes.** `src/content.config.ts` defines a `research` content collection with Astro's `glob` loader over `../docs/research`, matching `[0-9][0-9]-*.md` (the numbered notes, currently 01 to 09). Each note becomes a page under `/research/`. The Markdown has no frontmatter: the title is the first H1, the research date comes from the italic dateline, and `src/lib/docs.ts` rewrites relative links between docs to site routes and unwraps links that leave the docs tree. The short card blurbs, tags and platform cross-links are maintained by hand in `src/data/research.ts`.
- **Architecture documents.** A second collection, `architecture`, loads `../docs/architecture/*.md`. Three of those documents are routed: the reference architecture (`/architecture/reference/`), repos and conventions (`/architecture/repos-and-conventions/`) and the P3 nodes plan (`/architecture/p3-nodes-plan/`).
- **API reference.** `src/lib/openapi.ts` parses `../core/api/openapi.yaml` at build time, and the Developers page lists every operation across the data and control planes from it.
- **Hand-maintained data.** Crate build status (`src/data/status.ts`, copied from the layout table in core's README), hardware tiers, evidence, FAQ, request stages and code samples live in `src/data/`.

## Design: "Sovereign Airspace"

The visual system treats Caliban as the control tower for a company's own airspace. It borrows the grammar of en-route air traffic control, not its vocabulary:

- **Radar scope.** A canvas scope on the home page with six rings in pipeline order (CLEAR, ROUTE, SCREEN, CACHE, GROUND, CORE). Targets trail inward with leader-lined data blocks. A strip bay under it prints each landed request. Under reduced motion the sweep stops and targets render static.
- **Flight-progress strips.** The universal row: a code cell beside ruled cells. Strips carry the navigation menus, evidence results, decision records and the 404.
- Two surfaces (a dark "scope" and a light "strip paper"), one chromatic ink (Caliban blue), amber only for holds and denials, square corners and 1px rules.

The full system (colour tokens, type hierarchy, layout, components, do's and don'ts) is in [DESIGN.md](DESIGN.md). The audience, positioning and content rules are in [PRODUCT.md](PRODUCT.md).

### Fonts

All fonts are self-hosted from `public/fonts` and declared in `src/styles/global.css`. Nothing is loaded from a font CDN.

| Family | Use | Licence |
| --- | --- | --- |
| B612 | Display, headings, engraved caps | SIL OFL 1.1 (`public/fonts/OFL-B612.txt`) |
| B612 Mono | Scope data blocks and large readouts only | SIL OFL 1.1 (`public/fonts/OFL-B612.txt`) |
| Atkinson Hyperlegible Next | Body text | SIL OFL 1.1 (`public/fonts/OFL-Atkinson.txt`) |
| IBM Plex Mono | Code and inline data | SIL OFL 1.1 (`public/fonts/OFL-IBMPlexMono.txt`) |

Code blocks are highlighted with Shiki using a custom theme, `src/lib/caliban-scope.theme.json`.

## Repository layout

```
src/
  pages/            routes (see the page map)
  layouts/          Base.astro: document shell, meta, nav and footer
  components/
    air/            home page sections, including Scope.astro (the radar scope)
    platform/       interactive platform figures: route trace, node graph, PII inspector
    ui/             Icon, CodeBlock
                    plus shared page parts: Nav, Footer, PageHero, DocPage, CodeTabs, Timeline, ...
  data/             hand-maintained content: research cards, status, hardware, evidence, FAQ, stages, samples
  lib/              docs helpers, OpenAPI reader, Shiki theme
  styles/global.css design tokens, @font-face, base styles
  content.config.ts content collections over ../docs
  config.ts         site name, tagline, contact address, navigation
public/
  brand/            logos, icons and social cards (served under /brand/)
  fonts/            self-hosted WOFF2 files and their OFL licences
scripts/            check-links.mjs, screenshots.mjs
brand/make_brand.py Python (fontTools) generator for the logo and mark SVGs
DESIGN.md           design system
PRODUCT.md          product and audience brief
```

## Quick start (build from source)

Requirements: Node 22.12 or later (Astro 7's minimum) and npm. Clone this repo next to `docs` and `core`:

```sh
git clone https://github.com/thecalibanproject/website.git
git clone https://github.com/thecalibanproject/docs.git
git clone https://github.com/thecalibanproject/core.git

cd website
npm install
npm run dev            # http://localhost:4321
```

To check the production build locally:

```sh
npm run build          # -> dist/
npm run preview        # serves dist/ on http://localhost:4321
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm run check` | `astro check` (type and template diagnostics). Needs `@astrojs/check`, which is not in `package.json`, and does not yet support the TypeScript 7 this project uses; `npm run build` is the reliable check. |
| `npm run check:links` | `scripts/check-links.mjs`: verifies that every internal `href`, `src`, `srcset` and CSS `url()` in `dist/` resolves to a built file, including `#anchor` targets. External links are not fetched. Exits 1 on any broken link. Run `npm run build` first; an optional argument sets the build directory. |
| `npm run screenshots` | `scripts/screenshots.mjs`: full-page screenshots of every page at 1440x900 and 390x844 into `screenshots/` (gitignored), and a report of console errors, HTTP errors and horizontal overflow. |

All Astro scripts set `ASTRO_TELEMETRY_DISABLED=1`.

`screenshots.mjs` drives the locally installed Google Chrome through `playwright-core` (no browser is downloaded). Start `npm run preview` in another shell first. It takes an optional base URL (default `http://localhost:4321`) followed by page names to limit the run:

```sh
node scripts/screenshots.mjs http://localhost:4321 home developers
```

Pages taller than 15,000px are captured in slices and stitched with `python3` and Pillow, so those need to be available for the longest pages.

## Configuration

| Variable | When | Effect |
| --- | --- | --- |
| `SITE_URL` | `npm run build` | Canonical origin for the sitemap (`@astrojs/sitemap`), canonical links and absolute Open Graph image URLs. Defaults to the placeholder `https://caliban.example.com`. |

The contact address, tagline and navigation are constants in `src/config.ts`.

## Testing

There is no unit test suite. The checks are:

```sh
npm run build          # fails on broken content collections or a missing ../docs or ../core
npm run check:links    # internal links and anchors in dist/
npm run screenshots    # visual pass, console errors and overflow (needs npm run preview running)
```

## Related repos

- [docs](https://github.com/thecalibanproject/docs): the reference architecture and research notes this site renders.
- [core](https://github.com/thecalibanproject/core): the Rust binary and `api/openapi.yaml`, which the Developers page is generated from.
- [web](https://github.com/thecalibanproject/web): the admin console.
- [deploy](https://github.com/thecalibanproject/deploy): container image, docker-compose, Helm chart and air-gap bundle tooling.
- [sdk-typescript](https://github.com/thecalibanproject/sdk-typescript) and [sdk-python](https://github.com/thecalibanproject/sdk-python): client SDKs (Apache-2.0).
- [ml](https://github.com/thecalibanproject/ml): offline training and export for the small in-process models.

## Licence

Copyright 2026 Elie Sfeir. This repository is proprietary and source-available: it is public for reference and evaluation only, and no right to use, copy, modify or distribute it is granted without a written agreement with the copyright holder. See [LICENSE](LICENSE). The bundled fonts remain under their own SIL Open Font Licence 1.1 terms (see `public/fonts`). For licensing, contact elie@internalizable.dev.
