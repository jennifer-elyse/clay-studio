"""Build blue clay animation WebPs from the two generated Clay Studio images.

Source files: public/assets/animations/blue/source-ball.webp and source-unicorn.webp.
Uses a single imported raster for each character across every frame so sculpted
features cannot drift, change topology, or lose registration between frames.

Requirements: Pillow >= 10. `python scripts/render-blue-from-art.py`
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/studio/public/assets/animations/blue"
FRAME_COUNT = 16
FRAME_MS = 200
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
    kind = MOTIONS[name]
    t = 2 * math.pi * i / FRAME_COUNT
    # Differ per-command phase and motion amplitude, with a seamless period.
    phase = (COMMANDS + AMBIENT).index(name) * .12
    s = math.sin(t + phase)
    c = math.cos(t + phase)
    if kind == "roll":
        return 0.955 + .006 * c, 7.0 * s, 5.0 * s, -1.0 * abs(c)
    if kind == "bounce":
        return 0.956 + .014 * c, 1.4 * s, 1.2 * s, -5.0 * (1 + c)
    if kind == "think":
        return .966 + .005 * c, 3.2 * s, 1.8 * s, -1.5 * abs(s)
    if kind == "focus":
        return .965 + .008 * c, 1.6 * s, .9 * s, 1.8 * c
    if kind == "interested":
        return .963 + .009 * c, 2.0 * s, 2.2 * c, -2.3 * (1 + s)
    if kind == "judging":
        return .969 + .006 * c, -3.0 + .8 * s, 1.0 * s, -1.0 * c
    if kind == "concerned":
        return .965 + .006 * c, 1.9 * s, 1.0 * s, .8 * c
    if kind == "settle":
        return .967 + .004 * c, .65 * s, .65 * s, 2.0 * c
    return .966 + .005 * c, .75 * s, .75 * s, -1.0 * c


def morph_frame(blue: Image.Image, unicorn: Image.Image, i: int, name: str) -> Image.Image:
    t = 2 * math.pi * i / FRAME_COUNT + (.30 if name == "pop-shape" else 0)
    # Shape-crossfade drawn from *the two supplied images*, no temporary SVG art.
    weights = [0, 0, 0, .07, .22, .52, .78, 1., 1., 1., 1., .9, .7, .42, .18, .03]
    alpha = weights[i]
    blue_layer = composed_character(blue, .966 - .06 * alpha, 2 * math.sin(t), 0, 0)
    uni_layer = composed_character(unicorn, .92 + .045 * alpha, -2 * math.sin(t), 0, -1)
    if alpha == 0: return blue_layer
    result = Image.blend(blue_layer, uni_layer, alpha)
    if .03 < alpha < 1.:
        overlay = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        for k, color in enumerate(((252, 185, 218), (172, 232, 227), (255, 211, 123), (207, 175, 251))):
            rad = t + k * math.pi / 2
            px, py = round(160 + 110 * math.cos(rad)), round(160 + 107 * math.sin(rad))
            r = 2 + ((k + i) % 2)
            d.ellipse((px-r, py-r, px+r, py+r), fill=(*color, 170))
        result.alpha_composite(overlay)
    return result


def generate() -> None:
    blue = Image.open(ASSETS / "source-ball.webp").convert("RGBA")
    unicorn = Image.open(ASSETS / "source-unicorn.webp").convert("RGBA")
    assert blue.size == unicorn.size == (SIDE, SIDE), "source images must be 320x320"
    closed = closed_eye_version(blue)
    for name in COMMANDS + AMBIENT:
        frames = []
        for i in range(FRAME_COUNT):
            if MOTIONS[name] == "morph":
                frame = morph_frame(blue, unicorn, i, name)
            else:
                scale, angle, dx, dy = motion(name, i)
                # Blink on frame 6 for idle-like clips, and frame 5/12 on blink.
                will_blink = (i in (5, 12) if name == "blink" else i == 6 and name not in ("roll", "run", "judging"))
                frame = composed_character(closed if will_blink else blue, scale, angle, dx, dy)
            frames.append(frame)
        dest = ASSETS / f"{name}.webp"
        frames[0].save(dest, "WEBP", save_all=True, append_images=frames[1:], duration=FRAME_MS,
                       loop=0, quality=81, method=4, exact=True)
        with Image.open(dest) as output:
            assert output.size == (SIDE, SIDE) and output.n_frames == FRAME_COUNT, (dest, output.n_frames, output.size)
        print(f"{dest.name}: {FRAME_COUNT} frames, {dest.stat().st_size} bytes")
    manifest = json.loads((ASSETS / "manifest.json").read_text())
    manifest.update({"format": "animated WebP", "theme": "blue",
                     "command_files": [f"{name}.webp" for name in COMMANDS],
                     "ambient_files": [f"{name}.webp" for name in AMBIENT],
                     "source_art": ["source-ball.webp", "source-unicorn.webp"],
                     "generator": "python3 scripts/render-blue-from-art.py",
                     "resolution": "320x320", "frames_per_clip": FRAME_COUNT,
                     "frame_duration_ms": FRAME_MS,
                     "note": "Blue Clay is animated directly from the generated blue-ball and white-unicorn illustration assets. Both characters retain their sculpted clay material throughout; all 20 slash-command and 7 ambient clips are actual animated WebPs."})
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    try:
        generate()
    except Exception as error:
        print(f"render-blue-from-art failed: {error}", file=sys.stderr)
        raise