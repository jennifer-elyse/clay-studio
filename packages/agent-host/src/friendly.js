const TOOL_LABELS = {
  read: "Reading files",
  write: "Writing files",
  edit: "Editing files",
  shell: "Running a command",
  grep: "Searching the app",
  glob: "Finding files",
  start_preview: "Starting the app",
  stop_preview: "Stopping the app",
  clay_check: "Checking Clay rules",
};

/**
 * @param {string} name
 */
export function friendlyTool(name) {
  const key = name.split("/").pop() ?? name;
  return TOOL_LABELS[key] ?? `Working: ${key}`;
}

/**
 * @param {unknown} event
 * @returns {string | null}
 */
export function textFromCursorEvent(event) {
  if (!event || typeof event !== "object") return null;
  const typed = /** @type {Record<string, unknown>} */ (event);
  if (typed.type === "assistant" && typed.message && typeof typed.message === "object") {
    const message = /** @type {Record<string, unknown>} */ (typed.message);
    const content = message.content;
    if (!Array.isArray(content)) return null;
    return content
      .filter((block) => block && typeof block === "object" && /** @type {Record<string, unknown>} */ (block).type === "text")
      .map((block) => String(/** @type {Record<string, unknown>} */ (block).text ?? ""))
      .join("");
  }
  if (typeof typed.text === "string") return typed.text;
  return null;
}
