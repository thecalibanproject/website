---
name: Caliban
description: Sovereign AI gateway; the control tower for a company's own airspace.
colors:
  caliban-blue: "#1D4ED8"
  caliban-blue-hi: "#3E6CF2"
  caliban-blue-deep: "#102E7A"
  hold-amber: "#F2B544"
  hold-amber-ink: "#8A5A00"
  scope-night: "#040B1C"
  scope: "#06122A"
  scope-raised: "#0A1A39"
  scope-well: "#0F2448"
  scope-ring: "#1C3B73"
  scope-line: "rgba(124, 196, 255, 0.16)"
  scope-line-strong: "rgba(124, 196, 255, 0.3)"
  target-cyan: "#7CC4FF"
  readout: "#E8F1FF"
  readout-2: "#A9BEDF"
  readout-3: "#7F96BD"
  paper: "#F6F9FD"
  strip-ice: "#E8F1FF"
  strip-ice-2: "#DCE9F7"
  rule: "#BFD1EA"
  rule-strong: "#A6BCDB"
  ink: "#0A1430"
  ink-2: "#26324F"
  ink-3: "#4F5D7C"
typography:
  display:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 5.6vw, 5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 4.8vw, 4.1rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  title:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  subhead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  lead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.08rem, 1.5vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  label:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
  readout:
    fontFamily: "B612 Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "clamp(2rem, 3.6vw, 3rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum, zero"
rounded:
  none: "0px"
spacing:
  strip-gap: "6px"
  cell-y: "12px"
  cell-x: "14px"
  stack: "16px"
  gutter: "28px"
  gutter-mobile: "18px"
  head-gap: "48px"
  section-tight: "72px"
  section: "120px"
  container: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.caliban-blue}"
    textColor: "#ffffff"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "11px 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.caliban-blue-hi}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 20px"
    height: "46px"
  button-secondary-scope:
    backgroundColor: "transparent"
    textColor: "{colors.readout}"
    rounded: "{rounded.none}"
  strip:
    backgroundColor: "{colors.strip-ice}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
  strip-code-cell:
    backgroundColor: "{colors.caliban-blue}"
    textColor: "#ffffff"
    typography: "{typography.data}"
    width: "92px"
  strip-code-cell-hold:
    backgroundColor: "{colors.hold-amber}"
    textColor: "{colors.scope}"
  strip-code-cell-quiet:
    backgroundColor: "{colors.strip-ice-2}"
    textColor: "{colors.ink}"
  strip-scope:
    backgroundColor: "{colors.scope-raised}"
    textColor: "{colors.readout}"
  keybank-key:
    backgroundColor: "{colors.strip-ice}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  keybank-key-selected:
    backgroundColor: "{colors.caliban-blue}"
    textColor: "#ffffff"
  callout:
    backgroundColor: "{colors.strip-ice}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
  inline-code:
    backgroundColor: "{colors.strip-ice-2}"
    textColor: "{colors.caliban-blue-deep}"
    typography: "{typography.data}"
  nav:
    backgroundColor: "{colors.scope-night}"
    textColor: "{colors.readout-2}"
    height: "60px"
---

# Design System: Caliban

## Overview

**Creative North Star: "Sovereign Airspace"**

Caliban is drawn as the control tower of a company's own airspace. Every AI request is a flight: identified, screened, cleared, routed, grounded and landed on the customer's runway. The system lifts its grammar from en-route air traffic control (the radar scope, leader-lined data blocks, paper flight-progress strips in a ruled bay) and keeps the words Caliban's own. ATC supplies the grammar, not the vocabulary: requests, routes and tenants are never called flights in copy.

Two materials alternate. **Scope** is the dark instrument surface (blue-black with a 96px range grid and a faint blue bloom) for signature, interactive and hero sections. **Strip paper** is the light ice-blue reading surface for long explanation. Both are built from the same parts: square corners, 1px rules, one owned blue, and fixed-place numerals. The density is high, but every cell is ruled, so the eye reads in rows rather than in floating cards.

Rejected by the build and by the brand page: the SaaS template (centred hero, chip rows, logo strip, icon-tile card grid, dark hero-metric band), gradient text, and eyebrow labels over headings.

**Key Characteristics:**
- Flight-progress strips (a code cell plus ruled cells) are the universal row.
- One chromatic ink (Caliban blue); amber appears only for holds and denials.
- Square corners everywhere; 1px hairlines are the only structure.
- Numbers are fixed-place readouts with engraved caps under them, never floating marketing stats.
- Evidence arrives as source-ticketed strips with visible caveats.

