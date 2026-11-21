# Feature Specification: Clay Material and Animation Visual QA

**Feature:** 001-clay-material-qa  
**State:** Proposed quality improvement — documentation only; no claim of completed implementation  
**Adoption date:** 2026-11-20  
**Baseline:** Clay Studio's existing material-map compositor on `main`.

## Context
The Clay color picker previously left nearly black source-blue shadows unchanged, creating a dark rim or "afro" effect in some animations. The current implementation uses registered diffuse, light, specular, and body-mask panels, and existing automated validation. This feature adds repeatable *visual regression evidence* for the remaining risk, without re-authoring the mascot.

## User scenarios and acceptance criteria

### Story 1 — Reliable color changes (P1)
As a user, I can choose Blue, Turquoise, Lavender, Cherry Magenta, or a custom color and see a coherent sculpted Clay body throughout all animations.

- **FR-001:** Recolored shadowed body regions must use the selected pigment while retaining reasonable material shading and surface detail.
- **FR-002:** Eyes, pupils, eyelids that belong to facial artwork, mouth, tongue, and completed white unicorn remain visually separate and correctly colored.
- **FR-003:** The color choice remains persistent and independent of the existing theme setting.
- **SC-001:** A review artifact shows representative clips at each preset and light custom colors (e.g., `#E8F5FF` and `#F5CC65`) on both white and dark backgrounds, with no detached dark crown or visible circular matte.

### Story 2 — No animation-specific halos (P1)
As a user, I do not see a dark circle, detached shadow, or background plate during blink, clear, help, idle, new, or the other mapped clips.

- **FR-004:** Every registered command and ambient animation has corresponding registered material information.
- **FR-005:** Any visual review sample includes white, black, hot pink, lime green, and transparent checkerboard backgrounds.
- **SC-002:** All 27 animation paths are available and source assets remain transparent; automated map registration and alpha checks pass.
- **SC-003:** The five high-priority clips are sampled across first, middle, and blink/transition key frames; discrepancies are recorded as explicit defects rather than hidden by averages.

### Story 3 — Stable unicorn transformation (P2)
As a user, the blue-clay-to-unicorn sequence remains continuous and the completed unicorn keeps its original colors.

- **FR-006:** Preserve the authored 12-frame transformation and its command mappings (`image.webp` and `pop-shape.webp`).
- **FR-007:** Only blue clay body material may receive a user-selected tint during intermediate frames.
- **SC-004:** A visual sequence includes every authored morph frame in blue and at least one custom Clay color, with no abrupt black borders or tinted white unicorn.

### Story 4 — Accessibility and offline reliability (P2)
As a user, reduced-motion display uses an appropriate still with the same selected Clay color, and assets work without remote image hosting.

- **FR-008:** Reduced-motion fallback preserves selected color and avoids animated media.
- **FR-009:** All animation and map assets load from project-local paths.
- **SC-005:** The application builds and package tests pass without changing endpoint contracts or clip names.

## Exclusions
No redesign of Clay's identity, no replacement of the approved source atlas, no reauthoring of slash commands, no new 3D engine, and no modification of the current \"classic\" theme.

## Evidence and verification
The existing tests validate numerical alpha, frame registration, and highlight bounds, but do not prove every animation is visually clean. The missing visual regression review harness is the main work proposed by this spec.

**Linked architecture:** `docs/clay-material-maps.md`, `packages/chat-sdk/src/ClayCanvas.jsx`, `packages/chat-sdk/src/clay-color.js`, `scripts/check-clay-materials.py`.