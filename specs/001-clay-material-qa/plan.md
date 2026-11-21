# Implementation Plan: Clay Material and Animation Visual QA

**Status:** Proposed; not implemented by this Spec Kit adoption PR.

## Baseline architecture and reuse
- **UI:** React 19, `packages/chat-sdk/src/ThemeSection.jsx`, `ClayBot.jsx`, and `ClayCanvas.jsx`.
- **Material composition:** `packages/chat-sdk/src/clay-color.js` applies the chosen pigment to the registered diffuse/body-mask, light, and specular panels while retaining the original illustration alpha and facial details.
- **Artwork:** `apps/studio/public/assets/animations/blue/` contains the original command/ambient WebPs and `material/` contains four-panel 640×640 registered animated atlases.
- **Generation and validation:** `scripts/generate-clay-materials.py`, `scripts/check-clay-materials.py`, and `scripts/check-blue-alpha.py`.
- **Existing clip contract:** `packages/chat-sdk/src/animations.js` maps 20 commands and seven ambient clips.
- **Release:** `.github/workflows/publish-main-zip.yml` creates the validated Mac/Windows ZIP from protected `main`.

## Technical approach for the next bounded change
1. Add a reproducible visual QA harness that opens/decodes existing WebP frames and composes the same material math used by the browser. Prefer reusing `composeClayMaterial` over writing a second tint algorithm.
2. Sample `blink`, `clear`, `help`, `idle`, `new`, `image`, and `pop-shape` for key frames; audit all 27 clips for registration, alpha, and timing.
3. Produce a deterministic image grid for default blue, turquoise, lavender, cherry magenta, `#E8F5FF`, and `#F5CC65` on five contrasting backgrounds. Use a lightweight browser runner (e.g., Playwright already present) and project-local images.
4. Test reduced-motion stills independently, and confirm custom color persistence and facial color protection.
5. Keep manual review as an explicit quality gate for texture, unnatural dark crowns, matte rings, and morph readability. Automated checks cannot certify aesthetic quality alone.
6. Integrate visual QA into CI without blocking purely documentation-only changes on slow asset generation. Attach contact sheets as workflow artifacts rather than committing ephemeral screenshots.

## Constraints and risks
- **Browser animation timing:** Animated WebP playback may be nondeterministic under frame capture. Freeze at keyframes or use an explicit decoder to stabilize tests.
- **Baked source matte:** Some shadows may be present within the approved source artwork. Mask and visual checks must distinguish real clay relief from detached dark geometry.
- **Morph color safety:** White unicorn and pastel mane must not be overpainted.
- **Large binaries:** Avoid unnecessary regeneration and repeated binary commits during ZIP publication.
- **Cross-platform:** Preserve existing bash/PowerShell launchers, stored settings, and application endpoints.

## Test strategy
`npm ci`, `npm ci --prefix templates/web-app`, `npm test`, `npm run build`, `python3 scripts/check-clay-materials.py`, `python3 scripts/check-blue-alpha.py`, followed by the new visual QA harness (once implemented).

## Delivery boundary
This plan is scoped to *visual quality regression assurance*, not a replacement of material maps or the pre-existing Clay application.