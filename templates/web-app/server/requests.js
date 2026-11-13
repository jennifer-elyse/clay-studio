import { randomUUID } from "node:crypto";
import { z } from "zod";
import { CreateRequestSchema, PatchRequestSchema, RequestSchema } from "./contracts.js";
import { mapRequest, openDb } from "./db.js";
import { requestId, respond, respondError } from "./respond.js";
import { transitionRequest } from "./status.js";

const ListSchema = z.object({ items: z.array(RequestSchema) });

/**
 * @param {import("express").Express} app
 */
export function registerRequests(app) {
  app.get("/v1/requests", async (req, res) => {
    const db = await openDb();
    const result = await db.query("SELECT * FROM requests ORDER BY created_at DESC");
    respond(res, ListSchema, { items: result.rows.map(mapRequest) });
    void requestId(req);
  });

  app.post("/v1/requests", async (req, res) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
      respondError(req, res, "IDEMPOTENCY_KEY_REQUIRED", "Every write needs an Idempotency-Key.");
      return;
    }
    const parsed = CreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(req, res, "INVALID_BODY", "Check title and detail.");
      return;
    }
    const db = await openDb();
    const existing = await db.query("SELECT * FROM requests WHERE idempotency_key = $1", [key]);
    if (existing.rows[0]) {
      respond(res, RequestSchema, mapRequest(existing.rows[0]));
      return;
    }
    const id = randomUUID();
    const inserted = await db.query(
      `INSERT INTO requests (id, title, detail, status, idempotency_key)
       VALUES ($1, $2, $3, 'submitted', $4)
       RETURNING *`,
      [id, parsed.data.title, parsed.data.detail, key],
    );
    respond(res, RequestSchema, mapRequest(inserted.rows[0]), 201);
  });

  app.patch("/v1/requests/:id", async (req, res) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
      respondError(req, res, "IDEMPOTENCY_KEY_REQUIRED", "Every write needs an Idempotency-Key.");
      return;
    }
    const parsed = PatchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(req, res, "INVALID_BODY", "Status is required.");
      return;
    }
    const db = await openDb();
    const found = await db.query("SELECT * FROM requests WHERE id = $1", [req.params.id]);
    if (!found.rows[0]) {
      respondError(req, res, "REQUEST_NOT_FOUND", "No request with that id.");
      return;
    }
    try {
      const next = transitionRequest(String(found.rows[0].status), parsed.data.status);
      const updated = await db.query(
        `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [next, req.params.id],
      );
      respond(res, RequestSchema, mapRequest(updated.rows[0]));
    } catch (error) {
      const code = /** @type {{ code?: string }} */ (error).code === "ILLEGAL_TRANSITION" ? "ILLEGAL_TRANSITION" : "ERROR";
      respondError(req, res, code, error instanceof Error ? error.message : "Update failed");
    }
  });
}
