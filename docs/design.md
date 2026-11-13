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

## Layout

Chat column (min 320px) left. Live preview right. Header: **clay-bot stage** (96px), wordmark, seat badge. Empty state repeats a larger 148px stage. Pills are color-coded by command, including /help, /clear, /search, /think, /summarize, /write, /code, /image, and /settings. Restricted-data reminder under the composer. Commands that need extra words fill the composer; the others send immediately.

The bot stage plays looping WebP clips from `apps/studio/public/assets/animations`. Slash commands that have a matching filename (`help`, `clear`, `search`, `think`, `summarize`, `write`, `code`, `image`, `settings`, and `new` for `/reset`) use that clip. Every other moment picks at random from idle, blink, rolling, pop-shape, interested, judging, and concerned.

## States

- Empty: “What should we mold?” plus three starter prompts
- Streaming: a small “Working…” caption plus step chips, not raw tool JSON
- Finished: the caption changes to “Done”. It stays quiet. The plan card still asks for approval.
- Plan draft: PlanCard with Approve / Adjust
- Preview ready: iframe; `/debug` reveals the process log
- Copilot seat: persistent capability badge

## Accessibility

Semantic landmarks (`banner`, `main`, `complementary`). Pills are buttons. Focus ring always visible. Keyboard: `/` opens command list, Enter sends, Esc cancels a run.
