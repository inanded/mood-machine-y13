"""Emoji Faces: a made-up dataset of cartoon faces, drawn entirely by code.

Each picture comes from a random seed, so the same number always gives
the same face. Nothing is downloaded, and every picture belongs to
whoever runs the code.
"""
import math
import random

from PIL import Image, ImageDraw

CLASSES = ["Happy", "Sad", "Angry", "Surprised", "Sleepy",
           "Winking", "Laughing", "Worried", "Cool", "Neutral"]

BIG = 128          # draw large, then shrink for smooth edges
SIZE = 32          # final picture size in pixels

FACE_COLOURS = [(255, 204, 51), (255, 214, 90), (250, 190, 40), (255, 170, 60),
                (140, 210, 120), (120, 190, 240), (240, 150, 200), (190, 160, 240),
                (255, 140, 110), (120, 220, 210)]
INK = (45, 35, 40)


def _features(name, rng, d, cx, cy, r):
    """Draw eyes, eyebrows and mouth for one expression."""
    j = lambda a, b: rng.uniform(a, b)
    w = max(4, int(r * j(0.08, 0.16)))              # line thickness
    ex = r * j(0.32, 0.40)                          # eye spacing
    ey = cy - r * j(0.18, 0.28)                     # eye height
    er = r * j(0.09, 0.13)                          # eye size
    my = cy + r * j(0.30, 0.40)                     # mouth height
    mw = r * j(0.38, 0.52)                          # mouth width

    def dot(x, y, s=1.0):
        d.ellipse([x - er * s, y - er * s * 1.25, x + er * s, y + er * s * 1.25], fill=INK)

    def closed(x, y, up):                           # an eye drawn as a curve
        box = [x - er * 1.4, y - er * 1.2, x + er * 1.4, y + er * 1.2]
        d.arc(box, 180, 360, fill=INK, width=w) if up else d.arc(box, 0, 180, fill=INK, width=w)

    def brow(x, y, tilt):                           # tilt > 0 means inner end lower
        side = 1 if x > cx else -1
        x1, x2 = x - side * er * 1.8, x + side * er * 1.8
        y_in, y_out = y + tilt, y - tilt
        d.line([(x1, y_in), (x2, y_out)], fill=INK, width=w)

    def smile(depth):                               # depth > 0 smile, < 0 frown
        top = my - abs(depth)
        box = [cx - mw, top - abs(depth), cx + mw, top + abs(depth)]
        if depth > 0:
            d.arc(box, 20, 160, fill=INK, width=w)
        else:
            box = [cx - mw, my - abs(depth) * 0.2, cx + mw, my + abs(depth) * 1.8]
            d.arc(box, 200, 340, fill=INK, width=w)

    L, R = cx - ex, cx + ex
    if name == "Happy":
        dot(L, ey); dot(R, ey); smile(r * j(0.22, 0.30))
    elif name == "Sad":
        dot(L, ey); dot(R, ey); smile(-r * j(0.20, 0.28))
        if rng.random() < 0.5:                      # sometimes a tear
            tx = L - er * 0.2
            d.polygon([(tx, ey + er * 1.6), (tx - er, ey + er * 3.4), (tx + er, ey + er * 3.4)], fill=(80, 150, 230))
            d.ellipse([tx - er, ey + er * 2.6, tx + er, ey + er * 4.2], fill=(80, 150, 230))
    elif name == "Angry":
        dot(L, ey + er * 0.6); dot(R, ey + er * 0.6)
        t = r * j(0.10, 0.16)
        brow(L, ey - er * 1.6, t); brow(R, ey - er * 1.6, t)
        smile(-r * j(0.10, 0.16))
    elif name == "Surprised":
        for x in (L, R):
            s = j(1.5, 1.9)
            d.ellipse([x - er * s, ey - er * s * 1.2, x + er * s, ey + er * s * 1.2], fill=(255, 255, 255), outline=INK, width=w)
            dot(x, ey, 0.6)
        o = r * j(0.13, 0.19)
        d.ellipse([cx - o, my - o * 1.3, cx + o, my + o * 1.1], fill=INK)
    elif name == "Sleepy":
        closed(L, ey, up=False); closed(R, ey, up=False)
        d.line([(cx - mw * 0.35, my), (cx + mw * 0.35, my)], fill=INK, width=w)
    elif name == "Winking":
        wink_left = rng.random() < 0.5
        if wink_left:
            closed(L, ey, up=True); dot(R, ey)
        else:
            dot(L, ey); closed(R, ey, up=True)
        smile(r * j(0.20, 0.28))
    elif name == "Laughing":
        closed(L, ey, up=True); closed(R, ey, up=True)
        h = r * j(0.26, 0.34)
        d.chord([cx - mw, my - h, cx + mw, my + h], 0, 180, fill=INK)
        d.chord([cx - mw * 0.55, my + h * 0.35, cx + mw * 0.55, my + h * 0.95], 0, 180, fill=(230, 90, 100))
    elif name == "Worried":
        dot(L, ey + er * 0.4); dot(R, ey + er * 0.4)
        t = -r * j(0.08, 0.13)
        brow(L, ey - er * 1.8, t); brow(R, ey - er * 1.8, t)
        pts = [(cx - mw * 0.8 + i * mw * 0.4, my + (r * 0.05 if i % 2 else -r * 0.05)) for i in range(5)]
        d.line(pts, fill=INK, width=w, joint="curve")
    elif name == "Cool":
        gy, gh, gw = ey, er * j(2.2, 2.8), er * j(2.6, 3.2)
        for x in (L, R):
            d.rounded_rectangle([x - gw, gy - gh / 2, x + gw, gy + gh / 2], radius=int(gh / 3), fill=(25, 25, 35))
        d.line([(L, gy - gh * 0.2), (R, gy - gh * 0.2)], fill=(25, 25, 35), width=w)
        side = rng.choice([-1, 1])                   # a lopsided grin
        box = [cx - mw * 0.8 + side * mw * 0.2, my - r * 0.25, cx + mw * 0.8 + side * mw * 0.2, my + r * 0.05]
        d.arc(box, 20, 160, fill=INK, width=w)
    elif name == "Neutral":
        dot(L, ey); dot(R, ey)
        d.line([(cx - mw * 0.7, my), (cx + mw * 0.7, my)], fill=INK, width=w)


