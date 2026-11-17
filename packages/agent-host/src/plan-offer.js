import { makeEvent } from "./events.js";
import { planReadyForApproval } from "./plan-gate.js";

/**
 * The approval card is this event. Without it, a finished plan has no Approve button.
 *
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.relativePath
 * @param {number} input.sinceMs
 * @param {string} input.runId
 * @param {string} input.agentId
 */
export async function approvalEvents(input) {
  const ready = await planReadyForApproval(input.appDir, input.relativePath, input.sinceMs);
  if (!ready.ok) {
    return [
      makeEvent("run_finished", { runId: input.runId, agentId: input.agentId, status: "error" }),
      makeEvent("error", { text: ready.message, runId: input.runId, agentId: input.agentId }),
    ];
  }
  return [makeEvent("plan", { plan: ready.plan, runId: input.runId, agentId: input.agentId })];
}
