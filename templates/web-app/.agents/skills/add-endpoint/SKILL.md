---
name: add-endpoint
description: Add a contract-first Express endpoint. Zod first, noun URLs under /v1, catalog error codes, Idempotency-Key on every write.
---

# Add an endpoint

1. Change `server/contracts.js` first. Add the Zod request and response schemas. Add any new error `code` to `ERROR_CODES` with its one HTTP status. Never rename or reuse a code.
2. Path is a noun under `/v1`. The method is the verb. Reject paths like `/createRequest`.
3. Validate the body in. Validate the response with `respond()`. Errors go through `respondError` and are `{ code, message, requestId }`.
4. POST, PUT, PATCH, and DELETE require `Idempotency-Key`. Store the key with the result so a retry returns the first response. Missing key is 400.
5. Status fields change only through `transitionRequest`.
6. Keep the handler thin. Domain decisions are pure functions. Database access stays at the edge.
7. Update `docs/erd.md` when data changed, and `docs/code.md` when the API rules changed.
