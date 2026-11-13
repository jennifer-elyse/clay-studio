export const PLAN_MODEL = process.env.CLAY_PLAN_MODEL || "claude-4.5-sonnet";
export const BUILD_MODEL = process.env.CLAY_BUILD_MODEL || "grok-4.7";
export const COPILOT_MODEL = process.env.CLAY_COPILOT_MODEL || "gpt-5.4";

/**
 * @param {"plan" | "build" | "chat"} phase
 * @param {"cursor" | "copilot" | "mock"} seat
 */
export function modelFor(phase, seat) {
  if (seat === "mock") return "mock-clay";
  if (seat === "copilot") return COPILOT_MODEL;
  if (phase === "plan") return PLAN_MODEL;
  if (phase === "build") return BUILD_MODEL;
  return BUILD_MODEL;
}

/**
 * @param {string} modelId
 * @param {"plan" | "build" | "chat"} phase
 */
export function cursorModelOptions(modelId, phase) {
  if (phase === "build" || modelId.startsWith("grok-")) {
    return {
      id: modelId,
      params: [{ id: "reasoning_effort", value: "high" }],
    };
  }
  return { id: modelId };
}
