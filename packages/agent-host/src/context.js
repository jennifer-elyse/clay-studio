/** Short turns kept on one agent before that thread is dropped or summarized. */
export const FAST_TURN_LIMIT = 4;

/**
 * Preview tools are a schema on every turn that carries them.
 * Plan, spec, and chat do not need them.
 *
 * @param {string} command
 */
export function commandNeedsTools(command) {
  return command === "build" || command === "fix";
}

/**
 * @param {{ phase: "plan" | "build" | "fast", turns: number, hasHistory: boolean }} state
 */
export function compactBefore(state) {
  if (state.hasHistory) return true;
  if (state.phase === "plan" || state.phase === "build") return state.turns > 0;
  return state.turns >= FAST_TURN_LIMIT;
}

/**
 * A plan or a build leaves a long transcript. Collapse it before the next turn.
 *
 * @param {"plan" | "build" | "fast"} phase
 */
export function compactAfter(phase) {
  return phase === "plan" || phase === "build";
}
