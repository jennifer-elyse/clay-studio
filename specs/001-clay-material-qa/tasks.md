# Tasks: Clay Material and Animation Visual QA

**Status:** Proposed; no implementation tasks checked off by this adoption PR.

## Phase 1 — Inventory and fixtures
- [ ] T001 Verify all 20 slash command + seven ambient animation filenames and material atlas registration against `animations.js` and `material/manifest.json`.
- [ ] T002 Identify reproducible keyframe samples for blink, clear, help, idle, new, image, and pop-shape; record source frame numbers.
- [ ] T003 Define deterministic background and color matrix for visual comparisons.

## Phase 2 — Capture and checks
- [ ] T004 Build visual QA harness that reuses actual Canvas material composition rather than duplicating recoloring math.
- [ ] T005 Generate transparent and five-background visual contact sheets across presets and light custom pigments.
- [ ] T006 Add regression assertions for registered source/mask/light/specular alpha, frame timing, and intact eye/mouth/unicorn regions.
- [ ] T007 Add reduced-motion and color persistence regression checks.

## Phase 3 — Review and release
- [ ] T008 Review the high-priority clips and all morph frames; document any dark rim/crown failures and repair their source masks separately.
- [ ] T009 Link visual artifacts from a CI workflow and require reviewer sign-off for affected artwork.
- [ ] T010 Run existing test/build/alpha checks and compare download ZIP contents before a release.
- [ ] T011 Update `spec.md` and `plan.md` with verified decisions; mark tasks complete only after corresponding changes land.

## Existing safeguards (not implementation tasks)
- Alpha/registration and specular validator: `scripts/check-clay-materials.py`.
- Color composition tests: `packages/chat-sdk/tests/clay-color.test.js`.
- ZIP build and publication: `.github/workflows/publish-main-zip.yml`.
