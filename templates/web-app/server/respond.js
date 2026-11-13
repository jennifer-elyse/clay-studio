import { randomUUID } from "node:crypto";
import { ERROR_CODES, ErrorSchema } from "./contracts.js";

/**
 * @param {import("express").Request} req
 */
export function requestId(req) {
  return String(req.headers["x-request-id"] ?? randomUUID());
}

/**
 * @param {import("express").Response} res
 * @param {import("zod").ZodTypeAny} schema
 * @param {unknown} body
 * @param {number} [status]
 */
export function respond(res, schema, body, status = 200) {
  res.status(status).json(schema.parse(body));
}

/**
 * Send the one Clay error shape. Status comes from `ERROR_CODES`, not the caller.
 * Unknown codes become a generic 500 so a new code cannot ship unnamed.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {string} code
 * @param {string} message
 */
export function respondError(req, res, code, message) {
  const status = ERROR_CODES[code];
  if (!status) {
    respond(
      res,
      ErrorSchema,
      { code: "ERROR", message: "Something went wrong.", requestId: requestId(req) },
      ERROR_CODES.ERROR,
    );
    return;
  }
  respond(res, ErrorSchema, { code, message, requestId: requestId(req) }, status);
}
