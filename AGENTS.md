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
- React 19 (`react` and `react-dom` ^19.3.1), in Studio and in every project Clay creates. Function components. `ref` is a prop. A form submits through its `action`. `useActionState` from `react` holds a submit result and pending state. `eslint-plugin-react-hooks` recommended rules pass. The React section of `templates/web-app/docs/code.md` is the list.
- Direct production dependencies use the npm `latest` tag. `node scripts/stack-versions.js` warns when React, Express, or another one is behind that release, or when Vite is still serving an older React. Repeat that warning. Do not treat a version written in the docs as current when the script disagrees.
- Tokens only, in a Sass 7-1 sheet. Studio chrome loads `packages/chat-sdk/src/styles/main.scss`. The Studio page shell loads `apps/studio/src/styles/main.scss`. A generated app loads `client/src/styles/main.scss` in its own document, which is what the preview iframe shows. Numbers use tabular figures. A table column and its header use the same alignment: strings left, numbers right, actions (buttons) center. Layout is intrinsic, with container queries. A viewport breakpoint media query is not used for layout. The only media query is `prefers-reduced-motion`, and it may only reduce or remove motion. Hover is a warm-gray surface change and slight elevation, only on an actionable element. Focus uses `--focus-ring` and is not color-only. A disabled control says why when the reason is not obvious.
- User credentials stay in the host. The browser never sees API keys. No customer, payment, HR, or secret data in prompts, logs, or seed data.
- A project Clay builds is not done while npm audit reports a high or critical advisory that has a newer patched release. Upgrade to that release. Do not downgrade a package to clear an advisory.
- `/plan` is required before `/build`. Cursor and Copilot ask the account which models it can run, then use the top listed model for that step: Claude to plan, Grok to build, Composer for every other Cursor turn; the top listed work model for a Copilot plan or build, and the top listed cheap model otherwise. Codex has no catalog in its SDK, so it keeps its fuller model for the plan and the build and the smaller model for every other turn. Agents open pull requests. A person merges.
- One agent run at a time. Always `wait()`. Dispose on quit.
- Clay may open at most 5 subtasks. A subtask must not start an agent.
- If the app or Clay crashes, stop. Do not start another model call, summary, or retry.

## Where to look

- Product intent: `docs/vision.md`
- Chat UI: `docs/design.md`
- Code and API rules: `docs/code.md`
- Data: `docs/erd.md`
- Approved specs: `docs/clay-studio-plan/`
- Chat primitives: `packages/chat-sdk`
- Agent seats and preview: `packages/agent-host`
- Generated app shape: `templates/web-app`
