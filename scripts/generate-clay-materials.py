"""Build registered Clay material atlases from authored local animated WebPs.

Each 640px frame contains four exactly registered 320px material panels:
original image, neutral diffuse+alpha mask, grayscale light, and specular.
A single animated WebP keeps all panels on the same animation clock.

Maps are estimations from artwork, not measured physical PBR properties.
Requires Pillow, numpy, scipy. Run: python scripts/generate-clay-materials.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "apps/studio/public/assets/animations/blue"
OUTPUT = SOURCE / "material"
SIDE = 320
WHITE_POINT = 240
SPECULAR_PEAK = .08
MORPH_NAMES = {"image", "pop-shape"}


def registered_maps(frame: Image.Image, is_morph: bool = False) -> Image.Image:
    """Recover body diffuse/light/specular and separate its material alpha."""
    source = np.asarray(frame.convert("RGBA"), dtype=np.uint8)
    height, width, _ = source.shape
    if (height, width) != (SIDE, SIDE):
        raise ValueError(f"Expected {SIDE}x{SIDE} frame, got {width}x{height}")

    rgb = source[:, :, :3].astype(np.float32)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    alpha = source[:, :, 3].astype(np.float32)
    # Use the connected body material, not independent per-pixel RGB thresholds.
    # Dark blue clay shadows belong to the same region; isolated blue irises do not.
    seeds = ((alpha >= 45) & (blue > 45) & (blue > green * 1.13)
             & (blue > red * 1.32) & (green > red * .91)
             & (blue - red > 34))
    seeds = ndi.binary_opening(seeds, structure=np.ones((2, 2), dtype=bool))
    regions, number = ndi.label(seeds)
    if number:
        counts = np.bincount(regions.ravel())
        counts[0] = 0
        dominant = regions == counts.argmax()
        # The unicorn's blue mane and blue horn are not recolorable clay body.
        if is_morph and counts.max() < SIDE * SIDE * .07:
            dominant[:] = False
    else:
        dominant = np.zeros((SIDE, SIDE), dtype=bool)

    body = ndi.binary_dilation(dominant, iterations=3) & (alpha > 12)
    coverage = np.clip(ndi.gaussian_filter(body.astype(np.float32), sigma=.75), 0, 1)
    original = source.copy()
    if not is_morph and np.any(dominant):
        # Strip the photograph's dark outer matte without removing facial details.
        # The filled silhouette keeps whites, pupils and mouth opaque.
        # Remove thin connected dark crown artifacts from the original sprite.
        # The body mask still includes sculpted blue details; the silhouette
        # receives a disk opening only to remove outlying matte protrusions.
        yy, xx = np.ogrid[-6:7, -6:7]
        disc = (xx * xx + yy * yy) <= 36
        silhouette = ndi.binary_fill_holes(
            ndi.binary_opening(dominant, structure=disc)
        )
        silhouette = ndi.gaussian_filter(silhouette.astype(np.float32), sigma=2.4) >= .48
        silhouette = ndi.gaussian_filter(silhouette.astype(np.float32), sigma=.8)
        original[:, :, 3] = np.uint8(np.minimum(alpha, silhouette * 255))

    # The brightest channel is a neutral reflectance reference; averaging RGB
    # would bake source blue's dark luminance into pink/turquoise selections.
    brightest = np.max(rgb, axis=2)
    valid = (alpha > 50).astype(np.float32)
    neighborhood = ndi.gaussian_filter(brightest * valid, sigma=7)
    weight = ndi.gaussian_filter(valid, sigma=7)
    smooth = neighborhood / np.maximum(weight, 1.e-5)
    # Broad lighting is deliberately softer than the source's baked blue shade.
    # Retain granular clay texture separately in neutral diffuse.
    light = np.clip(.48 + .52 * np.power(np.clip(smooth / 245, 0, 1.15), .7), .56, 1.08)
    light_gray = np.uint8(np.round(np.clip(light * WHITE_POINT, 0, 255)))
    diffuse_gray = np.uint8(np.round(np.clip(
        WHITE_POINT * np.power(np.clip(brightest / np.maximum(smooth, 1), .4, 1.5), .25),
        183, 252
    )))
    # Only the strongest localized highlights appear in specular, max 8%.
    specular_gray = np.uint8(np.round(
        np.clip((brightest - smooth - 9) / 85, 0, 1) * (255 * SPECULAR_PEAK)
    ))
    mask = np.uint8(np.round(coverage * 255))
    specular_gray = np.where(mask > 2, specular_gray, 0).astype(np.uint8)

    def panel(value):
        pixels = np.empty((SIDE, SIDE, 4), dtype=np.uint8)
        pixels[:, :, :3] = value[:, :, None]
        pixels[:, :, 3] = mask
        return Image.fromarray(pixels, "RGBA")

    atlas = Image.new("RGBA", (SIDE * 2, SIDE * 2))
    atlas.paste(Image.fromarray(original, "RGBA"), (0, 0))
    atlas.paste(panel(diffuse_gray), (SIDE, 0))
    atlas.paste(panel(light_gray), (0, SIDE))
    atlas.paste(panel(specular_gray), (SIDE, SIDE))
    return atlas


def generate():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((SOURCE / "manifest.json").read_text(encoding="utf-8"))
    names = sorted({Path(name).stem for name in
                    (manifest["command_files"] + manifest["ambient_files"])})
    chosen = [value.strip() for value in os.getenv("CLAY_MATERIAL_CLIPS", "").split(",") if value.strip()]
    if chosen:
        if not set(chosen) <= set(names):
            raise ValueError(f"Unknown material clips: {set(chosen) - set(names)}")
        names = chosen
    for name in names:
        frames, durations = [], []
        with Image.open(SOURCE / f"{name}.webp") as clip:
            for index in range(clip.n_frames):
                clip.seek(index)
                frames.append(registered_maps(clip.convert("RGBA"), name in MORPH_NAMES))
                durations.append(int(clip.info.get("duration", 100)))
        output = OUTPUT / f"{name}.webp"
        frames[0].save(output, "WEBP", save_all=True, append_images=frames[1:],
                       duration=durations, loop=0, quality=90, method=2, exact=True)
        with Image.open(output) as check:
            assert check.size == (SIDE * 2, SIDE * 2)
            assert check.n_frames == len(frames), (name, len(frames), check.n_frames)
        print(f"{name}: {len(frames)} registered map frames ({output.stat().st_size:,} bytes)")
    if chosen:
        return
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "version": 1, "resolution": [SIDE * 2, SIDE * 2],
        "source_frame": [SIDE, SIDE],
        "layout": {"original": [0, 0], "diffuse_and_mask": [SIDE, 0],
                   "light": [0, SIDE], "specular": [SIDE, SIDE]},
        "white_point": WHITE_POINT, "max_specular_fraction": SPECULAR_PEAK,
        "material_source": "estimated from approved illustrated photography, not measured PBR",
        "maps_are_registered": True,
        "clips": [f"{name}.webp" for name in names],
        "generator": "python3 scripts/generate-clay-materials.py",
    }, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    generate()
