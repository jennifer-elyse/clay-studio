# Code

Studio is a Clay app. It applies every section of `templates/web-app/docs/code.md`. That file is the Clay 1.0 constitution from the platform deck, in full: seats and spend, what AI may see, spec-driven `/plan`, immutability, idempotency, state machines, contract-first `/v1` APIs, events, operations, docs with the code, proof, the definition of done, the pipeline gates, and the rollout. Generated prototypes use that same file. The short list below is the studio delta, not a second or smaller standard.

## Stack

- React 19.3.1 client (`react` and `react-dom` `^19.3.1`), Express API, PostgreSQL (PGlite locally; Cloud SQL on promotion). The production release is the npm `latest` tag. `node scripts/stack-versions.js` warns when React, Express, or another direct dependency is behind it. The React section of `templates/web-app/docs/code.md` is the practice: function components, `ref` as a prop, form `action`, `useActionState` when a submit has a result or pending state.
- JavaScript + JSDoc. Zod at HTTP, WebSocket, and adapter boundaries
- Pure domain functions. Side effects at the edge (DB, child processes, agent SDKs)
- Status changes are state-machine transitions
- Writes take `Idempotency-Key`. Noun URLs, verbs in methods
- One error shape: `{ code, message, requestId }`

## Same rules as a generated app

Studio UI follows `docs/design.md` with the same constraints a generated app follows in `templates/web-app/docs/design.md`. Tokens come from `packages/chat-sdk/src/tokens.css`. Components stay under 50 lines. Functions stay pure. Compare with `===`.

## Studio-specific

- `@cswg/clay-chat` is presentational. It does not import Cursor or Copilot SDKs
- `/upload` copies a file into the matching public folder: `client/public/images`, `client/public/docs`, `client/public/audio`, `client/public/video`, or `client/public/fonts`. The preview serves them at `/images/…`, `/docs/…`, `/audio/…`, `/video/…`, and `/fonts/…`.
- `@cswg/agent-host` owns `AgentPort`. One agent per project, disposed on a project or seat change. Cursor resumes it and summarizes around a plan or a build. Copilot and Codex drop a heavy thread instead of resending it. Cursor and Copilot read the account model list and run the first listed model for that step. Preview tools go only on build and fix. `/code` opens the project in the Cursor IDE and leaves the prompt there to review. The brain reasons inside that same turn. Clay may open at most 5 subtasks. Cursor cancels the run when a sixth subtask starts or a subtask starts an agent. A crash of the app or of Clay ends the turn: no follow-up model call, summary, or retry.
- Preview binds `127.0.0.1` only
- Promotion to APIM / Cloud Run / canary is out of v1; keep the file layout so it can be added

## Tests

Jest for schemas, plan gate, event mapping, preview supervisor. Playwright for Plan → Approve → Build → Run. Storybook for pills and PlanCard.
