import os
import numpy as np, torch
from PIL import Image
from spandrel import ModelLoader
torch.set_num_threads(os.cpu_count() or 4)
model = ModelLoader().load_from_file(os.environ.get("ESRGAN", "RealESRGAN_x4plus.pth")).eval()
def sr(img, tile=256, pad=16):
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
