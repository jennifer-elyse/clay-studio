/**
 * @typedef {object} TranscriptItem
 * @property {string} id
 * @property {"user" | "assistant" | "error" | "plan" | "summary"} kind
 * @property {string} [text]
 * @property {object} [plan]
 */

/**
 * @param {TranscriptItem[]} items
 * @param {import("@cswg/agent-host").UiEvent | { type: string, text?: string, id?: string, plan?: object, step?: object }} event
 * @returns {TranscriptItem[]}
 */
export function applyEvent(items, event) {
  if (event.type === "user_text") {
    return [...items, { id: event.id, kind: "user", text: event.text ?? "" }];
  }
  if (event.type === "assistant_text") {
    const last = items.at(-1);
    if (last?.kind === "assistant") {
      return [...items.slice(0, -1), { ...last, text: `${last.text ?? ""}${event.text ?? ""}` }];
    }
    return [...items, { id: event.id, kind: "assistant", text: event.text ?? "" }];
  }
  if (event.type === "error") {
    return [...items, { id: event.id, kind: "error", text: event.text ?? "Something broke." }];
  }
  if (event.type === "plan" && event.plan) {
    return [...items.filter((item) => item.kind !== "plan" || item.plan?.path !== event.plan.path), {
      id: event.id,
      kind: "plan",
      plan: event.plan,
    }];
  }
  if (event.type === "summary") {
    return [...items, { id: event.id, kind: "summary", text: event.text ?? "Summarized." }];
  }
  if (event.type === "clear") {
    return [];
  }
  return items;
}

/**
 * @param {import("@cswg/agent-host").UiEvent[]} events
 */
export function stepsFrom(events) {
  /** @type {Record<string, { label: string, status: string }>} */
  const map = {};
  for (const event of events) {
    if (event.type === "step" && event.step) map[event.step.label] = event.step;
  }
  return Object.values(map);
}

const FINISHED = new Set(["finished", "done", "completed", "success"]);

/**
 * @param {import("@cswg/agent-host").UiEvent[]} events
 * @returns {{ phase: "idle" | "working" | "finished" | "error", label: string }}
 */
export function runStateFrom(events) {
  /** @type {"idle" | "working" | "finished" | "error"} */
  let phase = "idle";
  for (const event of events) {
    if (event.type === "clear") phase = "idle";
    if (event.type === "run_started") phase = "working";
    if (event.type === "error") phase = "error";
    if (event.type === "run_finished") {
      const status = String(event.status ?? "finished");
      phase = FINISHED.has(status) ? "finished" : "error";
    }
  }
  if (phase === "working") return { phase, label: "Working…" };
  if (phase === "error") return { phase, label: "Stopped" };
  if (phase === "finished") return { phase, label: "Done" };
  return { phase, label: "" };
}

/**
 * Steps since the latest run. A finished run shows leftover "running" steps as done.
 * @param {import("@cswg/agent-host").UiEvent[]} events
 */
export function stepsForRun(events) {
  let start = 0;
  for (let index = 0; index < events.length; index += 1) {
    const type = events[index].type;
    if (type === "run_started" || type === "clear") start = index + 1;
  }
  const steps = stepsFrom(events.slice(start));
  const phase = runStateFrom(events).phase;
  if (phase === "finished") {
    return steps.map((step) => (step.status === "running" ? { ...step, status: "done" } : step));
  }
  if (phase === "error") {
    return steps.map((step) => (step.status === "running" ? { ...step, status: "error" } : step));
  }
  return steps;
}