## Colors

A cold, single-hue palette: blue-black scope, ice paper, one saturated owned blue, and an amber that only means "stopped".

### Primary
- **Caliban Blue** (caliban-blue): The only chromatic ink. It fills strip code cells, primary buttons, the selected key in a key bank, the built-status square, highlighted evidence bands, links on paper, focus rings and text selection.
- **Signal Blue** (caliban-blue-hi): The hover state of Caliban Blue, the active ring on the scope, and the core disc.
- **Deep Blue** (caliban-blue-deep): Blue as text on ice: badge text, inline code, routed-model names in strips.

### Secondary
- **Hold Amber** (hold-amber): Fills the code cell of a held or denied request (scope targets, the strip bay, denied licences, the 404 "held" strip). It carries scope-coloured text.
- **Amber Ink** (hold-amber-ink): Amber as text on paper, again only for held values.

### Tertiary
- **Target Cyan** (target-cyan): Scope targets and their leader lines, links and focus rings on scope surfaces, the active nav underline, and check bullets on the scope. It never appears on paper.

### Neutral
- **Scope** (scope): The instrument surface for heroes, signature sections, code blocks and dropdown menus.
- **Scope Night** (scope-night): The sticky nav bar, one step darker than the scope it sits over.
- **Scope Raised / Scope Well** (scope-raised, scope-well): Strips, panels and ruled grid cells on the scope; inline code and callout keys on the scope.
- **Scope Ring** (scope-ring): Radar rings at rest and evidence bands at rest.
- **Scope Lines** (scope-line, scope-line-strong): The cyan hairlines at 16% and 30% that rule everything on a dark surface, including the 96px range grid.
- **Readout ramp** (readout, readout-2, readout-3): Headings, body and caps/muted text on the scope.
- **Paper** (paper): The page ground for reading sections.
- **Strip Ice** (strip-ice, strip-ice-2): The strip face, and the darker ice for table heads, callout keys, quiet code cells and inline code.
- **Rules** (rule, rule-strong): Hairlines on paper; the strong rule outlines secondary buttons, keys and the hollow status square.
- **Ink ramp** (ink, ink-2, ink-3): Headings, body and muted text on paper.

### Named Rules
**The One Ink Rule.** Caliban Blue is the only chromatic ink. There is no green and no second accent. Status "built" is a filled blue square and "planned" is a hollow square outlined in the current colour.

**The Amber Means Stopped Rule.** Amber marks holds and denials only. Estimates, caveats and emphasis never use it: estimates take a blue outlined badge, and warning callouts take a blue key cell.

**The Cyan Stays On The Scope Rule.** Target Cyan belongs to dark surfaces. On paper, the same job falls to Caliban Blue.

## Typography

**Display Font:** B612 (with ui-sans-serif, system-ui)
**Body Font:** Atkinson Hyperlegible Next (with ui-sans-serif, system-ui, Segoe UI, Roboto)
**Label/Mono Font:** IBM Plex Mono for code and inline data; B612 Mono for the scope only

**Character:** B612 was drawn for Airbus cockpit displays. Set at 700 in mixed case, it gives headings an instrument-panel firmness without the condensed-grotesk look that the user rejected as "a bit too ai". Atkinson Hyperlegible Next carries long reading with disambiguated letterforms. Its slashed zero is part of the face and is accepted. All four families are self-hosted from `public/fonts` with their OFL licence files, and body text runs tabular figures.

### Hierarchy
- **Display** (B612 700, clamp(3rem, 5.6vw, 5rem), 1.0, -0.025em): The home hero headline only.
- **Page title** (B612 700, clamp(2.4rem, 4.8vw, 4.1rem), 1.02): Inner-page hero titles on the scope.
- **Headline** (B612 700, clamp(2.1rem, 4.2vw, 3.5rem), 1.04, -0.02em): Section h2s in the section head.
- **Title** (B612 700, 1.2–1.25rem, 1.1–1.15): Strip titles, ruled-grid cell titles, buttons and nav links.
- **Subhead** (Atkinson Next 600, 1.25 line height): Plain h3/h4 inside prose.
- **Lead** (Atkinson Next 400, clamp(1.08rem, 1.5vw, 1.25rem), 1.55, max 62ch): Section and hero ledes.
- **Body** (Atkinson Next 400, 17px (16px under 760px), 1.6; prose 1.7): All reading text.
- **Label** (B612 700, 0.72–0.8rem, 0.08em, uppercase): Engraved caps on cells, table heads, callout keys, badges, status tags, readout units and code-block heads.
- **Data** (IBM Plex Mono 400–600, 0.74–0.82em): Code, ids, model names, strip code cells, breadcrumbs and measurements.
- **Readout** (B612 Mono 400, clamp(2rem, 3.6vw, 3rem), 1.0, tabular and slashed zero): Live numerals with an engraved B612 cap beneath.

