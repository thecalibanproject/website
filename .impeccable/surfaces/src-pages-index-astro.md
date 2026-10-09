---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages"]
---

# Surface brief: Caliban website (home + all routes)

Scope: whole site; home is Persuade, /architecture /platform/* /deployment /developers are Persuade-to-Read, /research/* is Read.
Audience: enterprise buyers first, then developers, then investors. Action: "Talk to us" (mailto from src/config.ts); secondary "Read the architecture". Proof: architecture, test suites, cited research; design partners exist but are unnamed. Constraints: no invented claims; "designed to support, not certified"; blue tint; must not resemble haqq.ai.

## Direction contract

THESIS: Caliban is the control tower of a company's sovereign airspace. Every AI request is a flight it identifies, screens, clears, routes and lands on the customer's own runway. The page refuses the SaaS template (centred hero, chip rows, logo strip, card grid, dark benchmark band).

OWN-WORLD: The scope is blue-black (#06122A) with radar rings and range marks in scope blue. Targets and leader lines are cyan-blue (#7CC4FF). Data blocks and readouts on the scope are set in B612 Mono; code and inline data elsewhere are set in IBM Plex Mono. Paper flight strips in ice (#E8F1FF / #DCE9F7) sit in a ruled strip bay. One owned Caliban blue (#1D4ED8) is the only chromatic ink; amber (#F2B544) appears only for holds and denials. The display face is B612 700 in mixed case (the Airbus cockpit face), with Atkinson Hyperlegible Next for reading; amended from "condensed engineered grotesk" after the user said "the font looks a bit too ai". Numbers are fixed-place readouts with engraved unit caps. Corners are square; hairlines are 1px.

STORY: The visitor sees requests being handled live: identified (tenant), screened (PII), cleared (policy, quota), routed (model), grounded (ontology), and landed at the sovereign core. They believe the AI comes to their data under their control. Then they open a strip to read the mechanism and talk to us.

FIRST VIEWPORT: Left 40%: the tower console with the headline "Bring the models to your data." in large B612 700 mixed case, one line of subcopy, the "Talk to us" primary action and the "Read the architecture" secondary, plus a squawk-style status line. Right 60%: a live canvas radar scope with rings labelled CLEAR · ROUTE · SCREEN · CACHE · GROUND · CORE (the real pipeline order) and a sweep. Targets carry data blocks on leader lines. Along the bottom, a strip bay prints cleared requests.

FORM: Air-traffic-control radar scope plus flight-progress strips, candidate 4 of 7, seed 59b94369. Raises: fixed-place readouts (nixie); leader-lined data blocks (mook); one owned blue with amber only for holds (one-hue); registered before/after per stage (forge); origin ticket per strip (bazaar); motion follows real stage order and latencies (ink).

Signature interaction: hovering or tapping a target freezes it and expands its strip, showing the request's before/after at each stage. Clicking a ring jumps to that stage's section. With reduced motion the sweep stops and targets render static.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
