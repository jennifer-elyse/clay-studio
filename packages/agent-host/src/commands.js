export const COMMANDS = [
  { id: "plan", slash: "/plan", label: "Plan", summary: "Write a spec before anything is built", needsInput: true },
  { id: "build", slash: "/build", label: "Build", summary: "Implement the approved plan", needsInput: false },
  { id: "run", slash: "/run", label: "Run", summary: "Start the local preview", needsInput: false },
  { id: "fix", slash: "/fix", label: "Fix", summary: "Tell the agent what looks wrong", needsInput: true },
  { id: "docs", slash: "/docs", label: "Docs", summary: "Open vision, design, and the ERD", needsInput: false },
  { id: "help", slash: "/help", label: "Help", summary: "List every Clay command", needsInput: false },
  { id: "clear", slash: "/clear", label: "Clear", summary: "Wipe the chat, keep the agent", needsInput: false },
  { id: "search", slash: "/search", label: "Search", summary: "Find something in the app and docs", needsInput: true },
  { id: "think", slash: "/think", label: "Think", summary: "Reason first, then answer", needsInput: true },
  { id: "summarize", slash: "/summarize", label: "Summarize", summary: "Compress this thread to free context", needsInput: false },
  { id: "write", slash: "/write", label: "Write", summary: "Draft docs or copy, not application code", needsInput: true },
  { id: "code", slash: "/code", label: "Code", summary: "Edit code in the workspace", needsInput: true },
  { id: "image", slash: "/image", label: "Image", summary: "Sketch a screen or illustration in words", needsInput: true },
  { id: "settings", slash: "/settings", label: "Settings", summary: "Show seat, model, and workspace", needsInput: false },
  { id: "reset", slash: "/reset", label: "Reset", summary: "Start a fresh agent", needsInput: false },
  { id: "seat", slash: "/seats", aliases: ["/seat"], label: "Seats", summary: "Choose Cursor, Codex, or Copilot", needsInput: false },
  { id: "stop", slash: "/stop", label: "Stop", summary: "Cancel the run in flight", needsInput: false },
  { id: "debug", slash: "/debug", label: "Debug", summary: "Show the process log", needsInput: false },
];

const bySlash = new Map();
for (const command of COMMANDS) {
  bySlash.set(command.slash, command);
  for (const alias of command.aliases ?? []) bySlash.set(alias, command);
}

/**
 * @param {string} input
 * @returns {{ command: (typeof COMMANDS)[number] | null, rest: string }}
 */
export function parseSlash(input) {
  const trimmed = input.trim();
  const [head, ...tail] = trimmed.split(/\s+/);
  const command = head && bySlash.get(head) ? bySlash.get(head) : null;
  return { command: command ?? null, rest: command ? tail.join(" ") : trimmed };
}

/**
 * @param {string} input
 * @returns {(typeof COMMANDS)[number][]}
 */
export function filterCommands(input) {
  const q = input.trim().replace(/^\//, "").toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter(
    (command) =>
      command.slash.slice(1).startsWith(q) || command.label.toLowerCase().startsWith(q),
  );
}

/**
 * @returns {string}
 */
export function formatHelp() {
  const lines = COMMANDS.map((command) => `${command.slash}  ${command.summary}`);
  return ["Clay commands. Click a pill or type the slash.", "", ...lines].join("\n");
}
