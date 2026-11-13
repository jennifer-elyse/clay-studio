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

- JavaScript with JSDoc. No in-code TypeScript syntax.
- Zod at every boundary (WebSocket, HTTP, adapter events).
- User credentials stay in the host. The browser never sees API keys.
- No customer, payment, HR, or secret data in prompts.
- `/plan` is required before `/build`. Claude plans (Cursor); Grok 4.7 High codes (Cursor). Copilot still writes a plan file, then codes with Copilot models.
- Generated apps apply Clay 1.0 from `templates/web-app/docs/code.md`: contract-first `/v1` APIs, catalog error codes, idempotent writes, state machines, tokens, and the definition of done.
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
