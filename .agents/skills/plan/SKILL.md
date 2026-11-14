---
name: plan
description: Write a Clay 1.0 /plan spec of record under docs/plans before any implementation. Use when the person asks to plan, spec, or design a change.
---

# Plan

Studio uses the same planning rule as a generated app.

1. Read `docs/vision.md`, `docs/erd.md`, and the rules in `templates/web-app/docs/code.md`. Read `docs/design.md` when the change has a screen. The ERD is the real model. Start from it.
2. Cursor uses Claude to write the plan. Write `docs/plans/NNN-name/plan.md` with YAML `status: draft` and `title`.
3. The plan states the outcome, the contract or route change, the status transitions, the data change, the docs that move with it, and which definition-of-done lines this slice will meet. A new API or a breaking contract change includes a contract review before implementation.
4. Exploration can discover a solution. The approved plan is the spec that governs what ships, and it ships with the change.
5. Do not change files outside `docs/plans/`.
6. Stop and wait for a person to approve. Nothing is implemented until then. After approval, Grok 4.7 High writes the implementation. A mergeable change was approved by someone other than the author.
