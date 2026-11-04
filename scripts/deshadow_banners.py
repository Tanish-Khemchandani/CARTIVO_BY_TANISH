"""
De-shadow the AI-generated CARTIVO banner artwork.

The generated banners (public/assets/generated/{banners,categories}) have soft
gray drop shadows baked into the pixels. There is no shadow-free source, so we
suppress them mathematically:

  * Shadows here are desaturated grays on a near-white studio background.
  * We detect low-saturation, mid-to-light pixels (the shadow zone) and blend
    them toward white using a smooth, feathered mask.
  * Saturated or genuinely dark pixels (products, brand colors) keep their
    values, so product photos stay crisp.

Originals are backed up once to public/assets/generated/_originals/ so the pass
is re-runnable and reversible.
"""
import shutil
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "client" / "public" / "assets" / "generated"
BACKUP = BASE / "_originals"

# Files that render as banners on storefront pages (hero assets excluded).
TARGETS = [
    "banners/banner-fashion.jpg",
    "banners/banner-festive-deals.jpg",
    "banners/banner-mega-sale.jpg",
    "banners/banner-new-arrivals.jpg",
    "banners/catalog-showcase.webp",
    "categories/cat-appliances.jpg",
    "categories/cat-electronics.jpg",
    "categories/cat-fashion.jpg",
    "categories/cat-furniture.jpg",
    "categories/cat-grocery.jpg",
    "categories/cat-home-beauty.jpg",
    "categories/cat-mobiles.jpg",
]

# Tuning: how aggressively to lift the gray shadow zone toward the background.
V_LO = 90    # gray luminance where blending to white starts
V_HI = 246   # gray luminance where it reaches full white lift
SAT_LIMIT = 34.0  # saturation (0-441 max-sqrt metric) below which pixel counts as gray
STRENGTH = 1.0  # global multiplier on the blend weight


def lift(pixel):
    r, g, b = float(pixel[0]), float(pixel[1]), float(pixel[2])
    mx = max(r, g, b)
    mn = min(r, g, b)
    sat = mx - mn if mx > mn else 0.0
    v = mx

    # Only near-neutral pixels in the light shadow band get lifted.
    if sat > SAT_LIMIT:
        return (r, g, b)
    if v >= V_HI:
        return (r, g, b)

    band = (v - V_LO) / float(V_HI - V_LO)
    band = max(0.0, min(1.0, band))
    # Ease the edge so faint shadows fade gently instead of snapping.
    w = band * band * (3.0 - 2.0 * band) * STRENGTH
    ne = min(255.0, r + w * (255.0 - r))
    ng = min(255.0, g + w * (255.0 - g))
    nb = min(255.0, b + w * (255.0 - b))
    return (ne, ng, nb)


def process(path: Path):
    ext = path.suffix.lower()
    img = Image.open(path)
    was_palette = img.mode == "P"  # webp candidates we only ship as webp; jpgs are RGB
    if was_palette:
        img = img.convert("RGB")
    rgb = img.convert("RGB")

    # Build per-pixel lift weights, then feather the mask to avoid halos
    # around product edges that share gray with the shadow zone.
    pixels = rgb.load()
    w, h = rgb.size
    weights = Image.new("L", (w, h), 0)
    wpx = weights.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            mx = max(r, g, b)
            mn = min(r, g, b)
            sat = mx - mn
            v = mx
            if sat <= SAT_LIMIT:
                band = (v - V_LO) / float(V_HI - V_LO)
                band = max(0.0, min(1.0, band))
                wpx[x, y] = int(255 * band * band * (3 - 2 * band) * STRENGTH)

    out = Image.new("RGB", (w, h))
    outpx = out.load()
    feathers = weights.filter(ImageFilter.GaussianBlur(radius=1.2)).load()
    for y in range(h):
        for x in range(w):
            weight = feathers[x, y] / 255.0
            if weight <= 0.0:
                outpx[x, y] = pixels[x, y]
            else:
                r, g, b = pixels[x, y]
                outpx[x, y] = (
                    int(r + weight * (255 - r)),
                    int(g + weight * (255 - g)),
                    int(b + weight * (255 - b)),
                )

    if ext == ".webp":
        out.save(path, "WEBP", quality=92)
    else:
        out = out.convert(img.mode) if not was_palette else out
        out.save(path, "JPEG", quality=92, subsampling=1)
    print(f"processed {path.relative_to(ROOT)}")


def main():
    for rel in TARGETS:
        src = BASE / rel
        if not src.exists():
            print(f"missing, skipped: {rel}")
            continue
        backup = BACKUP / rel
        if not backup.exists():
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, backup)
        process(src)


if __name__ == "__main__":
    main()
