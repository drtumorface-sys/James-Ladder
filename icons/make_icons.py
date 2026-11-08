"""Draws the James' Ladder app icons.

The dodecahedron seen face-on: the front face as a pentagon (lit like an opened
key), the outline as a decagon, and the back edges drawn faintly. In this view
the outer ring sits at the golden ratio (phi) times the front face's radius.
Coloured dots at the front face's corners echo the app's chord bubbles.

Run from this folder:  python make_icons.py
"""
import math
from PIL import Image, ImageDraw

PHI = (1 + 5 ** 0.5) / 2
SS = 4  # draw at 4x and scale down, for smooth lines

CREAM = (238, 234, 216)        # --bg (light theme)
CREAM_EDGE = (226, 218, 192)
GOLD = (122, 78, 6)            # --gold
FACE = (196, 98, 74)           # the lit (active) face
# Chord-bubble colours: pastel fill, function colour ring (I, V, ii, vi, IV)
DOTS = [((200, 222, 190), (35, 80, 24)),
        ((236, 196, 188), (120, 26, 0)),
        ((196, 206, 232), (20, 46, 128)),
        ((214, 198, 230), (68, 20, 128)),
        ((232, 218, 178), (106, 80, 0))]


def ring(cx, cy, r, offset_deg, n=5):
    return [(cx + r * math.cos(math.radians(-90 + offset_deg + k * 360 / n)),
             cy + r * math.sin(math.radians(-90 + offset_deg + k * 360 / n)))
            for k in range(n)]


def draw_icon(size, outer, round_bg=False):
    """outer: decagon radius as a fraction of the icon size."""
    S = size * SS
    cx = cy = S / 2
    img = Image.new('RGBA', (S, S), CREAM + (255,))

    # Soft radial vignette so the cream reads as a surface, not a blank square.
    vig = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    steps = 40
    for i in range(steps):
        t = i / steps
        rr = S * 0.75 * (1 - t)
        col = tuple(int(CREAM_EDGE[j] + (CREAM[j] - CREAM_EDGE[j]) * t) for j in range(3))
        vd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col + (255,))
    img = Image.alpha_composite(img, vig)

    b = S * outer          # outer ring (decagon) radius
    a = b / PHI            # front / back face radius
    front = ring(cx, cy, a, 0)
    mid_f = ring(cx, cy, b, 0)
    mid_b = ring(cx, cy, b, 36)
    back = ring(cx, cy, a, 36)
    w = max(2, round(S * 0.016))

    # Back edges first, faint and thin — hidden lines, as in the 3D view.
    hid = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hid)
    hcol = GOLD + (70,)
    for k in range(5):
        hd.line([back[k], back[(k + 1) % 5]], fill=hcol, width=max(1, w // 2))
        hd.line([back[k], mid_b[k]], fill=hcol, width=max(1, w // 2))
    img = Image.alpha_composite(img, hid)

    # The lit front face.
    face = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(face).polygon(front, fill=FACE + (95,))
    img = Image.alpha_composite(img, face)

    d = ImageDraw.Draw(img)
    # Outline decagon, spokes, front face.
    deca = [p for k in range(5) for p in (mid_f[k], mid_b[k])]
    d.line(deca + [deca[0]], fill=GOLD + (255,), width=w, joint='curve')
    for k in range(5):
        d.line([front[k], mid_f[k]], fill=GOLD + (255,), width=w)
    d.line(front + [front[0]], fill=(150, 60, 30, 255), width=w, joint='curve')

    # Chord bubbles at the front face's corners.
    rdot = S * 0.034 * (outer / 0.40)
    for (fill, edge), (x, y) in zip(DOTS, front):
        d.ellipse([x - rdot, y - rdot, x + rdot, y + rdot], fill=fill + (255,),
                  outline=edge + (255,), width=max(2, round(w * 0.7)))

    out = img.resize((size, size), Image.LANCZOS)
    if round_bg:
        # A rounded-square mask for browsers that show the icon as-is.
        m = Image.new('L', (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=255)
        out.putalpha(m.resize((size, size), Image.LANCZOS))
    return out


if __name__ == '__main__':
    # "any" icons: rounded square, solid fills the frame.
    draw_icon(192, 0.40, round_bg=True).save('icon-192.png')
    draw_icon(512, 0.40, round_bg=True).save('icon-512.png')
    # Maskable: full-bleed square; Android crops it to a circle or squircle, so
    # the artwork stays inside the central 80% safe zone.
    draw_icon(512, 0.31).save('icon-maskable-512.png')
    # iOS rounds the corners itself and wants no transparency.
    draw_icon(180, 0.37).convert('RGB').save('apple-touch-icon.png')
    draw_icon(32, 0.44, round_bg=True).save('favicon-32.png')
    print('icons written')
