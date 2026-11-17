/**
 * Why Plan or Build stays off for this project. Empty means the button can be used.
 * @param {string} commandId
 * @param {{ plan?: boolean, build?: boolean }} [done]
 * @returns {string}
 */
export function pillLock(commandId, done = {}) {
  if (commandId === "plan" && done.plan) return "This project already has an approved plan.";
  if (commandId === "build" && done.build) return "This project is already built.";
  return "";
}
