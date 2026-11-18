---
name: definition-of-done
description: Check a Clay Studio change against the same definition of done a generated app uses. Use when reviewing, finishing a build, or deciding a slice is complete.
---

# Definition of done

Read the checklist at the end of `templates/web-app/docs/code.md`, and `docs/design.md` for any UI line. Studio applies that checklist. A generated app reads its own `docs/code.md`, which is the same text. A line that names Cloud Run, APIM, tracing, or a canary applies once that system exists. Until then it is met by leaving the contract and the file layout.

1. An approved plan in `docs/{project-name}-plan/` matches what was built. Someone other than the author approved it. No extra scope.
2. Contract first, Zod in and out, noun paths, one error shape, catalog codes.
3. Writes have `Idempotency-Key`. Status changes are legal transitions. `schema.sql` can run again.
4. Tokens are imported. Components use them. A Figma component with code uses Code Connect.
5. A changed component has a Storybook story for its states. Jest covers the unit behavior. Playwright covers the user flow.
6. Docs changed in the same change, including a regenerated ERD when data moved. Shared functions have JSDoc.
7. Keyboard, semantic HTML, visible focus, text labels for status. Numbers are tabular. Layout uses container queries. Hover, focus, and disabled states match `docs/design.md`.
8. Pure functions, no shared mutation, components under 50 lines. React 19 function components: `ref` is a prop, a form submits through its `action`, `useActionState` holds a submit result and pending state, and the hooks recommended rules pass.
9. No secrets or restricted data in code, prompts, logs, or seed data. New packages are real, established, approved, and on the license allowlist. Open npm security issues are fixed: upgrade to a newer patched release, and do not downgrade a package to clear an advisory.

Say which lines passed and which still fail. Do not call a failing line done.
