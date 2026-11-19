# Clay reference artwork (branch `7-1`)

`apps/studio/public/assets/animations/blue/reference-atlas.webp` is cropped from the
user-supplied mascot showcase (19 Nov 2026). The original
artwork defines both the facial design and the blue/unicorn material appearance.
Do **not** replace it with the old synthetic SVG face, the historic stock
`source-ball.webp` or arbitrary overpainted eyelids.

The 640×640 transparent atlas is arranged in 128/256px cells:

- Top row: 256×256 blue smiling mascot (0,0) and finished unicorn (256,0).
- Second row: 128×128 Neutral, Happy, Excited, Curious, Thinking.
- Third row: 128×128 Focused, Playful, Surprised, Proud, Sleepy.
- Fourth row: 128×128 five-step blink sequence.

`scripts/render-blue-from-art.py` maps every command to a corresponding pose,
animates whole-material movement, uses the photographed blink sequence (not an
eye overlay), and performs a no-ghost blue-to-unicorn transformation.
It renders 320×320 32-sample animated WebPs for all 20 slash commands and 7
ambient clips. The GitHub Actions workflow on `7-1` regenerates these files
and commits them. Preserve source and output as project-local assets.

To rebuild: `python3 -m pip install Pillow==11.3.0 && python3 scripts/render-blue-from-art.py`.
To inspect individual clips: `CLAY_BLUE_CLIPS=idle,blink,image python3 scripts/render-blue-from-art.py`.

## Runtime color and edge handling

The public theme identifier remains `blue` for compatibility, but the user-facing
mascot name is **Clay**. The Clay color selector persists independently in
`clay-studio-clay-color`, and `ClayCanvas.jsx` composites the authored animated
WebPs frame-by-frame without flattening them onto a dark CSS background.
Saturated cobalt body pixels are recolored while non-blue face and unicorn
pixels remain unchanged. The same WebP paths and all command mappings are retained.

Do not mistake transparent file corners for clean alpha: validate perimeter
matte colors against contrasting backgrounds. The renderer cleans dark edge
pixels before resizing and exporting animated WebPs.
