const PLAN_MODEL = "claude-4.5-sonnet";
const BUILD_MODEL = "grok-4.7";
const FAST_MODEL = "composer-2.5";
const COPILOT_MODEL = "gpt-6.1-sol";
const COPILOT_FAST_MODEL = "gpt-6-luna";
const COPILOT_PLAN_CHOICES = [COPILOT_MODEL, "gpt-6-sol", "gpt-5.6-sol", "claude-sonnet-5.5"];
const COPILOT_FAST_CHOICES = [COPILOT_FAST_MODEL, "gpt-5.6-luna", "claude-haiku-5.5", "claude-haiku-4.5"];
const CODEX_FAST_MODEL = "gpt-5.4-mini";
const CODEX_WORK_MODEL = "gpt-5.4";

/**
 * @param {string} name
 * @param {string} fallback
 */
function envModel(name, fallback) {
  return process.env[name] || fallback;
}

/**
 * Typed model names from Settings. `work` covers plan and build. `fast` covers quick turns.
 * @typedef {{ work?: string, fast?: string }} SeatModelPair
 * @typedef {{ cursor?: SeatModelPair, codex?: SeatModelPair, copilot?: SeatModelPair }} SeatModelOverrides
 */

/**
 * The model a phase uses when no override is saved. Environment variables win over built-ins.
 * @param {"plan" | "build" | "fast"} phase
 * @param {"cursor" | "codex" | "copilot"} seat
 * @returns {string}
 */
function builtinModel(phase, seat) {
  if (seat === "codex") {
    const forced = process.env.CLAY_CODEX_MODEL;
    if (forced) return forced;
    if (phase === "fast") return envModel("CLAY_CODEX_FAST_MODEL", CODEX_FAST_MODEL);
    return envModel("CLAY_CODEX_PLAN_MODEL", CODEX_WORK_MODEL);
  }
  if (seat === "copilot") {
    return phase === "fast"
      ? envModel("CLAY_COPILOT_FAST_MODEL", COPILOT_FAST_MODEL)
      : envModel("CLAY_COPILOT_MODEL", COPILOT_MODEL);
  }
  if (phase === "plan") return envModel("CLAY_PLAN_MODEL", PLAN_MODEL);
  if (phase === "build") return envModel("CLAY_BUILD_MODEL", BUILD_MODEL);
  return envModel("CLAY_FAST_MODEL", FAST_MODEL);
}

/**
 * The defaults the Settings form shows. Cursor plan and build differ, so both are listed.
 * @param {"cursor" | "codex" | "copilot"} seat
 * @returns {{ work: string, build: string, fast: string }}
 */
export function defaultModels(seat) {
  return {
    work: builtinModel("plan", seat),
    build: builtinModel("build", seat),
    fast: builtinModel("fast", seat),
  };
}

/**
 * True when a saved override applies to this seat and phase.
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {"plan" | "build" | "fast"} phase
 * @param {SeatModelOverrides} [overrides]
 */
export function hasSeatOverride(seat, phase, overrides = {}) {
  if (seat !== "cursor" && seat !== "codex" && seat !== "copilot") return false;
  const pair = overrides[seat];
  return Boolean(pair?.[phase === "fast" ? "fast" : "work"]);
}

/**
 * Plan and spec are the spec of record. Build implements that spec.
 * Every other command is a short turn and uses the seat's cheap model.
 *
 * @param {string} command
 * @returns {"plan" | "build" | "fast"}
 */
export function phaseFor(command) {
  if (command === "plan" || command === "spec") return "plan";
  if (command === "build") return "build";
  return "fast";
}

/**
 * Cursor bills Claude per token and draws Grok and Composer from the weekly pool.
 * Copilot plan and build use GPT-6.1 Sol. Other turns use GPT-6 Luna.
 * GPT-5.4 and GPT-5 mini left Copilot on 2026-10-19.
 * Codex bills GPT-5.4 mini at about a third of GPT-5.4, and low effort stays well under high.
 * A saved override wins over environment variables, and environment variables win over built-ins.
 *
 * @param {"plan" | "build" | "fast"} phase
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {SeatModelOverrides} [overrides]
 */
export function modelFor(phase, seat, overrides = {}) {
  if (seat === "mock") return "mock-clay";
  if (seat !== "cursor" && seat !== "codex" && seat !== "copilot") return builtinModel(phase, "cursor");
  if (hasSeatOverride(seat, phase, overrides)) {
    return overrides[seat]?.[phase === "fast" ? "fast" : "work"] ?? builtinModel(phase, seat);
  }
  return builtinModel(phase, seat);
}

/**
 * High reasoning is only for the Cursor build, and only on Grok.
 * Claude planning is metered per token, so it does not get a reasoning boost.
 *
 * @param {string} modelId
 * @param {"plan" | "build" | "fast"} phase
 */
export function cursorModelOptions(modelId, phase) {
  if (phase === "build" && modelId.startsWith("grok-")) {
    return {
      id: modelId,
      params: [{ id: "reasoning_effort", value: "high" }],
    };
  }
  return { id: modelId };
}

/**
 * @param {"plan" | "build" | "fast"} phase
 * @returns {"low" | "medium"}
 */
export function codexEffort(phase) {
  return phase === "fast" ? "low" : "medium";
}

/**
 * @param {"plan" | "build" | "fast"} phase
 * @returns {"low" | "medium"}
 */
export function copilotEffort(phase) {
  return phase === "fast" ? "low" : "medium";
}

/**
 * Prefer the phase model when this account lists it. Otherwise take the next
 * current Copilot model the account actually offers. A typed override is used as-is.
 *
 * @param {"plan" | "build" | "fast"} phase
 * @param {Array<{ id?: string }> | null | undefined} catalog
 * @param {SeatModelOverrides} [overrides]
 */
export function resolveCopilotModel(phase, catalog, overrides = {}) {
  const preferred = modelFor(phase, "copilot", overrides);
  if (hasSeatOverride("copilot", phase, overrides)) return preferred;
  const ids = (catalog ?? []).map((item) => item?.id).filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0 || ids.includes(preferred)) return preferred;
  const chain = phase === "fast" ? COPILOT_FAST_CHOICES : COPILOT_PLAN_CHOICES;
  return chain.find((id) => ids.includes(id)) ?? ids[0];
}

/**
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {"plan" | "build" | "fast"} phase
 * @param {string} modelId
 */
export function seatCaption(seat, phase, modelId) {
  if (seat === "cursor" && phase === "plan") return `Planning with ${modelId}`;
  if (seat === "cursor" && phase === "build") return `Coding with ${modelId} High`;
  if (seat === "cursor") return `Working with ${modelId}`;
  if (seat === "copilot") return `Copilot ${modelId}`;
  if (seat === "codex" && phase === "fast") return `Codex ${modelId}, low effort`;
  if (seat === "codex") return `Codex ${modelId}, medium effort`;
  return modelId;
}
