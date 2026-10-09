"""Caliban brand assets: orbit 'C' mark with a moon in its opening (Caliban, Uranus XVI) around
a sovereign core; Poppins SemiBold wordmark converted to outlines (Poppins is OFL-1.1)."""
import math, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = pathlib.Path("out"); OUT.mkdir(exist_ok=True)
C = dict(ink="#0A1430", navy="#0B1F4D", deep="#102E7A", brand="#1D4ED8", bright="#3B82F6", sky="#6CB8FF", ice="#DCEBFF", white="#FFFFFF")

def wordmark(text="caliban", font="Poppins-SemiBold.ttf", size=40.0, tracking=-0.012):
    f = TTFont(font); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f["head"].unitsPerEm
    s = size / upm; x = 0.0; parts = []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
        parts.append(pen.getCommands())
        x += gs[g].width * s + tracking * size
    width = x - tracking * size
    return " ".join(parts), width

def pt(theta, r=22, cx=32, cy=32):
    a = math.radians(theta); return cx + r * math.cos(a), cy - r * math.sin(a)

def mark(ring_a, ring_b, core, moon, gid="g", bg=None, radius=14, stroke=8.5, core_r=6.5, moon_r=4.8):
    (x1, y1), (x2, y2) = pt(42), pt(-42)
    mx, my = pt(0)
    rect = f'<rect width="64" height="64" rx="{radius}" fill="{bg}"/>' if bg else ""
    return f'''<defs><linearGradient id="{gid}" x1="10" y1="54" x2="54" y2="10" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{ring_a}"/><stop offset="1" stop-color="{ring_b}"/></linearGradient></defs>
  {rect}<path d="M{x1:.2f} {y1:.2f}A22 22 0 1 0 {x2:.2f} {y2:.2f}" fill="none" stroke="url(#{gid})" stroke-width="{stroke}" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="{core_r}" fill="{core}"/>
  <circle cx="{mx:.2f}" cy="{my:.2f}" r="{moon_r}" fill="{moon}"/>'''

def svg(w, h, body, title="Caliban"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

# Mark variants
(OUT / "logo-mark.svg").write_text(svg(64, 64, mark(C["navy"], C["bright"], C["brand"], C["sky"])))
(OUT / "logo-mark-white.svg").write_text(svg(64, 64, mark(C["ice"], C["white"], C["white"], C["sky"], gid="w")))
(OUT / "favicon.svg").write_text(svg(64, 64, mark(C["sky"], C["white"], C["white"], C["sky"], gid="f", bg=C["navy"], stroke=10, core_r=7.5, moon_r=6)))

# Horizontal lockups: 64px mark + 16px gap + wordmark baseline aligned so x-height centres on the core.
path, ww = wordmark(size=40)
def lockup(text_fill, ring_a, ring_b, core, moon, gid):
    W = 64 + 16 + ww
    body = f'{mark(ring_a, ring_b, core, moon, gid=gid)}<g transform="translate(80 43.5)"><path d="{path}" fill="{text_fill}"/></g>'
    return svg(W, 64, body)
(OUT / "logo.svg").write_text(lockup(C["ink"], C["navy"], C["bright"], C["brand"], C["sky"], "l"))
(OUT / "logo-white.svg").write_text(lockup(C["white"], C["ice"], C["white"], C["white"], C["sky"], "lw"))
(OUT / "wordmark.svg").write_text(svg(ww, 52, f'<g transform="translate(0 40)"><path d="{path}" fill="{C["ink"]}"/></g>'))

# Social card
big, bw = wordmark(size=96)
og = f'''<rect width="1200" height="630" fill="{C["navy"]}"/>
<radialGradient id="glow" cx="0.78" cy="0.2" r="0.7"><stop offset="0" stop-color="{C["bright"]}" stop-opacity="0.55"/><stop offset="1" stop-color="{C["navy"]}" stop-opacity="0"/></radialGradient>
<rect width="1200" height="630" fill="url(#glow)"/>
<g transform="translate(96 150) scale(2.6)">{mark(C["ice"], C["white"], C["white"], C["sky"], gid="og")}</g>
<g transform="translate(300 268)"><path d="{big}" fill="{C["white"]}"/></g>
<g transform="translate(98 420)"><path d="{wordmark("The sovereign AI gateway for your company’s data.", "Poppins-Medium.ttf", 38, 0)[0]}" fill="{C["ice"]}"/></g>
<g transform="translate(98 476)"><path d="{wordmark("Route · Ground · Protect · Orchestrate · Run it on-prem", "Poppins-Regular.ttf", 26, 0)[0]}" fill="{C["sky"]}"/></g>'''
(OUT / "og-image.svg").write_text(svg(1200, 630, og, "Caliban: the sovereign AI gateway"))
print("wordmark width", round(ww, 2), "files:", sorted(p.name for p in OUT.iterdir()))
