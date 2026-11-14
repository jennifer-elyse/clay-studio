# Design

## Tokens

Imported conceptually from the Clay 1.0 deck. Values live in `packages/chat-sdk/src/tokens.css`. Do not type hex in components.

| Token | Role |
| --- | --- |
| `--clay-sand` | Page background |
| `--clay-surface` | Cards, composer, preview chrome |
| `--clay-ink` | Primary text |
| `--clay-muted` | Secondary text |
| `--clay-blob` | Accent (clay-mascot coral) |
| `--clay-sun` / `--clay-pink` / `--clay-mint` / `--clay-sky` | Mascot palette |
| `--clay-plan` | Plan/spec actions |
| `--clay-run` | Preview/run actions |
| `--clay-bot-stage` | Reserved square for the animated clay bot |
| `--clay-stroke` | Hairline borders |
| `--clay-radius` | 16px cards, 999px pills |
| `--clay-focus` | Visible 3px focus ring |
| `--focus-ring` | Keyboard focus ring: `0 0 0 3px rgb(0 102 204 / 28%)` |

## Type

Numbers always use tabular figures: `font-variant-numeric: tabular-nums`. Counts, prices, times, and ids stay aligned.

## Layout

Layout is intrinsic. A component sizes from its content and adapts with container queries (`@container`). Viewport breakpoint media queries are not used for layout.

The sole media-query exception is `@media (prefers-reduced-motion: reduce)`, for accessibility. It may reduce or remove motion only. It must not be used for layout, color, or input-capacity.

Chat column (min 320px) left. Live preview right. Header: **clay-bot stage** (96px), wordmark, seat badge. Empty state repeats a larger 148px stage. Clear and Reset sit above the chat, aligned to the right: Clear is the yellow button, Reset is the red button. Plan and Fix each include a brain. Choosing the brain runs `/think` with the same words, then that command. A ? button opens a popover with Help, Docs, and Settings. The other commands stay as color-coded pills. Restricted-data reminder under the composer. Commands that need extra words fill the composer; the others send immediately.

The bot stage plays looping WebP clips from `apps/studio/public/assets/animations`. Slash commands that have a matching filename (`help`, `clear`, `search`, `think`, `summarize`, `write`, `code`, `image`, `settings`, and `new` for `/reset`) use that clip. Every other moment picks at random from idle, blink, rolling, pop-shape, interested, judging, and concerned.

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

- Empty: “What should we mold?” and a line that a plan comes first
- Streaming: a small “Working…” caption plus step chips, not raw tool JSON
- Finished: the caption changes to “Done”. It stays quiet. The plan card still asks for approval.
- Plan draft: PlanCard with Approve / Adjust
- Preview ready: iframe; `/debug` reveals the process log
- Seats: `/seats` (and the Seats pill) opens a modal. It asks which product — Cursor, Codex, or Copilot — then lists the connection that product needs. The badge shows the current one. Keys stay on the machine.

## Accessibility

Semantic landmarks (`banner`, `main`, `complementary`). Pills are buttons. The `--focus-ring` is always visible and is not color-only against the default surface. Keyboard: `/` opens command list, Enter sends, Esc cancels a run.

One design system feeds these tokens. Color, type, space, and radius are not typed into a component. A changed component has a Storybook story for its states. A Figma component with code uses Code Connect so design and React share a name. Status is a text label, not color alone.
