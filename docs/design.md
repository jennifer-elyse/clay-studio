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

Two layouts, switched by a Chat | Preview toggle in the header (also on the collapsed bar). **Chat** is the default: the chat is centered, a fixed 960px wide on any monitor, and narrower only when the window is (message text stays within 75 characters), and no preview is shown. **Preview** is the split: chat column (min 440px) left, live preview right. The layout switches to Preview each time the app's preview becomes ready, even after a manual switch to Chat. It never switches back by itself. While you are in Chat and a preview is ready, a green dot marks the Preview option. The choice is not saved: every launch, and every project switch, starts in Chat. Header: **clay-bot stage** (96px), wordmark, then the project name, a Settings button, and the seat badge. Hovering the project name shows its directory. A select’s down chevron is inset from the right edge, with a little padding so the label does not crowd it. A chevron-down at the header’s top-right collapses that image panel to a bar with the project name and a chevron-up. The chevron-up opens the panel again. Chat and preview stay in place. Empty state repeats a larger 148px stage. Clear and Reset sit above the chat, aligned to the right: Clear is the yellow button, Reset is the red button. Plan and Fix each include a brain. Clicking the brain runs `/think` with the same words before that command. Clicking the label, or typing the command, does not. A ? button opens a popover with Help, Docs, and Settings. `/code` opens the project in the Cursor IDE and leaves the prompt there to review. `/upload` opens files on this computer and saves each one in the project's public folder for its type: images, docs, audio, video, or fonts. The chat lists each path, such as `/images/hero.svg` or `/docs/policy.pdf`. The other commands stay as color-coded pills. After /plan finishes and that plan is approved, Plan stays off for that project. After /build finishes, Build stays off for that project. Switching projects restores that project's buttons. A down chevron at the end of that first row hides the slash commands; a chevron-up brings them back. Restricted-data reminder under the composer. Each message you sent has Edit and Resend. Edit puts those words back in the composer. Send replaces that message and every reply after it. Resend does the same with the original words. Earlier messages stay on screen. The seat starts a fresh turn for that message, so it does not carry the earlier thread or the discarded reply. While a run is in flight, Send becomes Stop. Commands that need extra words fill the composer; the others send immediately.

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
- Streaming: a small “Working…” caption plus step chips, not raw tool JSON. `/build` says “Creating the application…” in that caption and in the preview until the run finishes.
- Finished: the caption changes to “Done”. It stays quiet. The plan card still asks for approval.
- Plan draft: PlanCard with Approve / Adjust
- Preview ready: a sandboxed iframe on 127.0.0.1, with an open icon just to the left of the URL. That icon opens the app in the default browser. The frame cannot navigate Clay or load the studio origin. A crash, a security block, or a process log stays in the preview pane. `/debug` reveals the process log
- Settings: the header Settings button, the seat badge, and `/seat` open one centered modal with two tabs. **Seat** asks which product — Cursor, Codex, or Copilot — then lists the connection that product needs. **Advanced options** (collapsed) under the choices holds two free-text model names: plan & build, and quick turns. A blank field shows the built-in name as its placeholder. Cursor and Copilot then ask that account for its model list and use the top listed model for the step. A typed name is sent as-is. Reset clears both names. On Cursor, one plan & build name runs both steps on that model, and blank uses the top Claude for plan, the top Grok for build, and the top Composer for quick turns. Changes apply to the next run. **Projects folder** browses to the folder that holds new projects; existing projects stay where they are. The badge shows the current seat and model, and opens Seat. Switching seat is disabled while Clay is working, and says so. Keys stay on the machine.

## Accessibility

Semantic landmarks (`banner`, `main`, `complementary`). Pills are buttons. The `--focus-ring` is always visible and is not color-only against the default surface. Keyboard: `/` opens command list, Enter sends, Esc stops a run, and Esc during an edit leaves the edit without sending.

One design system feeds these tokens. Color, type, space, and radius are not typed into a component. A changed component has a Storybook story for its states. A Figma component with code uses Code Connect so design and React share a name. Status is a text label, not color alone.
