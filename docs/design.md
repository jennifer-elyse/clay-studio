# Design

## Tokens

Imported conceptually from the Clay 1.0 deck. Values live in `packages/chat-sdk/src/styles/abstracts/_tokens.scss`. Do not type hex in components.

## Styles

Studio and a generated app each use the Sass 7-1 pattern: seven folders and one entry file, `main.scss`.

| Folder | What belongs there |
| --- | --- |
| `abstracts` | Tokens, functions, mixins, placeholders |
| `vendors` | Third-party stylesheets |
| `base` | Reset, typography, document defaults |
| `layout` | Shell, header, columns, preview frame |
| `components` | One partial per component |
| `pages` | Rules that belong to one screen |
| `themes` | A brand's token overrides |

A new partial is forwarded from that folder's `_index.scss`. The entry file stays `main.scss`. Vendors load first so a CSS `@import` stays above other rules. Reduced motion loads last.

| Sheet | Document it styles |
| --- | --- |
| `packages/chat-sdk/src/styles/main.scss` | Studio chrome, including the preview frame |
| `apps/studio/src/styles/main.scss` | The Studio page shell (`html`, `body`, `#root`) |
| `client/src/styles/main.scss` in a generated app | That app's own document |

The live preview is an iframe. Its document loads the generated app's `main.scss`. Studio's sheets paint the Studio page and the frame around that app. Tokens for Studio are CSS custom properties. A generated app keeps its own token list in `client/src/styles/abstracts/tokens.css`.

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

A table column and its header use the same alignment. Strings align left. Numbers align right. Actions (buttons) align center.

## Layout

Layout is intrinsic. A component sizes from its content and adapts with container queries (`@container`). Viewport breakpoint media queries are not used for layout.

The sole media-query exception is `@media (prefers-reduced-motion: reduce)`, for accessibility. It may reduce or remove motion only. It must not be used for layout, color, or input-capacity.

Two layouts, switched by a Chat | Preview toggle in the header (also on the collapsed bar). **Preview** is the default: chat column (min 440px) left, live preview right. **Chat** centers the chat, a fixed 960px wide on any monitor, and narrower only when the window is (message text stays within 75 characters), and hides the preview. The preview is hidden, not closed, so switching back shows the app as you left it. The layout switches to Preview each time Run starts the app, the preview becomes ready, or it fails to start, and each time `/debug` turns on the process log, even after a manual switch to Chat. It never switches back by itself. While you are in Chat and a preview is ready, a green dot marks the Preview option. The choice is not saved: every launch, and every project switch, starts in Preview. Header: **clay-bot stage** (96px), wordmark, then the project name, a Settings button, and the seat badge. Hovering the project name shows its directory. A select’s down chevron is inset from the right edge, with a little padding so the label does not crowd it. A chevron-down at the header’s top-right collapses that image panel to a bar with the project name and a chevron-up. The chevron-up opens the panel again. Chat and preview stay in place. Empty state repeats a larger 148px stage. Clear and Reset sit above the chat, aligned to the right: Clear is the yellow button, Reset is the red button. Each Spec Kit command includes a brain. Clicking the brain puts `/think` in that same command, for example `/speckit.plan /think intake form`. Clicking the label, or typing the command, does not. A ? button opens a popover with Help and Seats. `/upload` opens files on this computer and saves each one in the project's public folder for its type: images, docs, audio, video, or fonts. The chat lists each path, such as `/images/hero.svg` or `/docs/policy.pdf`. The other commands stay as color-coded pills. Plan and Implement stay available after they finish, so `/speckit.analyze` can return to the plan and `/speckit.converge` can run `/speckit.implement` again. Switching projects keeps each project's own spec, plan, and tasks. A down chevron at the end of that first row hides the slash commands; a chevron-up brings them back. Restricted-data reminder under the composer. Each message you sent has Edit and Resend. Edit puts those words back in the composer. Send replaces that message and every reply after it. Resend does the same with the original words. Earlier messages stay on screen. The seat starts a fresh turn for that message, so it does not carry the earlier thread or the discarded reply. While a run is in flight, Send becomes Stop. Commands that need extra words fill the composer; the others send immediately.

