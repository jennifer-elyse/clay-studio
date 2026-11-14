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

Chat column (min 440px) left. Live preview right. Header: **clay-bot stage** (96px), wordmark, then the project name, Seats, and the seat badge. Hovering the project name shows its directory. A select’s down chevron is inset from the right edge, with a little padding so the label does not crowd it. A chevron-down at the header’s top-right collapses that image panel to a bar with the project name and a chevron-up. The chevron-up opens the panel again. Chat and preview stay in place. Empty state repeats a larger 148px stage. Clear and Reset sit above the chat, aligned to the right: Clear is the yellow button, Reset is the red button. Plan and Fix each include a brain. Clicking the brain runs `/think` with the same words before that command. Clicking the label, or typing the command, does not. A ? button opens a popover with Help, Docs, and Settings. `/code` opens the project in the Cursor IDE and leaves the prompt there to review. The other commands stay as color-coded pills. A down chevron at the end of that first row hides the slash commands; a chevron-up brings them back. Restricted-data reminder under the composer. Commands that need extra words fill the composer; the others send immediately.

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
- Preview ready: a sandboxed iframe on 127.0.0.1, with an open icon just to the left of the URL. That icon opens the app in the default browser. The frame cannot navigate Clay or load the studio origin. A crash, a security block, or a process log stays in the preview pane. `/debug` reveals the process log
- Seats: the header Seats button, the seat badge, and `/seats` open a modal. It asks which product — Cursor, Codex, or Copilot — then lists the connection that product needs. The badge shows the current one. Keys stay on the machine.

## Accessibility

Semantic landmarks (`banner`, `main`, `complementary`). Pills are buttons. The `--focus-ring` is always visible and is not color-only against the default surface. Keyboard: `/` opens command list, Enter sends, Esc cancels a run.

One design system feeds these tokens. Color, type, space, and radius are not typed into a component. A changed component has a Storybook story for its states. A Figma component with code uses Code Connect so design and React share a name. Status is a text label, not color alone.
