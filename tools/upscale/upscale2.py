"""Download newly generated layer photos and upscale them 4x (Real-ESRGAN)."""
import io, json, os, urllib.request, importlib.util
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("up", os.path.join(here, "upscale_core.py")); up = importlib.util.module_from_spec(spec); spec.loader.exec_module(up)
L = json.load(open(os.path.join(here, "new_exploded.json")))
os.makedirs(os.path.join(here, "src/exploded2"), exist_ok=True); os.makedirs(os.path.join(here, "out/exploded"), exist_ok=True)
for name, url in L.items():
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
    im = Image.open(io.BytesIO(raw)).convert("RGB"); print(name, im.size, flush=True)
    im.save(os.path.join(here, "src/exploded2", name + ".png"))
    up.fit(up.sr(im), 2400).save(os.path.join(here, "out/exploded", name + ".png"), optimize=True)
