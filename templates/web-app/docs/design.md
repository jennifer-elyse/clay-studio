# Design

One visual system, in one design file. The design system feeds the UI tokens. Tokens live in `client/src/tokens.css`. Components use `var(--clay-*)`. Color, type, space, and radius are imported. A hex, a raw pixel radius, or a one-off font typed into a component is a bug.

| Token | Role |
| --- | --- |
| `--clay-sand` | Page background |
| `--clay-surface` | Cards and forms |
| `--clay-ink` | Primary text |
| `--clay-muted` | Secondary text |
| `--clay-blob` | Primary action |
| `--clay-plan` | Plan-like treatment |
| `--focus-ring` | Keyboard focus ring |
| `--clay-run` | Approved / success action |
| `--clay-stroke` | Hairline border |
| `--clay-radius` | Card radius |
| `--clay-font` | Helvetica Neue, Calibri, sans-serif |

Brand differences override tokens. They do not create a second stylesheet.

## Type

Numbers always use tabular figures: `font-variant-numeric: tabular-nums`. Counts, prices, times, and ids stay aligned.

## Layout

Layout is intrinsic. A component sizes from its content and adapts with container queries (`@container`). Viewport breakpoint media queries are not used for layout.

The sole media-query exception is `@media (prefers-reduced-motion: reduce)`, for accessibility. It may reduce or remove motion only. It must not be used for layout, color, or input-capacity.

## Hover

Hover is subtle. Use a warm-gray surface change and slight elevation only when the element is actionable.

## Focus

Every keyboard-focusable element has a visible focus ring. The ring is not color-only against the default surface.

Recommended token:

```css
:root {
  --focus-ring: 0 0 0 3px rgb(0 102 204 / 28%);
}
```

## Disabled

A disabled control shows why it cannot be used when the reason is not obvious. Unavailable fulfillment modes stay visible unless hiding them is required by a business rule.

## States

A request moves `draft` → `submitted` → `approved` or `rejected` → `closed`. Each state has a visible text label. Color may reinforce the label. Color is not the only signal.

Empty, invalid, and saving states are visible too. A control that can fail tells the person what to fix, using the API `message` when the error came from the server.

## Composition

A screen is a small composition of shared pieces, under 50 lines. One component does one job.

The standard is Storybook: each component is reviewed on its own, in every state, against these tokens. A Figma component with code uses Code Connect, so design and React share a name. Until Storybook or Figma is in the app, every state is still visible on the running screen, and tokens still come only from the token file.

## Accessibility

The page uses semantic HTML. A form is a `<form>`. Actions are `<button>` elements. Links go somewhere.

Keyboard: every control is reachable, has a visible `--focus-ring`, and can be used without a pointer. Approve and reject are buttons, not clickable rows.

Text meets the ink-on-sand contrast of the tokens. Status text is readable without the color chip.
