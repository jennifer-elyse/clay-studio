import { createMachine, getNextSnapshot } from "xstate";

/** Request statuses. A change is an event on this machine. */
export const requestMachine = createMachine({
  id: "request",
  initial: "draft",
  states: {
    draft: { on: { submit: "submitted" } },
    submitted: { on: { approve: "approved", reject: "rejected" } },
    approved: { on: { close: "closed" } },
    rejected: { on: { close: "closed" } },
    closed: { type: "final" },
  },
});

/**
 * Move a request along the XState machine.
 * @param {string} status
 * @param {string} event
 * @returns {string}
 */
export function transitionRequest(status, event) {
  try {
    const current = requestMachine.resolveState({ value: status });
    const next = getNextSnapshot(requestMachine, current, { type: event });
    const value = typeof next.value === "string" ? next.value : "";
    if (!value || value === status) throw new Error("unchanged");
    return value;
  } catch (error) {
    const illegal = new Error(error instanceof Error && error.message !== "unchanged" ? error.message : `${status} cannot ${event}.`);
    illegal.code = "ILLEGAL_TRANSITION";
    throw illegal;
  }
}