### Named Rules
**The Two Monos Rule.** IBM Plex Mono sets code and inline data everywhere, because B612 Mono's square parentheses misread in code. B612 Mono is used only for the canvas data blocks and the large readouts.

**The Sentences Are Sans Rule.** Mono never sets a sentence. Notes, captions and disclaimers are set in Atkinson Next, even inside strips.

**The Engraved Cap Rule.** Uppercase B612 caps label a control, a cell or a number. They never sit above a heading as an eyebrow.

## Layout

The content runs in a 1240px container with 28px gutters (18px under 760px). Sections stack at 120px vertical padding (96px under 1080px, 72px under 760px), and tight sections use 72px (56px). Each section opens with a **section head**: the heading on the left and the lede on the right in a 1.05fr / 1fr grid (gaps 32px by 64px), aligned to the baseline, closed by a 1px rule, with 48px below it (32px on mobile). Under 1080px the head stacks.

The home hero is a 5fr / 7fr split: a console (headline, lede, two actions, a four-cell readout row) on the left, and the radar scope on the right. The strip bay spans the full width beneath them. Below 1080px it stacks in the order console, scope, bay. Inner pages open with a scope page hero (crumbs in mono, then the title and lede, optionally beside a visual panel). Two-column splits run 1fr / 1fr or 0.85fr / 1.15fr with a 64px gap and collapse at 1080px.

Strips stack in a bay with a 6px gap; strip cells pad 12px by 14px. Ruled grids take 3 or 4 columns, drop to 2 at 1080px and to 1 at 760px. The sticky nav is 60px tall (56px on mobile).

## Elevation & Depth

The system is flat. Depth comes from material, not shadow: the scope sits behind paper as a darker world, and raised parts on the scope step up through scope, scope-raised and scope-well. The only atmosphere is the scope's own: a 96px range grid drawn in scope-line hairlines with a single radial bloom of Caliban Blue at 16% opacity behind the hero focus. `box-shadow` appears only as an inset 1px hairline (outlined badges, hollow status squares, focused filter fields), never as a lift.

### Named Rules
**The No Lift Rule.** Nothing floats. A panel is separated by a rule or a change of surface, never by a drop shadow.

**The Range Grid Rule.** The 96px grid and the blue bloom belong to scope heroes (home, inner page heroes, doc pages, 404). Paper sections stay plain.

## Shapes

Every corner is square (0px): buttons, strips, keys, badges, panels, code blocks and the burger button. The only round forms are instrument geometry on the canvas (rings, targets and the core disc). Structure is drawn with 1px hairlines. Ruled grids use a 1px gap over a rule-coloured ground, so the cells are divided by rules and not boxed as cards. Key banks overlap their 1px borders by -1px so neighbouring keys share a single rule. Status marks are 7px squares. Check bullets are 10 by 2px dashes.

## Components

### Buttons
Instrument keys: firm, square and quiet until pressed.
- **Shape:** square (0px), 46px tall (36px small, 54px large).
- **Primary:** a Caliban Blue fill, white B612 700 at 0.98rem, padding 11px by 20px. Hover moves to Signal Blue.
- **Secondary:** transparent with a strong-rule border and ink text, and the border darkens to ink on hover. On the scope, the border is a scope-line-strong hairline with readout text, and hover turns it Target Cyan.
- **Focus:** a 2px Caliban Blue outline with a 2px offset (Target Cyan on the scope). Transitions run 0.18s on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Arrow link:** B612 700 text with a 16px arrow that slides 3px on hover.

