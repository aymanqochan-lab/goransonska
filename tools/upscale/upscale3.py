"""Sharded 4x upscaling (Real-ESRGAN general x4v3, fast). Usage: upscale3.py <weights> <shard> <nshards>"""
import io, json, os, sys, time, unicodedata, urllib.parse, urllib.request
import numpy as np, torch
from PIL import Image
from spandrel import ModelLoader

here = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(here))
W, SH, N = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
torch.set_num_threads(os.cpu_count() or 4)
model = ModelLoader().load_from_file(W).eval()
OUT = os.path.join(ROOT, "out")

def sr(img, tile=384, pad=16):
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0; h, w, _ = a.shape
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            y0, x0, y1, x1 = max(0, y - pad), max(0, x - pad), min(h, y + tile + pad), min(w, x + tile + pad)
            t = torch.from_numpy(a[y0:y1, x0:x1].transpose(2, 0, 1)).unsqueeze(0)
            with torch.no_grad(): o = model(t)[0].clamp(0, 1).numpy().transpose(1, 2, 0)
            oy, ox = (y - y0) * 4, (x - x0) * 4; th, tw = (min(h, y + tile) - y) * 4, (min(w, x + tile) - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = o[oy:oy + th, ox:ox + tw]
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8))

def fit(img, s):
    w, h = img.size; k = min(1, s / max(w, h))
    return img.resize((round(w * k), round(h * k)), Image.LANCZOS) if k < 1 else img

def save(img, rel, q=86):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    if p.endswith(".png"): img.save(p, optimize=True)
    else: img.save(p, "WEBP", quality=q, method=6)
    print("  ->", rel, img.size, os.path.getsize(p) // 1024, "KB", flush=True)

def fetch(url):
    return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()))

L = json.load(open(os.path.join(here, "list.json"), encoding="utf8"))
NEW = json.load(open(os.path.join(here, "new_exploded.json")))
tasks = [("dish", d) for d in L["dishes"]] + [("site", n) for n in L["site"]] + [("gala", None)]
tasks += [("exp", f) for f in sorted(os.listdir(os.path.join(here, "src/exploded")))] + [("new", (k, u)) for k, u in NEW.items()]
t0 = time.time()
for i, (kind, item) in enumerate(tasks):
    if i % N != SH: continue
    if kind == "dish":
        try: im = fetch(L["base"] + urllib.parse.quote(item["path"]))
        except Exception: im = fetch(L["base"] + urllib.parse.quote(unicodedata.normalize("NFD", item["path"])))
        rgba = im.convert("RGBA"); has_a = np.asarray(rgba)[:, :, 3].min() < 250
        if item["crop"]:
            w, h = rgba.size; rgba = rgba.crop((0, 0, w, int(h * 0.64)))
        print(item["slug"], im.size, flush=True)
        big = sr(rgba.convert("RGB"))
        if has_a: big.putalpha(rgba.getchannel("A").resize(big.size, Image.LANCZOS))
        save(fit(big, 1600), f"grillkoket/img/dishes/{item['slug']}.webp")
        save(fit(big, 320), f"grillkoket/img/dishes/{item['slug']}-sm.webp", 82)
    elif kind == "site":
        im = Image.open(os.path.join(ROOT, f"grillkoket/img/{item}.webp")).convert("RGB"); print(item, im.size, flush=True)
        big = sr(im)
        for side, suf, q in [(3840, "-4k", 84), (2560, "-2k", 82), (1280, "", 80)]: save(fit(big, side), f"grillkoket/img/hd/{item}{suf}.webp", q)
    elif kind == "gala":
        big = sr(Image.open(os.path.join(here, "src/gala-crop.jpg")))
        for side, suf, q in [(3440, "-4k", 84), (2560, "-2k", 82), (1280, "", 80)]: save(fit(big, side), f"grillkoket/img/hd/gala{suf}.webp", q)
    elif kind == "exp":
        im = Image.open(os.path.join(here, "src/exploded", item)).convert("RGB"); print(item, flush=True)
        save(fit(sr(im), 2400), "exploded/" + item.replace(".webp", ".png"))
    else:
        k, u = item; im = fetch(u).convert("RGB"); print(k, flush=True)
        save(fit(sr(im), 2400), f"exploded/{k}.png")
print("shard", SH, "done in", round(time.time() - t0), "s")
