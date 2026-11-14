import { z } from "zod";

export const StepSchema = z.object({
  label: z.string(),
  status: z.enum(["running", "done", "error"]),
});

export const PlanSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  body: z.string(),
  status: z.enum(["draft", "approved", "rejected"]),
});

export const PreviewSchema = z.object({
  url: z.string().optional(),
  status: z.enum(["starting", "ready", "stopped", "error"]),
  message: z.string().optional(),
});

export const SeatSchema = z.object({
  provider: z.enum(["cursor", "codex", "copilot", "mock"]),
  model: z.string().optional(),
  caption: z.string().optional(),
});

export const UiEventSchema = z.object({
  type: z.enum([
    "assistant_text",
    "user_text",
    "step",
    "plan",
    "error",
    "run_started",
    "run_finished",
    "preview",
    "seat",
    "summary",
    "clear",
  ]),
  id: z.string(),
  text: z.string().optional(),
  step: StepSchema.optional(),
  plan: PlanSchema.optional(),
  preview: PreviewSchema.optional(),
  seat: SeatSchema.optional(),
  runId: z.string().optional(),
  agentId: z.string().optional(),
  status: z.string().optional(),
});

/**
 * @typedef {z.infer<typeof UiEventSchema>} UiEvent
 * @typedef {z.infer<typeof PlanSchema>} Plan
 * @typedef {z.infer<typeof SeatSchema>} Seat
 */

/**
 * @param {unknown} value
 * @returns {UiEvent}
 */
export function parseUiEvent(value) {
  return UiEventSchema.parse(value);
}

/**
 * @param {string} type
 * @param {Partial<UiEvent>} rest
 * @returns {UiEvent}
 */
export function makeEvent(type, rest = {}) {
  return parseUiEvent({
    type,
    id: rest.id ?? `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...rest,
  });
}
