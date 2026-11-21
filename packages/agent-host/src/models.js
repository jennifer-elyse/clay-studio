const PLAN_MODEL = "claude-4.5-sonnet";
const BUILD_MODEL = "grok-4.7";
const FAST_MODEL = "composer-2.5";
const COPILOT_MODEL = "gpt-6.1-sol";
const COPILOT_FAST_MODEL = "gpt-6-luna";
const CODEX_FAST_MODEL = "gpt-5.4-mini";
const CODEX_WORK_MODEL = "gpt-5.4";
const ROUTER_IDS = new Set(["auto", "auto-smart", "default"]);

/**
 * The first catalog row in this family is the top model the harness offered.
 * Cursor has no list rank, so family order is the list order.
 * @type {Record<"cursor" | "copilot" | "codex", Record<"plan" | "build" | "fast", RegExp>>}
 */
const FAMILY = {
  cursor: { plan: /claude/i, build: /grok/i, fast: /composer/i },
  copilot: {
    plan: /sol|sonnet|opus|fable/i,
    build: /sol|sonnet|opus|fable/i,
    fast: /luna|haiku|mini|flash/i,
  },
  codex: { plan: /(?!)/, build: /(?!)/, fast: /mini|nano/i },
};

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
 * Specify through analyze use the work model. Implement and converge use the build model.
 * Every other command is a short turn.
 *
 * @param {string} command
 * @returns {"plan" | "build" | "fast"}
 */
export function phaseFor(command) {
  if (command === "plan" || command === "spec" || command === "constitution" || command === "clarify" || command === "checklist" || command === "tasks" || command === "analyze") {
    return "plan";
  }
  if (command === "build" || command === "converge") return "build";
  return "fast";
}

/**
 * Cursor bills Claude per token and draws Grok and Composer from the weekly pool.
 * Copilot plan and build use the first listed Sol, Sonnet, Opus, or Fable. Other turns use the first listed Luna, Haiku, mini, or Flash.
 * Codex bills its fuller model for plan and build. Its SDK exposes no catalog, so those names stay fixed.
 * An empty catalog keeps the built-in name.
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
 * One row from a seat catalog. Cursor returns `id`. Codex returns `model` as the slug.
 * @typedef {{ id?: string, model?: string, aliases?: string[], parameters?: Array<{ id?: string, values?: Array<{ value?: string }> }>, variants?: Array<{ isDefault?: boolean, params?: Array<{ id?: string, value?: string }> }>, isDefault?: boolean }} CatalogModel
 */

/**
 * @param {CatalogModel} entry
 * @returns {string}
 */
function catalogSlug(entry) {
  if (typeof entry.model === "string" && entry.model.length > 0 && typeof entry.isDefault === "boolean") {
    return entry.model;
  }
  return typeof entry.id === "string" ? entry.id : "";
}

/**
 * @param {CatalogModel | { id?: string, model?: string, name?: string, displayName?: string } | null | undefined} entry
 */
function listedModelId(entry) {
  if (!entry) return "";
  if (typeof entry.id === "string" && entry.id.length > 0) return entry.id;
  return typeof entry.model === "string" ? entry.model : "";
}

/**
 * @param {{ name?: string, displayName?: string } | null | undefined} entry
 * @param {string} id
 */
function listedModelLabel(entry, id) {
  if (typeof entry?.displayName === "string" && entry.displayName.length > 0) return entry.displayName;
  if (typeof entry?.name === "string" && entry.name.length > 0) return entry.name;
  return id;
}

/**
 * @param {CatalogModel[] | null | undefined} catalog
 * @returns {Array<CatalogModel & { slug: string }>}
 */
function catalogEntries(catalog) {
  if (!Array.isArray(catalog)) return [];
  return catalog.flatMap((entry) => {
    if (!entry) return [];
    const slug = catalogSlug(entry);
    return slug.length > 0 ? [{ ...entry, slug }] : [];
  });
}

/**
 * @param {"cursor" | "copilot" | "codex"} seat
 * @param {"plan" | "build" | "fast"} phase
 * @param {CatalogModel & { slug: string }} entry
 */
function matchesFamily(seat, phase, entry) {
  const names = [entry.slug, ...(entry.aliases ?? [])];
  if (seat === "codex" && phase !== "fast") {
    return names.some((name) => /gpt|codex|o\d/i.test(name) && !/mini|nano/i.test(name));
  }
  const pattern = FAMILY[seat][phase];
  return names.some((name) => pattern.test(name));
}

/**
 * @param {CatalogModel} entry
 * @returns {Array<{ id: string, value: string }> | undefined}
 */
function defaultVariantParams(entry) {
  const variant = (entry.variants ?? []).find((item) => item?.isDefault);
  const params = (variant?.params ?? [])
    .filter((item) => typeof item?.id === "string" && typeof item?.value === "string")
    .map((item) => ({ id: item.id, value: item.value }));
  return params.length > 0 ? params : undefined;
}

/**
 * @param {Array<{ id: string, value: string }> | undefined} params
 * @param {{ id: string, value: string }} next
 */
function withParam(params, next) {
  return [...(params ?? []).filter((item) => item.id !== next.id), next];
}

/**
 * @param {CatalogModel & { slug: string }} entry
 * @param {"plan" | "build" | "fast"} phase
 * @returns {Array<{ id: string, value: string }> | undefined}
 */
