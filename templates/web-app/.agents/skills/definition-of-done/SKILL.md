---
name: definition-of-done
description: Check a Clay change against the definition of done before calling it ready. Use when reviewing, finishing a build, or deciding a slice is complete.
---

# Definition of done

Read the checklist at the end of `docs/code.md`. A slice is ready only when each line that applies is true.

1. The approved plan in `docs/plans/` matches what was built. No extra scope.
2. Contract first, Zod in and out, noun paths, one error shape, catalog codes.
3. Writes have `Idempotency-Key`. Status changes are legal transitions.
4. Tokens only. Keyboard, semantic HTML, visible focus, text labels for status.
5. Pure functions, no shared mutation, components under 50 lines, JSDoc on shared functions.
6. Jest covers the behavior. Docs and the ERD moved in the same change.
7. No secrets or restricted data in code, prompts, logs, or seed data.

Say which lines passed and which still fail. Do not call a failing line done.
