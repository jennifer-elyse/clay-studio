# Code

Studio is a Clay app. Generated prototypes follow `templates/web-app/docs/code.md`, the Clay 1.0 constitution taken from the platform deck: immutability, idempotency, state machines, contract-first `/v1` APIs, catalog error codes, docs in the same change, and the definition of done.

## Stack

- React client, Express API, PostgreSQL (PGlite locally; Cloud SQL on promotion)
- JavaScript + JSDoc. Zod at HTTP, WebSocket, and adapter boundaries
- Pure domain functions. Side effects at the edge (DB, child processes, agent SDKs)
- Status changes are state-machine transitions
- Writes take `Idempotency-Key`. Noun URLs, verbs in methods
- One error shape: `{ code, message, requestId }`

## Studio-specific

- `@cswg/clay-chat` is presentational. It does not import Cursor or Copilot SDKs
- `@cswg/agent-host` owns `AgentPort`. Cursor and Copilot adapters map into `UiEvent`
- Preview binds `127.0.0.1` only
- Promotion to APIM / Cloud Run / canary is out of v1; keep the file layout so it can be added

## Tests

Jest for schemas, plan gate, event mapping, preview supervisor. Playwright for Plan → Approve → Build → Run. Storybook for pills and PlanCard.
