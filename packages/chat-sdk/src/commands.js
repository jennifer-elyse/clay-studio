export { COMMANDS, filterCommands, parseSlash } from "@cswg/agent-host/commands";

export const STARTERS = [
  { id: "intake", label: "Intake form", prompt: "/plan an intake form for store requests" },
  { id: "tracker", label: "Request tracker", prompt: "/plan a request tracker with approve and reject" },
  { id: "queue", label: "Approval queue", prompt: "/plan an approval queue for weekly order exceptions" },
];

export const PILL_IDS = [
  "plan",
  "build",
  "run",
  "fix",
  "help",
  "clear",
  "search",
  "think",
  "summarize",
  "write",
  "code",
  "image",
  "settings",
  "docs",
  "debug",
  "reset",
  "seat",
];
