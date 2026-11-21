"""Render Clay animations from the approved mascot reference atlas.

The atlas contains the original sculpted blue-ball appearance, ten expressions,
five photographed blink states, and the white unicorn from the supplied showcase.
No synthetic SVG eyes, overlaid lids or replacement facial artwork are used.

Run: python3 scripts/render-blue-from-art.py
Dependencies: Pillow >= 10; works with the existing 7-1 asset workflow.
"""
from __future__ import annotations

import json
import math
import os
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/studio/public/assets/animations/blue"
ATLAS = ASSETS / "reference-atlas.webp"
# Exact 12-frame generated metamorphosis, maintained separately from the expression atlas.
MORPH_SOURCE = ASSETS / "morph-source.webp"
FRAME_COUNT = 32
FRAME_MS = 100
SIDE = 320

COMMANDS = [
    "constitution", "spec", "clarify", "plan", "checklist", "tasks", "analyze",
    "build", "converge", "run", "fix", "docs", "help", "clear", "search",
    "think", "summarize", "write", "code", "image", "upload", "settings",
    "new", "seats", "stop", "debug",
]
AMBIENT = ["idle", "blink", "rolling", "pop-shape", "interested", "judging", "concerned"]

# Match each slash-command's intent to one of the ten real expressions.
POSES = {
    "spec": "curious", "plan": "thinking", "build": "focused", "run": "excited",
    "constitution": "thinking", "clarify": "curious", "checklist": "happy",
    "tasks": "focused", "analyze": "curious", "converge": "focused",
    "fix": "focused", "docs": "thinking", "help": "happy", "clear": "neutral",
    "search": "curious", "think": "thinking", "summarize": "thinking", "write": "happy",
    "code": "focused", "image": "morph", "upload": "excited", "settings": "neutral",
    "new": "happy", "seats": "curious", "stop": "sleepy", "debug": "focused",
    "idle": "neutral", "blink": "neutral", "rolling": "playful", "pop-shape": "morph",
    "interested": "curious", "judging": "focused", "concerned": "surprised",
}


