# Design

One visual system. Tokens live in `client/src/tokens.css`. Components use `var(--clay-*)`. A hex, a raw pixel radius, or a one-off font in a component is a bug.

| Token | Role |
| --- | --- |
| `--clay-sand` | Page background |
| `--clay-surface` | Cards and forms |
| `--clay-ink` | Primary text |
| `--clay-muted` | Secondary text |
| `--clay-blob` | Primary action |
| `--clay-plan` | Plan-like and focus treatment |
| `--clay-run` | Approved / success action |
| `--clay-stroke` | Hairline border |
| `--clay-radius` | Card radius |
| `--clay-font` | Helvetica Neue, Calibri, sans-serif |

Brand differences override tokens. They do not create a second stylesheet.

## States

A request moves `draft` → `submitted` → `approved` or `rejected` → `closed`. Each state has a visible text label. Color may reinforce the label. Color is not the only signal.

Empty, invalid, and saving states are visible too. A control that can fail tells the person what to fix, using the API `message` when the error came from the server.

## Composition

A screen is a small composition of shared pieces, under 50 lines. One component does one job. When Storybook is in the app, each changed component has a story for its states, built against these tokens. Until then, every state is visible in the running screen.

When a Figma file exists, color, type, space, and radius are imported into the token file, and a Figma component with code uses Code Connect so design and React share a name.

## Accessibility

The page uses semantic HTML. A form is a `<form>`. Actions are `<button>` elements. Links go somewhere.

Keyboard: every control is reachable, has a visible focus ring (`--clay-plan`, 3px), and can be used without a pointer. Approve and reject are buttons, not clickable rows.

Text meets the ink-on-sand contrast of the tokens. Status text is readable without the color chip.
