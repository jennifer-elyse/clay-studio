import { planFolderName } from "./plan-gate.js";
import { MAX_SUBTASKS } from "./subtasks.js";

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

const SUBTASK_LIMIT =
  `Clay may open at most ${MAX_SUBTASKS} subtasks. A subtask must not start an agent. If the app or Clay crashes, stop. Do not send another prompt or retry.`;

/**
 * @param {string[]} lines
 */
function pack(lines) {
  return [SUBTASK_LIMIT, ...lines].filter(Boolean).join("\n");
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
    "You are writing the feature specification: what and why, not the tech stack. Do not implement code. Do not write the technical plan.",
    "Read docs/vision.md and docs/erd.md. Read docs/design.md only if this slice has a screen.",
    "Keep file names, libraries, and schemas out of the spec. Those belong in /speckit.plan.",
    "State user stories, the outcome, what is in and out of scope, observable behavior, and acceptance criteria with stable ids (AC-1, AC-2).",
    "You may keep checklists/requirements.md beside the spec. That file is the spec-quality checklist. Do not check its boxes.",
    "Write Markdown with YAML frontmatter `status: draft`, `title:`, and `slug:`.",
    specPath ? `Save it at ${specPath}.` : `Save it under docs/${planFolderName(appDir)}/.`,
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
    "You are writing the technical plan from the feature spec. Do not implement code yet. Do not rewrite the what and why.",
    "Read spec.md, docs/vision.md, and docs/erd.md. Read the definition of done in docs/code.md. Read docs/design.md only if this slice has a screen.",
    "The plan states the tech stack, the contract or route change, the status transitions, the data change, the docs that move with it, and which definition-of-done lines this slice will meet.",
    "Write a single Markdown plan with YAML frontmatter `status: draft` and `title:`.",
    planPath ? `Save it at ${planPath}.` : `Save it under docs/${planFolderName(appDir)}/.`,
    `Do not change files outside docs/${planFolderName(appDir)}/.`,
    "Stop after the plan file is saved. Clay asks the person to approve it. Do not build.",
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
    "Execute the tasks in tasks.md, in dependency order. Do not expand past the spec or the approved plan.",
    `Approved plan: ${plan.path} (${plan.title}). Read that file, tasks.md, and docs/code.md.`,
    "Read checklist boxes before you start. If any box is unchecked, ask before continuing. Do not change a checklist marker. A checked box means a person reviewed the requirement, not that the code is done.",
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
export function chatPrompt(rest, seat) {
  return pack([DATA_REMINDER, followRules(seat), "Answer from the files already in context.", rest]);
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
 * @param {string} [appDir]
 */
export function codePrompt(rest, seat, appDir = "") {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Use the IDE. Make this change in the open project. Do not hand it to a background agent.",
    "Edit JavaScript with JSDoc. Read docs/code.md and the files you will change. Do not open the other docs.",
    "New capabilities still need an approved /speckit.plan. Small fixes may go ahead.",
    appDir ? `Workspace: ${appDir}` : "",
    rest || "What should we change in the code?",
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function constitutionPrompt({ appDir, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "You are writing the project constitution: the principles every later step is judged against. Do this once for the project. Do not implement code. Do not write a feature spec.",
    "Read docs/code.md. Record the principles the person states. Keep libraries out.",
    "Save docs/constitution.md at the project root of docs/. Do not put it inside a feature folder. Do not change any other file.",
    rest ? `Principles: ${rest}` : "Ask which principles should govern this app.",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function clarifyPrompt({ appDir, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Resolve ambiguity in the current spec. Ask at most five questions. Do not implement code. Do not invent a tech stack.",
    rest
      ? "The person answered. Encode only those answers into spec.md. You may update checklists/requirements.md. Do not edit a custom checklist."
      : "Ask the questions and stop. Do not edit files, and do not invent the answers.",
    `Read the spec under docs/${planFolderName(appDir)}/.`,
    rest ? `Focus or answers: ${rest}` : "Pick the most underspecified area.",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function checklistPrompt({ appDir, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Write a requirements-quality checklist. It checks whether the spec is complete and unambiguous. It is not a test of the code, and it is not checklists/requirements.md.",
    "Do not implement code. Leave every box unchecked. A person checks a box after reviewing the requirement. You must not check it.",
    `Save it under docs/${planFolderName(appDir)}/checklists/.`,
    rest ? `Focus: ${rest}` : "Cover the whole spec.",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function tasksPrompt({ appDir, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Read spec.md and plan.md. Break that design into ordered tasks. Phases: Setup, Foundational, one phase per user story, then Polish. Put tests inside a user story's phase when the spec asks for them.",
    "Do not implement code. Do not rewrite the spec or the plan.",
    `Save tasks.md under docs/${planFolderName(appDir)}/.`,
    rest ? `Extra direction: ${rest}` : "",
    `Workspace: ${appDir}`,
  ]);
}

/**
 * @param {object} input
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function analyzePrompt({ rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Read spec.md, plan.md, and tasks.md. Report conflicts, gaps, and ambiguities. Do not edit files.",
    "For each finding, name the earlier command that should fix it: /speckit.specify or /speckit.clarify for a requirement, /speckit.plan for a design choice, /speckit.tasks to regenerate the task list.",
    rest ? `Focus: ${rest}` : "Check the whole set.",
  ]);
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {"cursor" | "codex" | "copilot" | "mock"} [input.seat]
 */
export function convergePrompt({ appDir, rest, seat }) {
  return pack([
    DATA_REMINDER,
    followRules(seat),
    "Run this only after /speckit.implement. Compare the code with the spec, plan, and tasks.",
    "Do not edit or delete application code. Do not change tasks that are already in the file.",
    "If nothing is missing, say Converged and leave tasks.md unchanged. If something is missing, append tasks under a Convergence heading, say how many, and name /speckit.implement as the next step.",
    `Workspace: ${appDir}`,
    rest ? `Extra direction: ${rest}` : "",
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
  return [
    "First write five short sentences of reasoning. Then do the task below. Do not open extra docs for the reasoning.",
    body,
  ].join("\n");
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
  const appDir = ctx.appDir ?? "";
  if (command === "constitution") return constitutionPrompt({ appDir, rest, seat });
  if (command === "spec") return specPrompt({ appDir, rest, specPath: ctx.specPath, seat });
  if (command === "clarify") return clarifyPrompt({ appDir, rest, seat });
  if (command === "plan") return planPrompt({ appDir, rest, planPath: ctx.planPath, seat });
  if (command === "checklist") return checklistPrompt({ appDir, rest, seat });
  if (command === "tasks") return tasksPrompt({ appDir, rest, seat });
  if (command === "analyze") return analyzePrompt({ rest, seat });
  if (command === "build" && ctx.plan) return buildPrompt({ appDir, plan: ctx.plan, rest, seat });
  if (command === "converge") return convergePrompt({ appDir, rest, seat });
  if (command === "think") return thinkPrompt(rest, seat);
  if (command === "code") return codePrompt(rest, seat, appDir);
  return chatPrompt(rest, seat);
}
