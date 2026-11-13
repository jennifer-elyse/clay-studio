import { z } from "zod";

export const StatusSchema = z.enum(["draft", "submitted", "approved", "rejected", "closed"]);

export const RequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  status: StatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateRequestSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().max(2000).default(""),
});

export const PatchRequestSchema = z.object({
  status: StatusSchema,
});

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
});

/**
 * Machine codes. Never rename or reuse one. Each maps to a single HTTP status.
 * @type {Record<string, number>}
 */
export const ERROR_CODES = {
  IDEMPOTENCY_KEY_REQUIRED: 400,
  INVALID_BODY: 400,
  REQUEST_NOT_FOUND: 404,
  ILLEGAL_TRANSITION: 409,
  NOT_FOUND: 404,
  ERROR: 500,
};
