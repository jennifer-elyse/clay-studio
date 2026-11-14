# Clay Studio

Local host that helps non-coders mold internal apps with their Cursor or Copilot seat.

## Commands

- `npm install`
- `npm run dev` — Vite UI on 5173, host API on 8787
- Double-click `Clay Studio.command` or `Clay Studio.bat` to install and open the built app on 8787
- `npm test` — Jest unit tests
- `npm run test:e2e` — Playwright Plan → Approve → Build → Run
- `npm run storybook` — chat SDK states

## Hard rules

Studio follows the same rules a generated app enforces. The constitution is `templates/web-app/docs/code.md`. The design rules are `docs/design.md`, the same constraints as `templates/web-app/docs/design.md`.

- JavaScript with JSDoc. No in-code TypeScript syntax. Zod at every boundary (WebSocket, HTTP, adapter events). Change the contract before the handler.
- Nouns in URLs, verbs in methods. Every write sends `Idempotency-Key`. Errors are `{ code, message, requestId }`. Status changes are declared transitions.
- Pure functions. Do not mutate shared data. Compare with `===`. Components stay under 50 lines.
- Tokens only. Studio tokens live in `packages/chat-sdk/src/tokens.css`. Generated apps use `client/src/tokens.css`. Numbers use tabular figures. Layout is intrinsic, with container queries. A viewport breakpoint media query is not used for layout. The only media query is `prefers-reduced-motion`, and it may only reduce or remove motion. Hover is a warm-gray surface change and slight elevation, only on an actionable element. Focus uses `--focus-ring` and is not color-only. A disabled control says why when the reason is not obvious.
- User credentials stay in the host. The browser never sees API keys. No customer, payment, HR, or secret data in prompts, logs, or seed data.
- A project Clay builds is not done while npm audit reports a high or critical advisory that has a newer patched release. Upgrade to that release. Do not downgrade a package to clear an advisory.
- `/plan` is required before `/build`. Claude plans (Cursor); Grok 4.7 High codes (Cursor). Copilot still writes a plan file, then codes with Copilot models. Agents open pull requests. A person merges.
- One agent run at a time. Always `wait()`. Dispose on quit.

## Where to look

- Product intent: `docs/vision.md`
- Chat UI: `docs/design.md`
- Code and API rules: `docs/code.md`
- Data: `docs/erd.md`
- Approved specs: `docs/plans/`
- Chat primitives: `packages/chat-sdk`
- Agent seats and preview: `packages/agent-host`
- Generated app shape: `templates/web-app`
