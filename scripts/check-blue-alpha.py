"""Regression-check transparent backgrounds on Blue Gumby Clay WebP clips.

Called after asset generation in CI. Every frame must have an actual alpha
channel with entirely transparent outer borders; no opaque matte backgrounds.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/studio/public/assets/animations/blue"
CLIPS = ("blink", "clear", "help", "idle", "new", "image", "pop-shape")

for name in CLIPS:
    path = ASSETS / f"{name}.webp"
    with Image.open(path) as webp:
        frame_count = webp.n_frames
        for i in range(frame_count):
            webp.seek(i)
            frame = webp.convert("RGBA")
            alpha = frame.getchannel("A")
            width, height = frame.size
            pixels = alpha.load()
            assert alpha.getextrema() == (0, 255), f"{name}[{i}] missing full transparency"
            assert all(pixels[x, 0] == 0 and pixels[x, height - 1] == 0 for x in range(width)), f"{name}[{i}] nontransparent top/bottom edge"
            assert all(pixels[0, y] == 0 and pixels[width - 1, y] == 0 for y in range(height)), f"{name}[{i}] nontransparent left/right edge"
            histogram = alpha.histogram()
            assert histogram[0] >= width * height // 4, f"{name}[{i}] excessive opaque matte"
    print(f"{name}: {frame_count} transparent frames; outer borders and corners are clear")
