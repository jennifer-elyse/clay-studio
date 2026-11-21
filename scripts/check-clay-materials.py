"""Validate animated Clay material maps without assuming transparent corners are enough."""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "apps/studio/public/assets/animations/blue"
MATERIAL = SOURCE / "material"
manifest = json.loads((MATERIAL / "manifest.json").read_text())
assert manifest["white_point"] == 240
assert manifest["max_specular_fraction"] <= .08
assert manifest["maps_are_registered"]
assert len(manifest["clips"]) == 27, "Missing registered slash or ambient material maps"

for clip in manifest["clips"]:
    with Image.open(SOURCE / clip) as raw, Image.open(MATERIAL / clip) as atlas:
        assert atlas.size == (640, 640), (clip, atlas.size)
        assert atlas.n_frames == raw.n_frames, (clip, atlas.n_frames, raw.n_frames)
        for i in range(atlas.n_frames):
            atlas.seek(i)
            original = atlas.crop((0, 0, 320, 320)).convert("RGBA")
            diffuse = atlas.crop((320, 0, 640, 320)).convert("RGBA")
            light = atlas.crop((0, 320, 320, 640)).convert("RGBA")
            specular = atlas.crop((320, 320, 640, 640)).convert("RGBA")
            alpha = original.getchannel("A")
            assert alpha.getpixel((0, 0)) == 0, f"{clip}[{i}]: opaque corner"
            coverage = diffuse.getchannel("A")
            assert coverage.tobytes() == light.getchannel("A").tobytes(), f"{clip}[{i}]: light mask drift"
            assert coverage.tobytes() == specular.getchannel("A").tobytes(), f"{clip}[{i}]: specular mask drift"
            # WebP may introduce a few grayscale quantization units.
            assert specular.getchannel("R").getextrema()[1] <= 30, f"{clip}[{i}]: overly strong specular"
            assert coverage.getextrema()[1] > 20 or clip in ("image.webp", "pop-shape.webp"), f"{clip}[{i}]: no clay material"
    print(f"{clip}: {atlas.n_frames} registered material frames OK")
