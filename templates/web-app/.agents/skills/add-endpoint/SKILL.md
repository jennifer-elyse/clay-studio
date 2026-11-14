---
name: add-endpoint
description: Add a contract-first Express endpoint. Zod first, noun URLs under /v1, catalog error codes, Idempotency-Key on every write.
---

# Add an endpoint

1. Change the contract first. In this app that is `server/contracts.js`. Add the Zod request and response schemas. Add any new error `code` to `ERROR_CODES` with its one HTTP status. Never rename or reuse a code. Examples of catalog codes are `ORDER_NOT_FOUND` and `ITEM_OUT_OF_STOCK`. Stack traces never leave the service.
2. Do not delete or rename a required field, and do not narrow a type in place. A new required field has a default. When this API is shared, add the TypeSpec in the same change and update the consumer's contract copy.
3. Path is a noun under `/v1`. The method is the verb. `GET /getCartItems`, `POST /createOrder`, `POST /deleteUser/{id}`, and `/createRequest` are rejected. `GET /v1/requests` and `POST /v1/requests` are the shape.
4. Validate the body in. Validate the response with `respond()`. Errors go through `respondError` and are `{ code, message, requestId }`.
5. POST, PUT, PATCH, and DELETE require `Idempotency-Key`. Store the key with the result so a retry returns the first response. Missing key is 400. A retried write reuses the same key.
6. Status fields change only through `transitionRequest`.
7. Keep the handler thin. Route, then validate, then pure domain logic, then data access. The database stays at the edge.
8. Update `docs/erd.md` when data changed, and `docs/code.md` when the API rules changed. A new or breaking API is reviewed in the `/plan` before this work starts.
