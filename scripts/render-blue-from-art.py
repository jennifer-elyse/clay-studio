"""Build blue clay animation WebPs from the two generated Clay Studio images.

Source files: public/assets/animations/blue/source-ball.webp and source-unicorn.webp.
Uses a single imported raster for each character across every frame so sculpted
features cannot drift, change topology, or lose registration between frames.

Requirements: Pillow >= 10. `python scripts/render-blue-from-art.py`
"""
from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/studio/public/assets/animations/blue"
FRAME_COUNT = 32
FRAME_MS = 100
SIDE = 320

COMMANDS = [
    "spec", "plan", "build", "run", "fix", "docs", "help", "clear", "search",
    "think", "summarize", "write", "code", "image", "upload", "settings",
    "new", "seats", "stop", "debug",
]
AMBIENT = ["idle", "blink", "rolling", "pop-shape", "interested", "judging", "concerned"]

MOTIONS = {
    "image": "morph", "pop-shape": "morph", "rolling": "roll", "run": "roll",
    "plan": "think", "think": "think", "spec": "think", "summarize": "think",
    "build": "focus", "code": "focus", "write": "focus", "fix": "focus", "debug": "focus", "docs": "focus",
    "help": "bounce", "settings": "bounce", "new": "bounce", "seats": "bounce",
    "interested": "interested", "search": "interested", "upload": "interested",
    "judging": "judging", "concerned": "concerned", "clear": "settle", "stop": "settle",
    "idle": "idle", "blink": "blink",
}


def composed_character(source: Image.Image, scale: float, angle: float, dx: float, dy: float) -> Image.Image:
    width = max(1, round(SIDE * scale))
    character = source.resize((width, width), Image.Resampling.LANCZOS)
    if abs(angle) > 0.02:
        character = character.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    x = round((SIDE - character.width) / 2 + dx)
    y = round((SIDE - character.height) / 2 + dy)
    frame.alpha_composite(character, (x, y))
    return frame


