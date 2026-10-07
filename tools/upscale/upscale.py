"""Real-ESRGAN x4 upscaling for the Grillköket site (runs in GitHub Actions).

Outputs (all WebP):
  grillkoket/img/dishes/<slug>.webp        dish photo, long side <= 1600 (banner cards cropped to the food)
  grillkoket/img/dishes/<slug>-sm.webp     thumbnail, long side 320
  grillkoket/img/hd/<name>-4k.webp / -2k / base   restaurant photos (3840 / 2560 / 1280)
  grillkoket/img/hd/gala*.webp             award photo crop
  tools/upscale/out/exploded/<name>.png    upscaled AI layer photos (alpha is cut afterwards)
"""
import io, json, os, sys, time, urllib.parse, urllib.request
import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
L = json.load(open(os.path.join(ROOT, "tools/upscale/list.json"), encoding="utf8"))
torch.set_num_threads(os.cpu_count() or 4)
model = ModelLoader().load_from_file(sys.argv[1]).eval()


def sr(img: Image.Image, tile=256, pad=16) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0
    h, w, _ = a.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            y0, x0, y1, x1 = max(0, y - pad), max(0, x - pad), min(h, y + tile + pad), min(w, x + tile + pad)
            t = torch.from_numpy(a[y0:y1, x0:x1].transpose(2, 0, 1)).unsqueeze(0)
            with torch.no_grad():
                o = model(t)[0].clamp(0, 1).numpy().transpose(1, 2, 0)
            oy, ox = (y - y0) * 4, (x - x0) * 4
            th, tw = (min(h, y + tile) - y) * 4, (min(w, x + tile) - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = o[oy:oy + th, ox:ox + tw]
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8))


def fit(img, long_side):
    w, h = img.size
    s = min(1, long_side / max(w, h))
    return img.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else img


def save(img, path, q=86):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "WEBP", quality=q, method=6)
    print("  ->", os.path.relpath(path, ROOT), img.size, os.path.getsize(path) // 1024, "KB", flush=True)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read()))


t0 = time.time()
# 1. dish photos from the restaurant's ordering page
for d in L["dishes"]:
    url = L["base"] + urllib.parse.quote(d["path"])
    try:
        im = fetch(url)
    except Exception:
        # some file names are stored decomposed (å/ä/ö)
        import unicodedata
        im = fetch(L["base"] + urllib.parse.quote(unicodedata.normalize("NFD", d["path"])))
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, (255, 255, 255, 0))
    has_alpha = np.asarray(rgba)[:, :, 3].min() < 250
    if d["crop"]:  # banner cards: keep only the food at the top
        w, h = rgba.size
        rgba = rgba.crop((0, 0, w, int(h * 0.64)))
    print(d["slug"], im.size, "alpha" if has_alpha else "", flush=True)
    big = sr(rgba.convert("RGB"))
    if has_alpha:
        a = rgba.getchannel("A").resize(big.size, Image.LANCZOS)
        big.putalpha(a)
    save(fit(big, 1600), os.path.join(ROOT, f"grillkoket/img/dishes/{d['slug']}.webp"))
    save(fit(big, 320), os.path.join(ROOT, f"grillkoket/img/dishes/{d['slug']}-sm.webp"), 82)

# 2. the restaurant's own photos (hero, gallery, award)
for n in L["site"]:
    im = Image.open(os.path.join(ROOT, f"grillkoket/img/{n}.webp")).convert("RGB")
    print(n, im.size, flush=True)
    big = sr(im)
    for side, suf, q in [(3840, "-4k", 84), (2560, "-2k", 82), (1280, "", 80)]:
        save(fit(big, side), os.path.join(ROOT, f"grillkoket/img/hd/{n}{suf}.webp"), q)
g = sr(Image.open(os.path.join(ROOT, "tools/upscale/src/gala-crop.jpg")))
for side, suf, q in [(3440, "-4k", 84), (2560, "-2k", 82), (1280, "", 80)]:
    save(fit(g, side), os.path.join(ROOT, f"grillkoket/img/hd/gala{suf}.webp"), q)

# 3. AI layer photos (RGB, alpha is cut locally afterwards)
src = os.path.join(ROOT, "tools/upscale/src/exploded")
for f in sorted(os.listdir(src)):
    im = Image.open(os.path.join(src, f)).convert("RGB")
    print(f, im.size, flush=True)
    big = fit(sr(im), 2400)
    os.makedirs(os.path.join(ROOT, "tools/upscale/out/exploded"), exist_ok=True)
    big.save(os.path.join(ROOT, "tools/upscale/out/exploded", f.replace(".webp", ".png")), optimize=True)
print("done in", round(time.time() - t0), "s")
