"""Re-jacket the printed book in assets/art/path-read.webp with the real cover.

The stock photograph showed a book wearing a different jacket. Everything in
it stays — bedding, blanket, flowers, candle, light. Only the quadrilateral
of the book's front cover is replaced: assets/art/cover.jpg is warped into
that quad, then multiplied by the photograph's own blurred luminance so the
sun, the shadow and the falloff carry across. The knit blanket draping over
the lower corner is masked back in front of it.

Run from the repository root (needs pillow + numpy):

    python3 tools/rejacket-printed.py assets/art/printed-edition.webp

Only needed again if the cover artwork changes. The coordinates below were
read off path-read.webp by eye and are specific to that photograph.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

PHOTO, ART = "assets/art/path-read.webp", "assets/art/cover.jpg"
QUAD = [(250, 527), (709, 437), (995, 903), (456, 1021)]   # TL, TR, BR, BL
# the knit blanket's upper edge where it crosses the book, closed into a shape
BLANKET = [(300, 848), (360, 876), (400, 898), (440, 914), (480, 930),
           (520, 944), (560, 952), (600, 958), (640, 966), (690, 984),
           (740, 1010), (740, 1120), (300, 1120)]


def find_coeffs(dst, src):
    """Coefficients for Image.PERSPECTIVE, which maps output back to input."""
    m = []
    for (xd, yd), (xs, ys) in zip(dst, src):
        m.append([xd, yd, 1, 0, 0, 0, -xs * xd, -xs * yd])
        m.append([0, 0, 0, xd, yd, 1, -ys * xd, -ys * yd])
    return np.linalg.solve(np.array(m, float), np.array(src, float).reshape(8))


def main(out_path):
    photo = Image.open(PHOTO).convert("RGB")
    W, H = photo.size
    art = Image.open(ART).convert("RGB")
    aw, ah = art.size

    coeffs = find_coeffs(QUAD, [(0, 0), (aw, 0), (aw, ah), (0, ah)])
    warped = art.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)

    mask = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(QUAD, fill=255)
    draw.polygon(BLANKET, fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(1.1))

    m = np.asarray(mask, float) / 255.0
    lum = np.asarray(photo.convert("L").filter(ImageFilter.GaussianBlur(26)), float)
    shade = np.clip(lum / max(lum[m > 0.5].mean(), 1.0), 0.45, 1.6)
    shade = 1.0 + (shade - 1.0) * 0.85          # ease the shading off a little

    warm = np.array([1.015, 0.995, 0.965])      # the room is golden; meet it halfway
    lit = np.clip(np.asarray(warped, float) * shade[..., None] * warm, 0, 255)
    lit = Image.fromarray(lit.astype("uint8")).filter(ImageFilter.GaussianBlur(0.5))

    out = Image.composite(lit, photo, mask)
    out.save(out_path, quality=88, method=6)
    print("wrote", out_path, out.size)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "assets/art/printed-edition.webp")