### Flight Strip (signature)
The universal row. A strip is a grid of a code cell (92px by default) and ruled cells on Strip Ice with a 1px rule border and 1px rules between cells.
- **Code cell:** a Caliban Blue fill with white IBM Plex Mono 600 at 0.78rem. It is Hold Amber with scope text for holds and denials, and quiet ice for inert rows.
- **Content cells:** a B612 strip title and Atkinson Next body in ink-2.
- **Linked strips:** hover lifts the face to white. There is no motion and no shadow.
- **On the scope:** a scope-raised face with scope-line rules and readout text.
- Strips carry nav menus, mobile nav rows, evidence results, decision records, lanes, the home strip bay and the 404.

### Evidence strip
Published results are set as strips on the scope. Each has a letter code cell, a title with its value in Plex Mono Target Cyan, a ruled range track with a band for the reported interval (the highlighted result fills Caliban Blue), a "Caveat" cap line where one applies, and a right-hand source ticket cell. A disclaimer under a rule states that these are third-party results, not Caliban benchmarks.

### Readouts
Fixed-place B612 Mono numerals with zero padding (`00`, `0000`), and an uppercase B612 cap engraved beneath, in a ruled row with hairline dividers. They show live or real counts only.

### Key bank (segmented control)
Square keys set in uppercase B612 caps on ice with strong-rule borders, merged so each pair shares one border. The selected key fills Caliban Blue with white text, and hover lifts it to white. On the scope, keys sit on scope-raised and the selected key is still blue. The evidence set switcher is the same control without caps.

### Status and badges
- **Status:** an uppercase B612 cap with a 7px square. Built is a filled Caliban Blue square, and planned is a hollow square. Both sit in a strong-rule inset outline.
- **Badge:** ice fill with Deep Blue caps. The target or estimate variant is outlined in Caliban Blue, and the planned variant in a strong rule.

### Callout
A ruled strip-like note: a caps key cell on darker ice beside the body text. The warning variant takes a Caliban Blue key. On the scope, it moves to scope-raised and scope-well.

### Cards / Containers
There are no cards. Grouped text sits in a **ruled grid** (ice cells divided by 1px rules, 20px by 22px padding, a B612 title, ink-2 body) or a **ledger** (dl rows with a 160px term column, divided by rules).

### Code
Code blocks are scope panels with a scope-line-strong border, Plex Mono at 0.8rem with 1.7 line height, and a caps head bar. Inline code is Deep Blue on darker ice.

### Navigation
A sticky Scope Night bar, 60px tall, with readout-2 B612 700 links that turn white on hover. The active link takes a 2px Target Cyan underline. Dropdowns and the mobile menu are lists of strips: a blue Plex Mono code cell, a B612 title, and a readout-2 description. The mobile burger is a 44px square key.

### Radar Scope (signature)
A canvas scope with six rings in the real pipeline order, from the edge inward: CLEAR, ROUTE, SCREEN, CACHE, GROUND and CORE. The rings are drawn in Scope Ring with B612 caps, and range ticks are labelled in B612 Mono. A conic sweep turns over them. Targets in Target Cyan (amber when held) trail inward with leader-lined B612 Mono data blocks. Hovering a target freezes it, and ring keys link to their stage section. A strip bay under the scope prints each landed request as an ice strip. Under reduced motion the sweep stops and targets render static.

## Do's and Don'ts

### Do:
- **Do** build rows as flight strips: a code cell plus ruled cells, stacked 6px apart in a bay.
- **Do** keep Caliban Blue (#1D4ED8) as the only chromatic ink; use a filled blue square for built and a hollow square for planned.
- **Do** reserve Hold Amber (#F2B544) for holds and denials.
- **Do** set display in B612 700 mixed case, reading in Atkinson Hyperlegible Next, code and data in IBM Plex Mono, and the scope and readouts in B612 Mono.
- **Do** keep every corner square and every rule 1px.
- **Do** show evidence as source-ticketed strips with their caveats visible, and word compliance as "designed to support · not certified".
- **Do** set numbers as fixed-place readouts with an engraved cap beneath.

### Don't:
- **Don't** put an eyebrow or kicker label above a heading; the heading speaks first.
- **Don't** number sections decoratively; use numbers only where the sequence carries information (stage order, note ids, install steps).
- **Don't** use icon-tile card grids, chip rows, logo strips or a hero-metric band.
- **Don't** use gradient text, or any green or second accent hue.
- **Don't** set sentences in a monospace face.
- **Don't** use amber for estimates, caveats or emphasis.
- **Don't** lift anything with a drop shadow; separate by rule or surface.
