---
name: migrate-erd
description: Change schema.sql so it can run again safely, then regenerate docs/erd.md in the same change.
---

# Migrate

1. Edit `server/schema.sql` so running it twice leaves one result. Prefer `IF NOT EXISTS` and additive changes.
2. Expand, then contract. Add a column before readers switch. Remove the old column in a later change so a rollback can still read the schema.
3. Apply the schema through `openDb()`.
4. Refresh the Mermaid in `docs/erd.md` from the schema. This capability owns its tables. Mark data other capabilities may reach only through the API.
5. Do not hand-edit the diagram into a shape the schema does not have.
