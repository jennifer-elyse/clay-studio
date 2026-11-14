# ADR 000 — One Clay stack

## Status

Accepted. Clay 1.0.

## Decision

This app is React 19, Express, and PostgreSQL, with JavaScript and JSDoc. `react` and `react-dom` stay on `^19.3.1` until a newer 19 release moves this starter and Clay Studio together. `node scripts/stack-versions.js` warns when React, Express, or another direct dependency is behind the npm `latest` tag. Contracts are Zod in `server/contracts.js`. The API is versioned under `/v1`. Status changes are transitions. Writes require `Idempotency-Key`.

Localhost uses PGlite. Promotion adds Cloud Run, APIM, and Cloud SQL in front of the same files. Shared contracts, respond-validated, lint configs, and the ERD generator come from versioned `@cswg` packages. This app upgrades those packages. It does not keep a private fork of them.

## Why

Clay 1.0 is one architecture for every internal web app. A new app starts from this starter and inherits the tokens, the API shape, and the code rules. A prototype that invents a second stack cannot be reviewed or promoted against the definition of done.

## Consequences

New screens, routes, and tables extend this shape. A repo that cannot conform files a time-boxed exception as an ADR, approved by the AI Committee, with a date to close it. A quiet dependency is not an exception.
