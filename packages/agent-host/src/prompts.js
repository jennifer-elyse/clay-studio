export const DATA_REMINDER =
  "Never put customer, payment, HR, or credential data in prompts, files, or logs. Use synthetic examples.";

/** Clay 1.0 rules every generated-app prompt applies. The full text is docs/code.md. */
export const CLAY_STANDARDS = [
  "Apply Clay 1.0 from docs/code.md, docs/design.md, docs/vision.md, and docs/erd.md. Do not invent a second stack.",
  "JavaScript with JSDoc. Change the Zod contract first and validate every request and response.",
  "Noun paths under /v1. Verbs are HTTP methods. Errors are { code, message, requestId } and code comes from the catalog in server/contracts.js.",
  "Every write sends Idempotency-Key and a retry returns the first result. Status changes are declared transitions. schema.sql can run again safely.",
  "Pure functions. Do not mutate shared data. Compare with ===. Screens stay under 50 lines and use tokens from client/src/tokens.css.",
  "Numbers use tabular figures. Layout is intrinsic, with container queries. Do not use a viewport breakpoint media query for layout. The only media query is prefers-reduced-motion, and it may only reduce or remove motion.",
  "Hover is a warm-gray surface change and slight elevation, only on an actionable element. Focus uses --focus-ring and is not color-only. A disabled control says why when the reason is not obvious.",
  "Semantic HTML, keyboard use, a visible focus ring, and a text label for every status.",
  "Update the docs in the same change, including docs/erd.md when data moves.",
  "Before a change is done, fix open npm security issues. Upgrade a direct dependency when the patched release is newer. Do not downgrade a package to clear an advisory.",
].join(" ");

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {string} [input.planPath]
 */
export function planPrompt({ appDir, rest, planPath }) {
  return [
    DATA_REMINDER,
    CLAY_STANDARDS,
    "You are writing the Clay spec of record. Do not implement code yet.",
    "Read docs/vision.md, docs/erd.md, and docs/code.md first. Read docs/design.md when the change has a screen.",
    "The plan states the outcome, the contract or route change, the status transitions, the data change, the docs that move with it, and which definition-of-done lines this slice will meet.",
    "Write a single Markdown plan with YAML frontmatter `status: draft` and `title:`.",
    planPath
      ? `Save it at ${planPath}.`
      : "Save it under docs/plans/NNN-short-name/plan.md (pick the next NNN).",
    "Do not change files outside docs/plans/.",
    rest ? `The person asked: ${rest}` : "Plan the next useful slice of this internal app.",
    `Workspace: ${appDir}`,
  ].join("\n");
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {{ path: string, title: string }} input.plan
 * @param {string} input.rest
 */
export function buildPrompt({ appDir, plan, rest }) {
  return [
    DATA_REMINDER,
    CLAY_STANDARDS,
    "Implement ONLY the approved plan. Do not expand scope.",
    `Approved plan: ${plan.path} (${plan.title}).`,
    "Follow docs/code.md and the definition of done at the end of that file.",
    "Before you finish, fix open npm security issues. Upgrade to a newer patched release. Do not downgrade a package to clear an advisory.",
    "Use the add-endpoint skill for a new route, ui-tokens for a screen, and migrate-erd when the schema changes.",
    "Update docs in the same change. Keep components under 50 lines.",
    rest ? `Extra direction: ${rest}` : "",
    `Workspace: ${appDir}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {string} rest
 */
export function fixPrompt(rest) {
  return [
    DATA_REMINDER,
    CLAY_STANDARDS,
    "The person is not a developer. Fix the running app. Prefer small, reversible edits.",
    "A fix still follows the definition of done. New capabilities still need an approved /plan.",
    rest ? `What is wrong: ${rest}` : "Look at the current UI and fix the most obvious break.",
  ].join("\n");
}

/**
 * @param {string} rest
 */
export function chatPrompt(rest) {
  return [DATA_REMINDER, CLAY_STANDARDS, rest].join("\n\n");
}

/**
 * @param {string} rest
 */
export function searchPrompt(rest) {
  return [
    DATA_REMINDER,
    "Search the workspace and docs (vision, design, code, ERD, plans, adr).",
    "Return the matching files and a short quote. Do not change files.",
    rest ? `Look for: ${rest}` : "Ask what to search for if nothing was given.",
  ].join("\n");
}

/**
 * @param {string} rest
 */
export function thinkPrompt(rest) {
  return [
    DATA_REMINDER,
    CLAY_STANDARDS,
    "Think step by step before answering. Do not edit files unless the person asked for a change.",
    "Show the reasoning in plain language a non-coder can follow.",
    "Judge the idea against docs/vision.md and the definition of done in docs/code.md.",
    rest || "Think about the next best slice of this app.",
  ].join("\n");
}

/**
 * @param {string} rest
 */
export function writePrompt(rest) {
  return [
    DATA_REMINDER,
    "Write prose only: docs, UI copy, README notes. Do not change application logic.",
    "Keep docs in the repo next to the code. Vision, design, code, the ERD, and ADRs change with the behavior they describe.",
    "README names an owner and a last-reviewed date.",
    rest || "What should we write?",
  ].join("\n");
}

/**
 * @param {string} rest
 */
export function codePrompt(rest) {
  return [
    DATA_REMINDER,
    CLAY_STANDARDS,
    "Edit JavaScript with JSDoc. New capabilities still need an approved /plan. Small fixes may go ahead.",
    rest || "What should we change in the code?",
  ].join("\n");
}

/**
 * @param {string} rest
 */
export function imagePrompt(rest) {
  return [
    DATA_REMINDER,
    "Describe or sketch a screen, icon, or illustration. Use synthetic scenes only.",
    "Do not fetch or generate real customer, HR, or payment imagery.",
    "Use the tokens and states in docs/design.md. Status needs a text label, not color alone.",
    "If you cannot draw pixels, return a clear layout description the UI can show.",
    rest || "What should the picture show?",
  ].join("\n");
}

/**
 * @param {string} command
 * @param {object} ctx
 * @param {string} [ctx.rest]
 * @param {string} [ctx.appDir]
 * @param {string} [ctx.planPath]
 * @param {{ path: string, title: string } | null} [ctx.plan]
 */
export function promptFor(command, ctx) {
  const rest = ctx.rest ?? "";
  if (command === "plan") return planPrompt({ appDir: ctx.appDir ?? "", rest, planPath: ctx.planPath });
  if (command === "build" && ctx.plan) return buildPrompt({ appDir: ctx.appDir ?? "", plan: ctx.plan, rest });
  if (command === "fix") return fixPrompt(rest);
  if (command === "search") return searchPrompt(rest);
  if (command === "think") return thinkPrompt(rest);
  if (command === "write") return writePrompt(rest);
  if (command === "code") return codePrompt(rest);
  if (command === "image") return imagePrompt(rest);
  return chatPrompt(rest);
}
