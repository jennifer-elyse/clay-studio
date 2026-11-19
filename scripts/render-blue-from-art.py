"""Render Blue Gumby Clay animations from the approved mascot reference atlas.

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
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/studio/public/assets/animations/blue"
ATLAS = ASSETS / "reference-atlas.webp"
FRAME_COUNT = 32
FRAME_MS = 100
SIDE = 320

COMMANDS = [
    "spec", "plan", "build", "run", "fix", "docs", "help", "clear", "search",
    "think", "summarize", "write", "code", "image", "upload", "settings",
    "new", "seats", "stop", "debug",
]
AMBIENT = ["idle", "blink", "rolling", "pop-shape", "interested", "judging", "concerned"]

# Match each slash-command's intent to one of the ten real expressions.
POSES = {
    "spec": "curious", "plan": "thinking", "build": "focused", "run": "excited",
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
    return art


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


def morph_frame(art, index):
    # Disjoint intervals: no overlapping transparent ghosts or alternate faces.
    if index < 8:
        return display_character(art["blue"], scale=.966 + .003 * math.cos(index*.8), angle=.7 * math.sin(index*.8), dy=-.5 + 1.0 * math.cos(index*.8))
    if index < 12:
        p = (index - 8) / 4
        frame = display_character(art["blue"], scale=.966 - .82 * p, angle=3 * p)
        return sparkle_overlay(frame, p, index)
    if index < 16:
        p = (index - 12) / 4
        frame = display_character(art["unicorn"], scale=.20 + .76 * p, angle=-3 * (1 - p))
        return sparkle_overlay(frame, 1 - p, index)
    if index < 24:
        return display_character(art["unicorn"], scale=.965 + .002 * math.cos(index*.9), angle=.6 * math.sin(index*.9), dy=1.0 * math.cos(index*.9))
    if index < 28:
        p = (index - 24) / 4
        return sparkle_overlay(display_character(art["unicorn"], scale=.966 - .82 * p), p, index)
    p = (index - 28) / 4
    return sparkle_overlay(display_character(art["blue"], scale=.20 + .75 * p), 1 - p, index)


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
        frames = list(frames_for(art, name))
        out = ASSETS / f"{name}.webp"
        frames[0].save(out, "WEBP", save_all=True, append_images=frames[1:],
                       duration=FRAME_MS, loop=0, quality=83, method=3, exact=True)
        with Image.open(out) as check:
            assert check.size == (SIDE, SIDE) and check.n_frames >= 24, (name, check.n_frames)
        print(f"{name}: {out.stat().st_size:,} bytes, {FRAME_COUNT} sampled frames")
    if os.getenv("CLAY_BLUE_CLIPS"):
        return
    manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
    manifest.update({
        "format": "animated WebP", "theme": "blue",
        "command_files": [f"{name}.webp" for name in COMMANDS],
        "ambient_files": [f"{name}.webp" for name in AMBIENT],
        "source_art": ["reference-atlas.webp"],
        "generator": "python3 scripts/render-blue-from-art.py",
        "resolution": "320x320", "sampled_frames_per_clip": FRAME_COUNT,
        "frame_duration_ms": FRAME_MS, "render_version": "7-1-showcase-v3",
        "expressions": ["neutral", "happy", "excited", "curious", "thinking", "focused", "playful", "surprised", "proud", "sleepy"],
        "note": "Frames originate from the approved Clay Studio Blue Gumby Clay mascot showcase. The 10 expressions, 5-step blink, and unicorn are preserved as matching artwork from a single atlas; transitions operate on the whole clay character, never independent eye overlays.",
    })
    (ASSETS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    try:
        generate()
    except Exception as exc:
        print(f"Blue Clay renderer failed: {exc}", file=sys.stderr)
        raise
