# Code

Studio is a Clay app. It applies every section of `templates/web-app/docs/code.md`. That file is the Clay 1.0 constitution from the platform deck, in full: seats and spend, what AI may see, spec-driven `/plan`, immutability, idempotency, state machines, contract-first `/v1` APIs, events, operations, docs with the code, proof, the definition of done, the pipeline gates, and the rollout. Generated prototypes use that same file. The short list below is the studio delta, not a second or smaller standard.

## Stack

- React client, Express API, PostgreSQL (PGlite locally; Cloud SQL on promotion)
- JavaScript + JSDoc. Zod at HTTP, WebSocket, and adapter boundaries
- Pure domain functions. Side effects at the edge (DB, child processes, agent SDKs)
- Status changes are state-machine transitions
- Writes take `Idempotency-Key`. Noun URLs, verbs in methods
- One error shape: `{ code, message, requestId }`

## Same rules as a generated app

Studio UI follows `docs/design.md` with the same constraints a generated app follows in `templates/web-app/docs/design.md`. Tokens come from `packages/chat-sdk/src/tokens.css`. Components stay under 50 lines. Functions stay pure. Compare with `===`.

## Studio-specific

- `@cswg/clay-chat` is presentational. It does not import Cursor or Copilot SDKs
- `@cswg/agent-host` owns `AgentPort`. Cursor and Copilot adapters map into `UiEvent`
- Preview binds `127.0.0.1` only
- Promotion to APIM / Cloud Run / canary is out of v1; keep the file layout so it can be added

## Tests

Jest for schemas, plan gate, event mapping, preview supervisor. Playwright for Plan → Approve → Build → Run. Storybook for pills and PlanCard.