def load_art():
    with Image.open(ATLAS) as sheet:
        atlas = sheet.convert("RGBA")
    if atlas.size != (640, 640):
        raise ValueError(f"Expected 640x640 reference atlas, got {atlas.size}")
    art = {
        "blue": atlas.crop((0, 0, 256, 256)),
        "unicorn": atlas.crop((256, 0, 512, 256)),
    }
    names = ["neutral", "happy", "excited", "curious", "thinking", "focused", "playful", "surprised", "proud", "sleepy"]
    for index, name in enumerate(names):
        x = (index % 5) * 128
        y = 256 + (index // 5) * 128
        art[name] = atlas.crop((x, y, x + 128, y + 128))
    art["blinks"] = [atlas.crop((i * 128, 512, (i + 1) * 128, 640)) for i in range(5)]
    # Trim near-transparent matte contamination before resampling.
    for name, sprite in list(art.items()):
        if name == "blinks":
            art[name] = [clean_cutout(frame) for frame in sprite]
        else:
            art[name] = clean_cutout(sprite)
    return art


def clean_cutout(source):
    """Repair dark, nearly-opaque matte pixels at the silhouette edge.

    The approved atlas contains a dark circular fringe baked into RGB even where
    alpha is nonzero. Transparent corners alone do not catch this. Borrow local
    blue clay color from a few pixels INSIDE the silhouette before resampling.
    Face features and the unicorn are left intact away from the alpha boundary.
    """
    original = source.convert("RGBA")
    fixed = original.copy()
    alpha = original.getchannel("A")
    # Detect the interior band around the actual silhouette, not a hard circle.
    inner = alpha.filter(ImageFilter.MinFilter(9))
    px = fixed.load()
    in_alpha = inner.load()
    width, height = fixed.size
    mid_x, mid_y = width / 2, height / 2
    for y in range(height):
        for x in range(width):
            red, green, blue, a = original.getpixel((x, y))
            if a < 15:
                px[x, y] = (0, 0, 0, 0)
                continue
            out_alpha = max(0, min(255, round((a - 14) * 255 / 241)))
            if in_alpha[x, y] < 250:
                inward_x, inward_y = mid_x - x, mid_y - y
                length = max(1, math.hypot(inward_x, inward_y))
                sx = min(width - 1, max(0, round(x + inward_x / length * 7)))
                sy = min(height - 1, max(0, round(y + inward_y / length * 7)))
                sr, sg, sb, sa = original.getpixel((sx, sy))
                if (sa >= 210 and sb > sg * 1.15 and sb > sr * 1.28
                        and blue > green * 1.05):
                    brightness = (red + green + blue) / 3
                    sample_brightness = (sr + sg + sb) / 3
                    if brightness < sample_brightness * .87:
                        weight = min(.93, max(0., (sample_brightness - brightness)
                                              / max(1, sample_brightness)) * .95 + .19)
                        red = round(red * (1 - weight) + sr * weight)
                        green = round(green * (1 - weight) + sg * weight)
                        blue = round(blue * (1 - weight) + sb * weight)
            px[x, y] = (red, green, blue, out_alpha)
    return fixed


def display_character(source, *, scale=1.0, angle=0.0, dx=0.0, dy=0.0):
    """Transform the entire clay image as one rigid material layer."""
    base = source.resize((286, 286), Image.Resampling.LANCZOS)
    size = max(1, round(286 * scale))
    if size != 286:
        base = base.resize((size, size), Image.Resampling.LANCZOS)
    if abs(angle) > 0.01:
        base = base.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", (SIDE, SIDE))
    frame.alpha_composite(base, (round((SIDE - base.width) / 2 + dx), round((SIDE - base.height) / 2 + dy)))
    return frame


def natural_motion(name, index):
    t = 2 * math.pi * index / FRAME_COUNT
    speed = 1 if name not in ("rolling", "run") else 1.4
    wave = math.sin(t * speed)
    wobble = math.cos(t * speed)
    kind = POSES[name]
    if name in ("rolling", "run"):
        return 0.966, 3.2 * wave, 2.8 * wave, -0.8 * abs(wobble)
    if kind in ("excited", "happy", "playful"):
        return .964 + .004 * wobble, 1.0 * wave, 1.6 * wave, -2.0 * (1 + wobble)
    if kind in ("focused", "thinking"):
        return .967 + .002 * wobble, 1.0 * wave, 1.3 * wave, -0.8 * abs(wobble)
    return .966 + .002 * wobble, .6 * wave, 1.0 * wave, -1.0 * abs(wobble)


def blink_sprite(art, name, index):
    # Keyed photos from the supplied blink cycle: open, half, shut, half, open.
    if name == "blink":
        phase = index % 16
        if 7 <= phase <= 11:
            return art["blinks"][phase - 7]
        return art["blinks"][0]
    if name == "idle" and 17 <= index <= 21:
        return art["blinks"][index - 17]
    return art["neutral"]


def sparkle_overlay(frame, progress, seed):
    """Sparkles frame the transformation without obscuring the character."""
    layer = Image.new("RGBA", (SIDE, SIDE))
    draw = ImageDraw.Draw(layer)
    colors = [(255, 201, 144, 210), (255, 182, 224, 185), (159, 236, 248, 190)]
    radius = 53 + 70 * progress
    for j in range(11):
        radians = j * math.tau / 11 + .11 * seed
        cx = 160 + radius * math.cos(radians)
        cy = 160 + radius * .83 * math.sin(radians)
        size = 1.4 + j % 3
        draw.ellipse((cx - size, cy - size, cx + size, cy + size), fill=colors[j % 3])
    frame.alpha_composite(layer)
    return frame


def eased(value):
    x = min(1.0, max(0.0, value))
    return x * x * (3 - 2 * x)


def clay_metamorphosis(art, amount, index):
    """Re-form the body in place without shrinking either character to a dot.

    A curling material boundary reveals new clay across the same silhouette.
    Eyes, lids and mouth always stay registered to their parent illustration.
    """
    amount = eased(amount)
    blue = display_character(art["blue"], scale=.963 + .01 * math.sin(math.pi * amount),
                             angle=-1.8 * math.sin(math.pi * amount), dy=0)
    unicorn = display_character(art["unicorn"], scale=.965, dy=0)
    if amount <= .002:
        return blue
    if amount >= .998:
        return unicorn

    mask = Image.new("L", (SIDE, SIDE))
    pixels = mask.load()
    sweep = -220 + amount * 760
    for y in range(SIDE):
        curve = 23 * math.sin(y / 38.0 + amount * math.pi * 1.3) + 12 * math.sin(y / 71.0 - amount * math.pi)
        for xx in range(SIDE):
            pixels[xx, y] = 255 if xx + curve < sweep else 0
    mask = mask.filter(ImageFilter.GaussianBlur(13))
    return Image.composite(unicorn, blue, mask)


def spell_ribbon(frame, index, intensity):
    """Soft orbital glitter follows the transformation without hiding the face."""
    if intensity <= 0:
        return frame
    ring = Image.new("RGBA", (SIDE, SIDE))
    draw = ImageDraw.Draw(ring, "RGBA")
    phase = index * .18
    for k in range(42):
        t = phase + k * .145
        x = 160 + (117 + 6 * math.sin(k * 1.8)) * math.cos(t)
        y = 163 + (93 + 4 * math.cos(k * 2.1)) * math.sin(t)
        strength = .6 + .4 * math.sin(k * .4 + phase)
        alpha = round(intensity * strength * 180)
        if alpha < 3:
            continue
        color = [(255, 213, 148), (255, 165, 224), (184, 242, 255)][k % 3]
        radius = .85 + (k % 6 == 0) * 2.1
        draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=(*color, alpha))
    glow = ring.filter(ImageFilter.GaussianBlur(3.3))
    glow.putalpha(glow.getchannel("A").point(lambda a: round(a * .50)))
    frame.alpha_composite(glow)
    frame.alpha_composite(ring)
    return frame