def make_face(index, label=None):
    """Return (picture, label number) for one face. The same index gives the same face."""
    rng = random.Random(index)
    if label is None:
        label = index % len(CLASSES)
    name = CLASSES[label]

    if rng.random() < 0.3:
        bg = (255, 255, 255)                           # some faces on plain white
    else:
        bg = tuple(rng.randint(205, 255) for _ in range(3))
    face = Image.new("RGBA", (BIG, BIG), (0, 0, 0, 0))
    d = ImageDraw.Draw(face)
    cx, cy = 64, 64
    r = rng.uniform(44, 54)
    squash = rng.uniform(0.92, 1.08)
    colour = rng.choice(FACE_COLOURS)
    d.ellipse([cx - r, cy - r * squash, cx + r, cy + r * squash], fill=colour, outline=INK, width=rng.randint(3, 7))
    if rng.random() < 0.5:                            # rosy cheeks on some faces
        cr = r * 0.12
        for side in (-1, 1):
            x = cx + side * r * 0.55
            d.ellipse([x - cr, cy + r * 0.08 - cr * 0.7, x + cr, cy + r * 0.08 + cr * 0.7], fill=(240, 120, 120, 120))
    _features(name, rng, d, cx, cy, r)

    # tilt, shrink and move the face a little
    face = face.rotate(rng.uniform(-10, 10), resample=Image.BICUBIC)
    s = rng.uniform(0.85, 1.0)
    face = face.resize((int(BIG * s), int(BIG * s)), Image.BICUBIC)
    canvas = Image.new("RGB", (BIG, BIG), bg)
    off = (BIG - face.size[0]) // 2
    canvas.paste(face, (off + rng.randint(-4, 4), off + rng.randint(-4, 4)), face)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS), label
