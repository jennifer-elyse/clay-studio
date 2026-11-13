const NEXT = {
  draft: ["submitted"],
  submitted: ["approved", "rejected"],
  approved: ["closed"],
  rejected: ["closed"],
  closed: [],
};

/**
 * @param {string} from
 * @param {string} to
 */
export function canTransition(from, to) {
  return (NEXT[from] ?? []).includes(to);
}

/**
 * @param {string} from
 * @param {string} to
 */
export function transitionRequest(from, to) {
  if (!canTransition(from, to)) {
    const error = new Error(`Cannot move from ${from} to ${to}`);
    error.code = "ILLEGAL_TRANSITION";
    throw error;
  }
  return to;
}

export const STATUSES = Object.keys(NEXT);