function cursorParams(entry, phase) {
  if (entry.slug === "auto-smart") {
    const optimize = (entry.parameters ?? []).find((item) => item?.id === "optimize_for");
    const values = (optimize?.values ?? []).map((item) => item?.value).filter((value) => typeof value === "string");
    const want = phase === "fast" ? "cost" : "intelligence";
    const value = values.includes(want) ? want : values.includes("balanced") ? "balanced" : values[0];
    return value ? [{ id: "optimize_for", value }] : undefined;
  }
  const base = defaultVariantParams(entry);
  if (phase !== "build" || !entry.slug.startsWith("grok-")) return base;
  const effort = (entry.parameters ?? []).find((item) => item?.id === "reasoning_effort");
  const allowsHigh = !effort || (effort.values ?? []).some((item) => item?.value === "high");
  if (!allowsHigh) return base;
  return withParam(base, { id: "reasoning_effort", value: "high" });
}

/**
 * Models a person can pick from a harness catalog. Routers such as Auto are omitted
 * when the catalog also lists a concrete model. The label is the harness display name.
 *
 * @param {Array<CatalogModel | { id?: string, model?: string, name?: string, displayName?: string }> | null | undefined} catalog
 * @returns {Array<{ id: string, label: string }>}
 */
export function selectableModels(catalog) {
  /** @type {Array<{ id: string, label: string }>} */
  const rows = [];
  const seen = new Set();
  for (const entry of Array.isArray(catalog) ? catalog : []) {
    const id = listedModelId(entry);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, label: listedModelLabel(entry, id) });
  }
  const concrete = rows.filter((row) => !ROUTER_IDS.has(row.id));
  return concrete.length > 0 ? concrete : rows;
}

/**
 * Ask the catalog first. The first listed model in the phase family is the one
 * this account can run. A typed override is sent unchanged. An empty catalog
 * keeps the built-in name.
 *
 * @param {"plan" | "build" | "fast"} phase
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {CatalogModel[] | null | undefined} catalog
 * @param {SeatModelOverrides} [overrides]
 * @returns {{ id: string, params?: Array<{ id: string, value: string }> }}
 */
export function resolveHarnessModel(phase, seat, catalog, overrides = {}) {
  const preferred = modelFor(phase, seat, overrides);
  if (seat !== "cursor" && seat !== "codex" && seat !== "copilot") return { id: preferred };
  if (hasSeatOverride(seat, phase, overrides)) return { id: preferred };
  const entries = catalogEntries(catalog);
  if (entries.length === 0) {
    return seat === "cursor" ? cursorModelOptions(preferred, phase) : { id: preferred };
  }
  const listed = entries.find((entry) => matchesFamily(seat, phase, entry));
  const concrete = entries.find((entry) => !ROUTER_IDS.has(entry.slug));
  const chosen = listed ?? concrete ?? entries[0];
  if (seat !== "cursor") return { id: chosen.slug };
  const params = cursorParams(chosen, phase);
  return params ? { id: chosen.slug, params } : { id: chosen.slug };
}

/**
 * Every model this phase could run, best first. A typed override is the only choice.
 *
 * @param {"plan" | "build" | "fast"} phase
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {CatalogModel[] | null | undefined} catalog
 * @param {SeatModelOverrides} [overrides]
 * @returns {Array<{ id: string, params?: Array<{ id: string, value: string }> }>}
 */
export function harnessModelChoices(phase, seat, catalog, overrides = {}) {
  const first = resolveHarnessModel(phase, seat, catalog, overrides);
  if (seat !== "cursor" && seat !== "codex" && seat !== "copilot") return [first];
  if (hasSeatOverride(seat, phase, overrides)) return [first];
  const entries = catalogEntries(catalog);
  const family = entries.filter((entry) => matchesFamily(seat, phase, entry));
  const pool = family.length > 0 ? family : entries.filter((entry) => !ROUTER_IDS.has(entry.slug));
  const rest = pool
    .filter((entry) => entry.slug !== first.id)
    .map((entry) => {
      if (seat !== "cursor") return { id: entry.slug };
      const params = cursorParams(entry, phase);
      return params ? { id: entry.slug, params } : { id: entry.slug };
    });
  return [first, ...rest];
}

/**
 * @param {string} message
 */
export function usageLimitName(message) {
  const match = String(message ?? "").match(/usage limit for\s+([A-Za-z0-9.+-]+)/i);
  return match ? match[1].toLowerCase() : "";
}

/**
 * @param {string} message
 */
export function isUsageLimit(message) {
  return /usage limit|spend limit/i.test(String(message ?? ""));
}

/**
 * The next catalog model after a usage-limit failure. A named family such as Opus is skipped.
 *
 * @param {Array<{ id: string }>} choices
 * @param {number} index
 * @param {string} message
 */
export function nextModelAfterLimit(choices, index, message) {
  if (!isUsageLimit(message)) return null;
  const name = usageLimitName(message);
  return (
    choices.slice(index + 1).find((choice) => !name || !choice.id.toLowerCase().includes(name)) ?? null
  );
}

/**
 * Copilot plan and build take the first listed work model. Quick turns take
 * the first listed cheap model. A typed override is used as-is.
 *
 * @param {"plan" | "build" | "fast"} phase
 * @param {CatalogModel[] | null | undefined} catalog
 * @param {SeatModelOverrides} [overrides]
 */
export function resolveCopilotModel(phase, catalog, overrides = {}) {
  return resolveHarnessModel(phase, "copilot", catalog, overrides).id;
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