def closed_eye_version(source: Image.Image) -> Image.Image:
    """Use existing cheek material for the blink rather than synthetic flat eye art."""
    closed = source.copy()
    for x, y, radius_x, radius_y in [(118, 144, 37, 33), (204, 146, 36, 32)]:
        # Borrow adjacent blue clay texture, but feather into the original blue
        # eyelids. This keeps material continuous and avoids a cutout seam.
        sampled = source.crop((x - 40, 201, x + 40, 269)).resize((radius_x * 2 + 8, radius_y * 2 + 8), Image.Resampling.LANCZOS)
        mask = Image.new("L", sampled.size, 0)
        d = ImageDraw.Draw(mask)
        d.ellipse((4, 4, sampled.width - 5, sampled.height - 5), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(4))
        closed.paste(sampled, (x - sampled.width // 2, y - sampled.height // 2), mask)
        draw = ImageDraw.Draw(closed)
        # Rounded, upper eyelid fold in shades found in the blue ball itself.
        draw.arc((x - 29, y - 6, x + 29, y + 15), 5, 174, fill=(19, 92, 159, 232), width=3)
        draw.arc((x - 27, y - 10, x + 26, y + 12), 15, 165, fill=(94, 171, 225, 162), width=2)
    return closed


def motion(name: str, i: int) -> tuple[float, float, float, float]:
    """Subtle periodic clay motion sampled at 10 fps without hard seams."""
    kind = MOTIONS[name]
    t = 2 * math.pi * i / FRAME_COUNT
    phase = (COMMANDS + AMBIENT).index(name) * .12
    s, c = math.sin(t + phase), math.cos(t + phase)
    if kind == "roll":
        return .955 + .004 * c, 5.6 * s, 4.4 * s, -1.0 * abs(c)
    if kind == "bounce":
        return .959 + .009 * c, 1.2 * s, 1.2 * s, -3.8 * (1 + c)
    if kind == "think":
        return .965 + .004 * c, 2.4 * s, 1.4 * s, -1.0 * abs(s)
    if kind == "focus":
        return .966 + .006 * c, 1.2 * s, .8 * s, 1.4 * c
    if kind == "interested":
        return .965 + .006 * c, 1.5 * s, 1.8 * c, -1.9 * (1 + s)
    if kind == "judging":
        return .969 + .004 * c, -2.2 + .7 * s, .7 * s, -.8 * c
    if kind == "concerned":
        return .966 + .005 * c, 1.3 * s, .9 * s, .8 * c
    if kind == "settle":
        return .967 + .003 * c, .5 * s, .5 * s, 1.5 * c
    return .966 + .003 * c, .6 * s, .65 * s, -.7 * c


def smoothstep(value: float) -> float:
    v = min(1., max(0., value))
    return v * v * (3 - 2 * v)


def blink_opacity(name: str, i: int) -> float:
    """Ramp eyelids across several frames, not a single-frame texture swap."""
    if name in ("rolling", "run", "judging"):
        return 0.
    centers = (9, 23) if name == "blink" else (19,)
    return max(smoothstep(1 - abs(i - center) / 3.) for center in centers)


def smooth_image(blue: Image.Image, closed: Image.Image, name: str, i: int) -> Image.Image:
    amount = blink_opacity(name, i)
    return blue if amount < .0001 else (closed if amount > .9999 else Image.blend(blue, closed, amount))


def sparkle_cloud(frame: Image.Image, progress: float, seed: int) -> Image.Image:
    """Small glitter during the two shape swaps."""
    over = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    tone = ((251, 200, 239), (183, 234, 230), (255, 219, 151), (218, 195, 250))
    radius = 29 + 79 * smoothstep(progress)
    for k in range(12):
        theta = k * math.pi / 6 + seed * .29
        x = 160 + radius * math.cos(theta)
        y = 156 + radius * .81 * math.sin(theta)
        size = 2.7 + (k % 3) * .8
        d.ellipse((x - size, y - size, x + size, y + size), fill=(*tone[k % 4], 160))
    frame.alpha_composite(over)
    return frame


def morph_frame(blue: Image.Image, unicorn: Image.Image, i: int, name: str) -> Image.Image:
    """Pop-and-reveal: no ghosted double-character crossfade."""
    t = i / FRAME_COUNT
    if t < .26:
        img = composed_character(blue, .966, 1.3 * math.sin(2 * math.pi * t), 0., 0.)
    elif t < .38:
        amount = smoothstep((t - .26) / .12)
        img = composed_character(blue, .966 * (1 - amount) + .12 * amount, 7 * amount, 0., 2 * amount)
        img = sparkle_cloud(img, amount, i)
    elif t < .53:
        amount = smoothstep((t - .38) / .15)
        img = composed_character(unicorn, .12 + .84 * amount, -5 * (1 - amount), 0., 2 * (1 - amount))
        img = sparkle_cloud(img, 1 - amount, i)
    elif t < .78:
        img = composed_character(unicorn, .96 + .008 * math.sin((t - .53) * 8), 0., 0., 0.)
    elif t < .87:
        amount = smoothstep((t - .78) / .09)
        img = composed_character(unicorn, .96 * (1 - amount) + .12 * amount, 4 * amount, 0., 2 * amount)
        img = sparkle_cloud(img, amount, i)
    else:
        amount = smoothstep((t - .87) / .13)
        img = composed_character(blue, .12 + .846 * amount, -4 * (1 - amount), 0., 2 * (1 - amount))
        img = sparkle_cloud(img, 1 - amount, i)
    return img


def generate() -> None:
    blue = Image.open(ASSETS / "source-ball.webp").convert("RGBA")
    unicorn = Image.open(ASSETS / "source-unicorn.webp").convert("RGBA")
    assert blue.size == unicorn.size == (SIDE, SIDE), "source images must be 320x320"
    closed = closed_eye_version(blue)
    names = [item.strip() for item in os.getenv("CLAY_BLUE_CLIPS", "").split(",") if item.strip()] or COMMANDS + AMBIENT
    for name in names:
        frames = []
        for i in range(FRAME_COUNT):
            if MOTIONS[name] == "morph":
                frame = morph_frame(blue, unicorn, i, name)
            else:
                scale, angle, dx, dy = motion(name, i)
                frame = composed_character(smooth_image(blue, closed, name, i), scale, angle, dx, dy)
            frames.append(frame)
        dest = ASSETS / f"{name}.webp"
        frames[0].save(dest, "WEBP", save_all=True, append_images=frames[1:], duration=FRAME_MS,
                       loop=0, quality=82, method=3, exact=True)
        with Image.open(dest) as output:
            assert output.size == (SIDE, SIDE) and output.n_frames >= FRAME_COUNT - 8, (dest, output.n_frames, output.size)
        print(f"{dest.name}: {FRAME_COUNT} frames, {dest.stat().st_size} bytes")
    if os.getenv("CLAY_BLUE_CLIPS"):
        return
    manifest = json.loads((ASSETS / "manifest.json").read_text())
    manifest.update({"format": "animated WebP", "theme": "blue",
                     "command_files": [f"{name}.webp" for name in COMMANDS],
                     "ambient_files": [f"{name}.webp" for name in AMBIENT],
                     "source_art": ["source-ball.webp", "source-unicorn.webp"],
                     "generator": "python3 scripts/render-blue-from-art.py",
                     "resolution": "320x320", "sampled_frames_per_clip": FRAME_COUNT,
                     "frame_duration_ms": FRAME_MS, "render_version": "7-1-smooth-rig-v2",
                     "note": "Blue Clay is animated directly from the generated blue-ball and white-unicorn illustration assets. Smoother 10fps clay movement, eased eyelid motion, and a non-ghosting unicorn transformation preserve the sculpted surfaces throughout every clip."})
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    try:
        generate()
    except Exception as error:
        print(f"render-blue-from-art failed: {error}", file=sys.stderr)
        raise