def morph_frame(art, index):
    """Continuous blue -> unicorn -> blue loop with visible intermediate poses."""
    t = index / FRAME_COUNT
    if t < .16:
        progress, energy = 0.0, 0.0
    elif t < .46:
        progress = eased((t - .16) / .30)
        energy = math.sin(math.pi * progress) * .9 + .2
    elif t < .65:
        progress, energy = 1.0, .2 if t < .55 else 0.0
    elif t < .95:
        progress = 1 - eased((t - .65) / .30)
        energy = math.sin(math.pi * progress) * .9 + .2
    else:
        progress, energy = 0.0, 0.0
    return spell_ribbon(clay_metamorphosis(art, progress, index), index, min(1.0, energy))


def frames_for(art, name):
    for index in range(FRAME_COUNT):
        pose = POSES[name]
        if pose == "morph":
            yield morph_frame(art, index)
            continue
        source = blink_sprite(art, name, index) if name in ("idle", "blink") else art[pose]
        scale, angle, dx, dy = natural_motion(name, index)
        yield display_character(source, scale=scale, angle=angle, dx=dx, dy=dy)


def generate():
    art = load_art()
    selected = [entry.strip() for entry in os.getenv("CLAY_BLUE_CLIPS", "").split(",") if entry.strip()] or COMMANDS + AMBIENT
    for name in selected:
        if name not in POSES:
            raise ValueError(f"Unknown clip: {name}")
        out = ASSETS / f"{name}.webp"
        if POSES[name] == "morph":
            # Keep the authored, transparent intermediate clay forms EXACTLY.
            # Do not collapse the animation into a two-image wipe or a shrinking swap.
            shutil.copyfile(MORPH_SOURCE, out)
        else:
            frames = list(frames_for(art, name))
            frames[0].save(out, "WEBP", save_all=True, append_images=frames[1:],
                           duration=FRAME_MS, loop=0, quality=83, method=3, exact=True)
        with Image.open(out) as check:
            expected_frames = 12 if POSES[name] == "morph" else 24
            assert check.size == (SIDE, SIDE) and check.n_frames >= expected_frames, (name, check.n_frames)
            actual_frames = check.n_frames
        print(f"{name}: {out.stat().st_size:,} bytes, {actual_frames} frames")
    if os.getenv("CLAY_BLUE_CLIPS"):
        return
    manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    manifest.update({
        "format": "animated WebP", "theme": "blue",
        "command_files": [f"{name}.webp" for name in COMMANDS],
        "ambient_files": [f"{name}.webp" for name in AMBIENT],
        "source_art": ["reference-atlas.webp", "morph-source.webp"],
        "morph_frames": 12,
        "morph_frame_duration_ms": 120,
        "generator": "python3 scripts/render-blue-from-art.py",
        "resolution": "320x320", "sampled_frames_per_clip": FRAME_COUNT,
        "frame_duration_ms": FRAME_MS, "render_version": "7-1-generated-morph-v5",
        "expressions": ["neutral", "happy", "excited", "curious", "thinking", "focused", "playful", "surprised", "proud", "sleepy"],
        "note": "The /image and pop-shape clips copy the exact 12-frame animated WebP created from the user-approved generated GIF. All other clips use the reference atlas. Transparent edges are checked in CI.",
    })
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    try:
        generate()
    except Exception as exc:
        print(f"Blue Clay renderer failed: {exc}", file=sys.stderr)
        raise
