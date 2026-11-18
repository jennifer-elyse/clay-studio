---
name: ui-tokens
description: Style Clay Studio with the same token, layout, hover, and focus rules a generated app enforces. Use when a change touches UI, color, layout, or focus.
---

# UI tokens

Studio uses the same rules as `templates/web-app/.agents/skills/ui-tokens/SKILL.md`.

1. Use `var(--clay-*)` only. Studio tokens live in `packages/chat-sdk/src/tokens.css`. A generated app uses `client/src/tokens.css`. Do not type hex, a raw radius, or a new font in a component. Numbers use `font-variant-numeric: tabular-nums`. A table column and its header use the same alignment. Strings align left. Numbers align right. Actions (buttons) align center.
2. Lay out with intrinsic sizing and `@container` queries. Do not use viewport breakpoint media queries for layout. The only media query is `@media (prefers-reduced-motion: reduce)`. It may reduce or remove motion only, and must not change layout, color, or input-capacity.
3. Keep each screen under 50 lines by composing smaller pieces.
4. Every status has a visible text label. Do not rely on color alone.
5. Use a real `<form>` and `<button>`. The form submits through its `action`. `useActionState` from `react` holds a submit result and pending state. Focus uses `--focus-ring` (`0 0 0 3px rgb(0 102 204 / 28%)`), visible and not color-only against the default surface. Every control works from the keyboard.
6. Hover is a warm-gray surface change and slight elevation, and only on an actionable element. A disabled control says why it cannot be used when the reason is not obvious. Unavailable fulfillment modes stay visible unless a business rule requires hiding them.
7. Show empty, invalid, and saving states on the screen.
8. A changed component has a Storybook story for its states, built against the tokens. A Figma component with code uses Code Connect so design and React share a name.
