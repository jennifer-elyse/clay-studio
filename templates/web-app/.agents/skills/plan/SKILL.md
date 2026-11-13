---
name: plan
description: Write a Clay 1.0 /plan spec of record under docs/plans before any implementation. Use when the person asks to plan, spec, or design a change.
---

# Plan

1. Read `docs/vision.md`, `docs/erd.md`, and the rules in `docs/code.md`. Read `docs/design.md` when the change has a screen.
2. Write `docs/plans/NNN-name/plan.md` with YAML `status: draft` and `title`.
3. The plan states the outcome, the contract or route change, the status transitions, the data change, the docs that move with it, and which definition-of-done lines this slice will meet.
4. Do not change files outside `docs/plans/`.
5. Stop and wait for a person to approve. Nothing is implemented until then.
