# Vision

A request tracker for internal store-to-HQ workflows: someone files a request, a reviewer approves or rejects it, and the list stays visible.

## Who it serves

Store operators and a small reviewing team. Synthetic sample rows only.

## Outcome

A localhost app where a person can submit, list, approve, and reject requests. Promotion onto Cloud Run and APIM is a later Clay step and keeps this stack.

## What it will not do

- Live customer data, payments, HR records, or production credentials
- A second framework, a second database, or a path that contains a verb
- Implementation without an approved plan in `docs/plans/`
- Production credentials, a public deploy, or a merge performed by an agent

## Clay constraints on every plan

Plans start from this file and from `docs/erd.md`. They solve this outcome. They do not widen the app into customer, payment, or HR data, and they do not replace React, Express, or Postgres.
