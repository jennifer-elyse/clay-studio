"""Encode a deterministic sequence of transparent PNG frames as animated WebP."""
import glob
import sys
from PIL import Image

source, output, frame_ms = sys.argv[1], sys.argv[2], int(sys.argv[3])
paths = sorted(glob.glob(source + "/*.png"))
if len(paths) != 16:
    raise RuntimeError(f"Expected 16 animation frames for {output}, found {len(paths)}")
frames = [Image.open(path).convert("RGBA") for path in paths]
if any(frame.size != (320, 320) for frame in frames):
    raise RuntimeError(f"Inconsistent dimensions for {output}")
frames[0].save(
    output, format="WEBP", save_all=True, append_images=frames[1:],
    duration=frame_ms, loop=0, quality=83, method=4
)
with Image.open(output) as animation:
    if animation.n_frames != 16 or animation.size != (320, 320):
        raise RuntimeError(f"Invalid encoded animation: {output}")
    for frame in range(animation.n_frames):
        animation.seek(frame)
for frame in frames:
    frame.close()