The bot stage plays looping WebP clips from `apps/studio/public/assets/animations`. All 20 registered slash commands (30 spellings, including `/seat` and each `/speckit-*` alias) have a corresponding, validated animated WebP in the default Purple Clay asset directory. The complete mapping is in `apps/studio/public/assets/animations/clay-chatbot/manifest.json`, and `commands-preview.html` displays it directly. Some commands intentionally reuse motion frames but have their own command-specific asset filenames. The Spec Kit filenames constitution, clarify, checklist, tasks, analyze, and converge keep the latest material maps already on main: constitution uses docs, clarify and analyze use search, checklist uses write, tasks uses code, and converge uses fix. This is checked with RIFF/ANIM/ANMF frame validation in the chat-sdk test suite. Covered commands include `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.implement`, `/speckit.converge`, `/upload`, `/seats` (also `/seat`), `/run`, and `/debug`. Non-command turns use random ambient WebP loops. The Settings → Theme tab offers Purple Clay (the default, stored internally as `classic` for compatibility) and opt-in Blue Clay. The blue theme uses generated animated WebPs of a textured blue sphere from `assets/animations/blue`, with `image.webp` playing an animated WebP that morphs the blue sphere into a white unicorn with a multicolored spiral horn. The choice is saved locally in the browser. Both themes have command and ambient WebPs; tests fail when a command clip is missing or not an animated WebP. Blue Clay now renders as a single SVG clay rig with shaded material, raised sculpted eyelids, inset sockets, glossy pupils, integrated blinks, and coordinated body/eye animation (see BlueClayFigure). This replaces the glitchy CSS eye overlay and eliminates resampling of the old 100px blue clips at runtime. All 20 command-specific animated WebPs and seven ambient WebPs remain in the repository for compatibility and coverage tests; the SVG rig now drives the visible blue animations. Its white-unicorn transformation has a multicolored spiral horn and is rendered at the same resolution-independent scale. Theme selection propagates through the header, empty state, and preview loader, with a persisted local preference. No production deployment or main-branch changes occur when developing on `feat-theme`.

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
- Streaming: a small “Working…” caption plus step chips, not raw tool JSON. `/speckit.implement` says “Creating the application…” in that caption and in the preview until the run finishes.
- Finished: the caption changes to “Done”. It stays quiet. The plan card still asks for approval.
- Plan draft: PlanCard with Approve / Adjust
- Preview starting: from the moment Run starts the app until its first page has loaded, the preview shows the bot's rolling clip, a green progress bar that slides back and forth, and “Starting your app…”, then “Opening your app…” once the frame is loading. Screen readers hear it as a status. With reduced motion the bar holds still.
- Preview ready: a sandboxed iframe on 127.0.0.1, with an open icon just to the left of the URL. That icon opens the app in the default browser. The frame cannot navigate Clay or load the studio origin. A crash, a security block, or a process log stays in the preview pane. `/debug` reveals the process log
- Settings: the header Settings button, the seat badge, and `/seat` open one centered modal with three tabs. **Seat** asks which product — Cursor, Codex, or Copilot — then lists the connection that product needs. **Theme** offers Purple Clay (default, stored as `classic`) and Blue Clay. The choice is saved in this browser and applies to the page colors and the clay bot. Each option says Selected or Available. **Advanced options** (collapsed) under the choices holds two free-text model names: plan & build, and quick turns. A blank field shows the built-in name as its placeholder. Cursor and Copilot then ask that account for its model list and use the top listed model for the step. A typed name is sent as-is. Reset clears both names. On Cursor, one plan & build name runs both steps on that model, and blank uses the top Claude for plan, the top Grok for build, and the top Composer for quick turns. Changes apply to the next run. **Projects folder** browses to the folder that holds new projects; existing projects stay where they are. The badge shows the current seat and model, and opens Seat. Switching seat is disabled while Clay is working, and says so. Keys stay on the machine.

## Accessibility

Semantic landmarks (`banner`, `main`, `complementary`). Pills are buttons. The `--focus-ring` is always visible and is not color-only against the default surface. Keyboard: `/` opens command list, Enter sends, Esc stops a run, and Esc during an edit leaves the edit without sending.

One design system feeds these tokens. Color, type, space, and radius are not typed into a component. A changed component has a Storybook story for its states. A Figma component with code uses Code Connect so design and React share a name. Status is a text label, not color alone.

### Blue Clay animation assets and publishing

The **Blue Clay** visible runtime uses real 320x320 animated WebPs in
`apps/studio/public/assets/animations/blue/`, including every slash command,
all ambient clips, and the blue-ball to white-unicorn morph. The animated image
frames are captured directly from the shared `BlueClayFigure` SVG scene to
avoid eye/body drift. The source of truth is the rig and the generator; no manual
per-file sprite patching. Each clip contains 16 frames at 200ms per frame.

To regenerate: install dependencies, start Vite from `apps/studio`, install
Python Pillow, run `node scripts/render-blue-webps.mjs`, then run
`npm run test -w @cswg/clay-chat`. The
`.github/workflows/blue-clay-assets.yml` workflow performs those steps on
`feat-theme` and commits updated **WebP image binaries**, not just source
code. A CSS reduced-motion fallback uses a static SVG pose instead of playing
an animated WebP.


### Illustration source-of-truth (Blue Clay)

**The two original, AI-rendered Clay Studio illustrations—not the earlier CSS/SVG reconstruction—are committed as `source-ball.webp` and `source-unicorn.webp`.** Runtime Blue Clay uses animated WebPs generated from those source assets, including real 320×320 alpha-transparent frames for 20 commands and seven ambient states. `python3 scripts/render-blue-from-art.py` is the reproducible Pillow generator. The workflow `.github/workflows/blue-clay-assets.yml` regenerates and verifies all 27 clips and publishes the image binaries to `feat-theme`. Reduced-motion visuals also use the corresponding original illustration. The legacy SVG rig remains available in source history but is not used by the Blue Clay UI.


### Blue Clay animation repair on `7-1`

The `7-1` branch contains the original generated blue clay and unicorn source illustrations and all 27 command/ambient animated WebP image binaries. The Pillow renderer samples 32 frames over 3.2 seconds (100ms per frame, 10fps). It eases the sculpted eyelids through intermediate states instead of snapping shut in one frame. The unicorn uses a pop-and-reveal rather than overlapping translucent characters. Losslessly optimized animations may coalesce repeated hold-pose frames while preserving their durations. Browser URLs use a revision parameter to invalidate cached 100px clips. The mascot uses the Sass 7-1 `styles/main.scss` entry point, not the removed `ClayBot.css`. The CI workflow commits regenerated assets to `7-1`, without modifying `main` or `feat-theme`.
