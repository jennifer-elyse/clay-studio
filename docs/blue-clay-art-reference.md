# Blue Gumby Clay reference artwork (branch `7-1`)

`apps/studio/public/assets/animations/blue/reference-atlas.webp` is cropped from the
user-supplied *Blue Gumby Clay Mascot Showcase* (19 Nov 2026). The original
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
