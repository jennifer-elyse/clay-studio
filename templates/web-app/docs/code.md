# Code

Clay 1.0 constitution for this app. Localhost now. The same shape promotes onto Cloud Run behind APIM later. Do not invent a second stack.

## Stack

- Browser: React. One design system. Brand differences are token overrides in `client/src/tokens.css`.
- API: Express. The client asks for what a screen needs. Independent reads run together with `Promise.all`. Writes are deliberate and idempotent.
- Data: PostgreSQL, PGlite on localhost, Cloud SQL or AlloyDB when promoted. `server/schema.sql` can run again safely.
- Language: JavaScript with JSDoc. This starter is that one standard. Do not add TypeScript syntax in source.
- This capability is Tier 3 (internal) until `README.md` says otherwise: 99.5% availability target, 24h RTO, 24h RPO, nightly backup, restore tested yearly. A backup that has never been restored is not a backup.

## Rules that lead

**Immutability.** Pure functions return the same result for the same input and do not change anything outside themselves. Shared data is copied forward. A local copy is the only place a value may change. Composition replaces classes.

**Idempotency.** The same operation again is safe. A retried request, a replayed message, or a schema script run a second time leaves one result. It does not insert a second row, apply a second change, or move a status twice.

**State machines.** A status changes only along a path declared in `server/status.js`. Code calls `transitionRequest`. It does not assign an arbitrary status. An illegal jump throws `ILLEGAL_TRANSITION`.

## What else the code requires

- Side effects stay at the edge: the database, the network, the log. Domain logic stays pure.
- Do not mutate shared arrays or objects. Copy them. `Map` is for dynamic keys. `Set` is for uniqueness.
- Steps that depend on each other use `await`. Independent work uses `Promise.all`. Callbacks are for events, not ordinary sequences.
- Compare with `===`. `parseInt` always names base 10.
- A function does one thing. A screen is a small composition of shared pieces, under 50 lines.
- Validate input. Grant the least permission. Secrets stay in the environment, never in git.
- Shared functions have JSDoc: what goes in, what comes back, and why the function exists.
- Jest locks the behavior. A user flow that matters is covered in the browser once Playwright is in the app.

## APIs

Nouns in the path. Verbs in the method. `GET /v1/requests`, `POST /v1/requests`, `PATCH /v1/requests/{id}`. `GET /getRequests` and `POST /createRequest` are rejected.

URI versioning, one version back. `/v1` and `/v2` name the same resource, differently. A client is not broken by a version it did not ask to leave. Additive changes stay in the version. A breaking change is a new major, and at most two majors run at once.

Status codes, used on purpose:

- 200, 201, 204 — success
- 400, 401, 403, 404, 409 — the client must change the request before sending it again
- 429 — wait for `Retry-After`, then retry
- 500, 503 — the server's fault; the same request may succeed on retry

Every error is `{ code, message, requestId }`. `code` comes from `ERROR_CODES` in `server/contracts.js`, maps to one HTTP status, and is never renamed or reused. `message` is safe to show. Stack traces never leave the service. Two endpoints with different error shapes are a bug.

Every write — POST, PUT, PATCH, and DELETE — requires `Idempotency-Key`. The service stores the key with its result. A retry returns the first response. A write without a key is 400.

Contract first. A new or changed route starts in `server/contracts.js`. Zod validates the inbound body and the outbound body through `respond()`. Do not delete or rename a required field, and do not narrow a type in place. A new required field has a default. When this API is shared with another capability, add the TypeSpec in the same change and update the consumer's contract copy in that change. Breaking diffs fail review.

`requestId` is on every error and belongs on structured JSON logs with severity. Logs never carry personal data or secrets.

Authorization stays in this service. A future APIM gateway may prove who is calling. This capability still decides what they may do. Cloud Run, when it exists, is not a public `run.app` bypass: ingress is the gateway only.

Outbound calls have a timeout shorter than the caller's. Retries use exponential backoff, jitter, and a cap, and a retried write reuses its `Idempotency-Key`. A 429 honors `Retry-After`. Long work does not stay on the request; it becomes a job or a message.

## Events

Commands go through the API. An event names a fact in the past tense (`request.approved`), not a command (`approve-request`). Add an event only when another capability must hear about a change. The schema is a Zod object with a version, written before the publisher. Publish from an outbox row in the same transaction as the change. Consumers dedupe on the event id. Ordering is per entity, not global. After repeated failures the message is dead-lettered, alerted, and replayed once the fix ships. No service reads another service's tables.

## Docs move with the change

Behavior, schema, or contract changes update `docs/vision.md`, `docs/design.md`, `docs/code.md`, `docs/erd.md`, or `docs/adr/` in the same change. `docs/erd.md` is the Mermaid picture of `server/schema.sql`. Refresh it when the schema changes. Do not hand-draw a second diagram. Migrations expand, then contract: add a column first, switch readers, remove the old column later, so a rollback can still read the schema.

## When this leaves localhost

Promotion adds, and does not replace, this layout:

- Express on Cloud Run behind APIM. APIM is the only front door: auth, rate limits, `/v1` and `/v2`.
- Private networking to Cloud SQL. Max instances times pool size stays under the connection limit.
- OpenTelemetry. `traceparent` flows from APIM into logs. One request is one trace.
- One signed image. Canary at 5%, then 25%, then 100%, only while the SLO holds. Rollback is the previous revision. Risky behavior ships dark behind a flag.
- An owner, a tier, a runbook, and alerts on SLO burn rather than CPU. No owner, no production deploy.
- CI checks: approved plan, stale ERD, secret scan, and a dependency and license allowlist.

Do not fake those systems in the prototype. Leave the file layout and the contracts so they can be added.

## Definition of done

A change is ready when each line that applies is true:

- An approved `/plan` in `docs/plans/` is the spec this change followed.
- The contract changed first. Zod validates in and out. Paths are nouns. Methods are verbs. Errors share one shape and a catalog code.
- Every write takes `Idempotency-Key`. Status changes are legal transitions. `schema.sql` can run again.
- Tokens come from `client/src/tokens.css`. Components use them. A value is not typed by hand in a component.
- A changed screen still works from the keyboard, uses semantic HTML, and shows a visible focus treatment. Status is a text label, not color alone.
- Components stay under 50 lines. Functions are pure. Shared data is not mutated. Shared functions have JSDoc.
- Jest covers the unit behavior. Docs changed in the same change, including a refreshed ERD when data moved.
- No secrets or restricted data in code, prompts, logs, or seed data.
