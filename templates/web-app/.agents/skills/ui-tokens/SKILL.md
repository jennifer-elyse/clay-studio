---
name: ui-tokens
description: Style screens with the 7-1 Sass sheet in client/src/styles. Use when a change touches UI, color, layout, or focus.
---

# UI tokens

1. Use `var(--clay-*)` only. Color, type, space, and radius come from `client/src/styles/abstracts/tokens.css`, loaded by `client/src/styles/main.scss`. Partials live in the 7-1 folders (`abstracts`, `vendors`, `base`, `layout`, `components`, `pages`, `themes`) and are forwarded from that folder's `_index.scss`. This sheet is the one the preview iframe loads. Do not type hex, a raw radius, or a new font in a component. Brand differences override tokens. Numbers use `font-variant-numeric: tabular-nums`. A table column and its header use the same alignment. Strings align left. Numbers align right. Actions (buttons) align center.
2. Lay out with intrinsic sizing and `@container` queries. Do not use viewport breakpoint media queries for layout. The only media query is `@media (prefers-reduced-motion: reduce)`. It may reduce or remove motion only, and must not change layout, color, or input-capacity.
3. Keep each screen under 50 lines by composing smaller pieces.
4. Every status has a visible text label. Do not rely on color alone.
5. Use a real `<form>` and `<button>`. The form submits through its `action`. `useActionState` from `react` holds a submit result and pending state. Focus uses `--focus-ring` (`0 0 0 3px rgb(0 102 204 / 28%)`), visible and not color-only against the default surface. Every control works from the keyboard.
6. Hover is a warm-gray surface change and slight elevation, and only on an actionable element. A disabled control says why it cannot be used when the reason is not obvious. Unavailable fulfillment modes stay visible unless a business rule requires hiding them.
7. Show empty, invalid, and saving states on the screen.
8. A changed component has a Storybook story for its states, built against the tokens. A Figma component with code uses Code Connect so design and React share a name. Until those tools are in the app, every state is visible on the running screen.
