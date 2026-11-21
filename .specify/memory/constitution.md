# Clay Studio Constitution

**Version:** 1.0.0  
**Ratified:** 2026-11-20  
**Scope:** Clay Studio monorepo (`apps/studio`, `packages/chat-sdk`, `packages/agent-host`, `templates/web-app`).

## I. Preserve working behavior and compatibility
Existing application behavior is the baseline, not disposable scaffolding. Preserve the public `classic` and `blue` theme identifiers, existing slash-command-to-WebP mappings, local persistence keys, saved configurations, platform launchers, and the user-approved Clay artwork and unicorn animation unless a feature spec explicitly calls for a reviewed change.

## II. Keep material registration and visual identity intact
Clay body color is independent of eyes, eyelids, mouth, tongue, and finished unicorn material. Diffuse/reference, light, specular, and body-mask data for each animation frame must share dimensions, coordinate registration, frame index, and timing. The canonical image alpha is not replaced with background-colored pixels. Validate on light, dark, and highly contrasting surfaces; protect against dark matte rings and detached shadow artifacts.

## III. Prefer locally owned, reproducible assets
Source artwork, generated WebPs, material manifests, and generation/verification scripts remain project-local. Document the origin and derivation of imagery. Generated materials are estimates from illustrations, not measured physically based rendering textures. A production/release build must not silently substitute remote hosted images or rebuild from unrelated artwork.

## IV. Gate changes with tests and review
Maintain the existing npm test and build commands, animation coverage, material map validation, and accessible reduced-motion behavior. Distinguish automated passes from manual visual acceptance. Use a dedicated branch and pull request for changes to protected `main`; never bypass its rules. The release ZIP must correspond to a traceable commit and validated assets.

## V. Work with the existing architecture
Adapt React 19 and Canvas composition, Node/Express hosting, and the existing npm workspaces. Keep the Mac/Windows first-run launcher behavior. New specifications describe bounded changes; do not regenerate or rewrite the entire established application to satisfy a template.

## Governance
Review proposed changes against these principles before implementation. A future change to a principle should update this document, explain compatibility and migration impact, and receive normal pull-request review. Specs, plans, and task lists should cite their actual code and validation commands. An unchecked task is not evidence that work has been completed.

**Adoption source:** [GitHub Spec Kit — existing projects](https://github.github.com/spec-kit/how-to/existing-projects.html).