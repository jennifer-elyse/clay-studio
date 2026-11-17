/** Clay may open this many subtasks. A subtask may not start an agent. */
export const MAX_SUBTASKS = 5;

/**
 * @typedef {object} SubtaskGate
 * @property {string[]} seen
 * @property {number} count
 */

/**
 * @typedef {object} SubtaskDecision
 * @property {SubtaskGate} gate
 * @property {"" | "cap" | "loop"} stop
 */

/** @returns {SubtaskGate} */
export function emptySubtaskGate() {
  return { seen: [], count: 0 };
}

/**
 * @param {unknown} value
 * @returns {Record<string, unknown> | null}
 */
function asRecord(value) {
  if (!value || typeof value !== "object") return null;
  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * A subtask starting another agent. Nested task updates are the loop.
 *
 * @param {unknown} event
 */
export function isAgenticLoop(event) {
  const typed = asRecord(event);
  if (!typed || typed.type !== "tool-call-delta") return false;
  const update = asRecord(typed.taskUpdate);
  const toolCall = asRecord(update?.toolCall);
  return toolCall?.type === "task";
}

/**
 * Call id for a subtask that is just starting. A later completion of the same call is ignored.
 *
 * @param {unknown} event
 * @returns {string}
 */
export function subtaskStartId(event) {
  const typed = asRecord(event);
  if (!typed) return "";
  if (typed.type !== "tool_call" && typed.type !== "tool") return "";
  const name = String(typed.name ?? typed.tool ?? "");
  const key = name.split("/").pop();
  if (key !== "task") return "";
  if (typed.status && typed.status !== "running") return "";
  const id = String(typed.call_id ?? typed.callId ?? typed.id ?? "");
  return id || "*";
}

/**
 * @param {SubtaskGate} gate
 * @param {unknown} event
 * @returns {SubtaskDecision}
 */
export function decideSubtask(gate, event) {
  if (isAgenticLoop(event)) return { gate, stop: "loop" };
  const raw = subtaskStartId(event);
  if (!raw) return { gate, stop: "" };
  const id = raw === "*" ? `anon-${gate.count + 1}` : raw;
  if (gate.seen.includes(id)) return { gate, stop: "" };
  if (gate.count >= MAX_SUBTASKS) return { gate, stop: "cap" };
  return { gate: { seen: gate.seen.concat(id), count: gate.count + 1 }, stop: "" };
}
