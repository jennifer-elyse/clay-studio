---
name: ui-tokens
description: Style screens with Clay tokens from client/src/tokens.css. Use when a change touches UI, color, layout, or focus.
---

# UI tokens

1. Use `var(--clay-*)` only. Do not type hex, a raw radius, or a new font in a component.
2. Keep each screen under 50 lines by composing smaller pieces.
3. Every status has a visible text label. Do not rely on color alone.
4. Use a real `<form>` and `<button>`. Focus uses the `--clay-plan` ring.
5. Show empty, invalid, and saving states on the screen.
