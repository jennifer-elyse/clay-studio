# ADR 000 — One Clay stack

## Status

Accepted. Clay 1.0.

## Decision

This app is React, Express, and PostgreSQL, with JavaScript and JSDoc. Contracts are Zod in `server/contracts.js`. The API is versioned under `/v1`. Status changes are transitions. Writes require `Idempotency-Key`.

Localhost uses PGlite. Promotion adds Cloud Run, APIM, and Cloud SQL in front of the same files.

## Why

Clay 1.0 is one architecture for every internal web app. A prototype that invents a second stack cannot be reviewed or promoted against the definition of done.

## Consequences

New screens, routes, and tables extend this shape. A break from it needs a new ADR and a time-boxed exception, not a quiet dependency.
