/**
 * Spec Kit commands use the reference spelling `/speckit.*`.
 * Copilot's skills spelling `/speckit-*` is an alias of the same command.
 * @typedef {object} ClayCommand
 * @property {string} id
 * @property {string} slash
 * @property {string[]} [aliases]
 * @property {string} label
 * @property {string} summary
 * @property {boolean} needsInput
 * @property {boolean} [brain]
 */

/**
 * @param {string} id
 * @param {string} name
 * @param {string} label
 * @param {string} summary
 * @param {boolean} needsInput
 * @returns {ClayCommand}
 */
function speckit(id, name, label, summary, needsInput) {
  return {
    id,
    slash: `/speckit.${name}`,
    aliases: [`/speckit-${name}`],
    label,
    summary,
    needsInput,
    brain: true,
  };
}

export const COMMANDS = [
  speckit("constitution", "constitution", "Constitution", "Set the principles later steps are judged against", true),
  speckit("spec", "specify", "Specify", "Write what the change must do, not how", true),
  speckit("clarify", "clarify", "Clarify", "Resolve ambiguity before planning", true),
  speckit("plan", "plan", "Plan", "Write the technical plan from the spec", true),
  speckit("checklist", "checklist", "Checklist", "Check that the spec is complete and clear", false),
  speckit("tasks", "tasks", "Tasks", "Break the plan into ordered tasks", false),
  speckit("analyze", "analyze", "Analyze", "Check the spec, plan, and tasks for gaps", false),
  speckit("build", "implement", "Implement", "Execute the tasks in dependency order", false),
  speckit("converge", "converge", "Converge", "After implement, append any missing tasks", false),
  { id: "help", slash: "/help", label: "Help", summary: "List every command", needsInput: false },
  { id: "summarize", slash: "/summarize", label: "Summarize", summary: "Compress this thread to free context", needsInput: false },
  { id: "upload", slash: "/upload", label: "Upload", summary: "Add files to this project", needsInput: false },
  { id: "seat", slash: "/seats", aliases: ["/seat"], label: "Seats", summary: "Choose Cursor, Codex, or Copilot", needsInput: false },
  { id: "think", slash: "/think", label: "Think", summary: "Reason first, inside the same command", needsInput: true },
  { id: "run", slash: "/run", label: "Run", summary: "Start the local preview", needsInput: false },
  { id: "clear", slash: "/clear", label: "Clear", summary: "Wipe the chat, keep the agent", needsInput: false },
  { id: "settings", slash: "/settings", label: "Settings", summary: "Show seat, model, and workspace", needsInput: false },
  { id: "reset", slash: "/reset", label: "Reset", summary: "Start a fresh agent", needsInput: false },
  { id: "stop", slash: "/stop", label: "Stop", summary: "Cancel the run in flight", needsInput: false },
  { id: "debug", slash: "/debug", label: "Debug", summary: "Show the process log", needsInput: false },
];

const bySlash = new Map();
for (const command of COMMANDS) {
  bySlash.set(command.slash, command);
  for (const alias of command.aliases ?? []) bySlash.set(alias, command);
}

const PROJECT_IDS = new Set(["constitution", "spec", "clarify", "plan", "checklist", "tasks", "analyze", "build", "converge"]);
const ARTIFACT_IDS = new Set(["spec", "clarify", "plan", "checklist", "tasks"]);

/**
 * @param {string} id
 * @returns {boolean}
 */
export function needsProject(id) {
  return PROJECT_IDS.has(id);
}

/**
 * Artifact steps may write their own file. Analyze only reads. Converge may only append tasks.
 * @param {string} id
 * @returns {boolean}
 */
export function writesArtifacts(id) {
  return ARTIFACT_IDS.has(id);
}

/**
 * @param {string} input
 * @returns {{ command: ClayCommand | null, rest: string, think: boolean }}
 */
export function parseSlash(input) {
  const trimmed = input.trim();
  const [head, ...tail] = trimmed.split(/\s+/);
  const command = head && bySlash.get(head) ? bySlash.get(head) : null;
  if (!command) return { command: null, rest: trimmed, think: false };
  const think = command.id === "think" || tail.includes("/think");
  const rest = tail.filter((token) => token !== "/think").join(" ");
  return { command, rest, think };
}

/**
 * Put `/think` in the same command, after the slash and before the rest.
 * @param {string} input
 * @returns {string}
 */
export function withThink(input) {
  const parsed = parseSlash(input);
  if (!parsed.command || parsed.think) {
    const trimmed = input.trim();
    return input.endsWith(" ") ? `${trimmed} ` : trimmed;
  }
  const head = input.trim().split(/\s+/)[0];
  const text = parsed.rest ? `${head} /think ${parsed.rest}` : `${head} /think`;
  return input.endsWith(" ") || !parsed.rest ? `${text} ` : text;
}

/**
 * @param {string} input
 * @returns {ClayCommand[]}
 */
export function filterCommands(input) {
  const q = input.trim().replace(/^\//, "").toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter((command) => {
    const names = [command.slash, ...(command.aliases ?? []), command.label];
    return names.some((name) => name.replace(/^\//, "").toLowerCase().startsWith(q));
  });
}

/**
 * @returns {string}
 */
export function formatHelp() {
  const lines = COMMANDS.map((command) => `${command.slash}  ${command.summary}`);
  return ["Commands. Click a pill or type the slash.", "", ...lines].join("\n");
}
