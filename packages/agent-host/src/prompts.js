export const DATA_REMINDER =
  "Never put customer, payment, HR, or credential data in prompts, files, or logs. Use synthetic examples.";

/**
 * The attached product already loads AGENTS.md. Naming it is enough.
 * Pasting the constitution, or telling the model to open every doc, bills those tokens again.
 *
 * @param {"cursor" | "codex" | "copilot" | "mock" | undefined} seat
 */
function followRules(seat) {
  const product =
    seat === "cursor" ? "Cursor" : seat === "copilot" ? "Copilot" : seat === "codex" ? "Codex" : "This product";
  return `${product} already loaded AGENTS.md for this project. Follow it. Do not restate it, and do not open a doc this task does not name.`;
}

/**
 * @param {string[]} lines
 */
function pack(lines) {
  return lines.filter(Boolean).join("\n");
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {string} [input.specPath]
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function specPrompt({ appDir, rest, specPath, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "You are writing the behavioral spec. Do not implement code.",
    "Read docs/vision.md and docs/erd.md. Read docs/design.md only if this slice has a screen.",
    "Keep file names, libraries, and schemas out of the spec.",
    "State the outcome, what is in and out of scope, observable behavior, and acceptance criteria with stable ids (AC-1, AC-2).",
    "Write Markdown with YAML frontmatter `status: draft`, `title:`, and `slug:`.",
    specPath ? `Save it at ${specPath}.` : "Save it under docs/plans/NNN-short-name/spec.md (pick the next NNN).",
    "Do not change any other file.",
    rest ? `The person asked: ${rest}` : "Specify the next useful slice of this internal app.",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {string} [input.planPath]
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function planPrompt({ appDir, rest, planPath, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "You are writing the Clay spec of record. Do not implement code yet.",
    "Read docs/vision.md and docs/erd.md. Read the definition of done in docs/code.md. Read docs/design.md only if this slice has a screen.",
    "The plan states the outcome, the contract or route change, the status transitions, the data change, the docs that move with it, and which definition-of-done lines this slice will meet.",
    "Write a single Markdown plan with YAML frontmatter `status: draft` and `title:`.",
    planPath ? `Save it at ${planPath}.` : "Save it under docs/plans/NNN-short-name/plan.md (pick the next NNN).",
    "Do not change files outside docs/plans/.",
    rest ? `The person asked: ${rest}` : "Plan the next useful slice of this internal app.",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {{ path: string, title: string }} input.plan
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function buildPrompt({ appDir, plan, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Implement ONLY the approved plan. Do not expand scope.",
    `Approved plan: ${plan.path} (${plan.title}). Read that file and docs/code.md.`,
    "Open the add-endpoint skill for a new route, ui-tokens for a screen, and migrate-erd when the schema changes. Do not open the others.",
    "Before you finish, fix open npm security issues. Upgrade to a newer patched release. Do not downgrade a package to clear an advisory.",
    "Update docs in the same change. Keep components under 50 lines.",
    rest ? `Extra direction: ${rest}` : "",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function fixPrompt(rest, seat) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "The person is not a developer. Fix the running app. Prefer small, reversible edits.",
    "Read only the files behind the break. Open docs/design.md if the break is visual.",
    "A fix still follows the definition of done. New capabilities still need an approved /plan.",
    rest ? `What is wrong: ${rest}` : "Look at the current screen and fix the most obvious break.",
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function chatPrompt(rest, seat) {
  return pack([DATA_REMINDER, followRules(seat), "Answer from the files already in context.", rest]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function searchPrompt(rest, seat) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Search the workspace. Return the matching files and a short quote. Do not change files. Do not load a file you will not quote.",
    rest ? `Look for: ${rest}` : "Ask what to search for if nothing was given.",
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function thinkPrompt(rest, seat) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Think before answering. Do not edit files.",
    "Read docs/vision.md only. Answer in five short sentences so the next step does not re-read a long essay.",
    rest || "Think about the next best slice of this app.",
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function writePrompt(rest, seat) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Write prose only: docs, UI copy, README notes. Do not change application logic.",
    "Open only the doc you are editing.",
    rest || "What should we write?",
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 * @param {string} [appDir]
 */
export function codePrompt(rest, seat, appDir = "") {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Use the IDE. Make this change in the open project. Do not hand it to a background agent.",
    "Edit JavaScript with JSDoc. Read docs/code.md and the files you will change. Do not open the other docs.",
    "New capabilities still need an approved /plan. Small fixes may go ahead.",
    appDir ? `Workspace: ${appDir}` : "",
    rest || "What should we change in the code?",
  ]);
}

/**
 * @param {string} rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [seat]
 */
export function imagePrompt(rest, seat) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Describe or sketch a screen, icon, or illustration. Use synthetic scenes only.",
    "Read docs/design.md only. Status needs a text label, not color alone.",
    rest || "What should the picture show?",
  ]);
}

/**
 * @param {string} command
 * @param {object} ctx
 * @param {string} [ctx.rest]
 * @param {string} [ctx.appDir]
 * @param {string} [ctx.planPath]
 * @param {string} [ctx.specPath]
 * @param {"cursor" | "codex" | "copilot" | "mock"} [ctx.seat]
 * @param {boolean} [ctx.thinkFirst]
 * @param {{ path: string, title: string } | null} [ctx.plan]
 */
export function promptFor(command, ctx) {
  const rest = ctx.rest ?? "";
  const seat = ctx.seat;
  const body = promptBody(command, { ...ctx, rest, seat });
  if (!ctx.thinkFirst) return body;
  return pack([
    "First write five short sentences of reasoning. Then do the task below. Do not open extra docs for the reasoning.",
    body,
  ]);
}

/**
 * @param {string} command
 * @param {object} ctx
 * @param {string} ctx.rest
 * @param {string} [ctx.appDir]
 * @param {string} [ctx.planPath]
 * @param {string} [ctx.specPath]
 * @param {"cursor" | "codex" | "copilot" | "mock"} [ctx.seat]
 * @param {{ path: string, title: string } | null} [ctx.plan]
 */
function promptBody(command, ctx) {
  const rest = ctx.rest ?? "";
  const seat = ctx.seat;
  if (command === "spec") return specPrompt({ appDir: ctx.appDir ?? "", rest, specPath: ctx.specPath, seat });
  if (command === "plan") return planPrompt({ appDir: ctx.appDir ?? "", rest, planPath: ctx.planPath, seat });
  if (command === "build" && ctx.plan) return buildPrompt({ appDir: ctx.appDir ?? "", plan: ctx.plan, rest, seat });
  if (command === "fix") return fixPrompt(rest, seat);
  if (command === "search") return searchPrompt(rest, seat);
  if (command === "think") return thinkPrompt(rest, seat);
  if (command === "write") return writePrompt(rest, seat);
  if (command === "code") return codePrompt(rest, seat, ctx.appDir);
  if (command === "image") return imagePrompt(rest, seat);
  return chatPrompt(rest, seat);
}
