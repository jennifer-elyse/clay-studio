const PLACEHOLDER = /<\/?invoke_tool_placeholder\b[^>]*>/gi;

/**
 * Copilot leaves this tag in the message when a tool call is still waiting.
 * @param {string} text
 * @returns {string}
 */
export function withoutToolPlaceholders(text) {
  return String(text ?? "")
    .replace(PLACEHOLDER, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * @param {any} request
 * @param {string} command
 * @param {string} planFolder
 * @returns {{ kind: string, feedback?: string }}
 */
export function copilotPermissionDecision(request, command, planFolder) {
  if (!request || typeof request !== "object") {
    return { kind: "reject", feedback: "Missing permission request." };
  }
  if (request.managedApprovalRequired === true) return { kind: "no-result" };
  if (request.kind === "read") return { kind: "approve-once" };
  if (request.kind === "write") {
    if (command === "plan" || command === "spec") {
      const name = String(request.fileName ?? "").replaceAll("\\", "/");
      if (!name.includes(`${planFolder}/`) && !name.endsWith(`/${planFolder}`)) {
        return { kind: "reject", feedback: `Write the plan under docs/${planFolder}/.` };
      }
    }
    return { kind: "approve-once" };
  }
  if (command === "plan" || command === "spec") {
    return { kind: "reject", feedback: "Write the plan file. Do not run commands." };
  }
  return { kind: "approve-once" };
}

/**
 * @param {any} request
 * @returns {string}
 */
export function planTextFromWrite(request) {
  if (!request || request.kind !== "write") return "";
  if (typeof request.newFileContents === "string") {
    const created = withoutToolPlaceholders(request.newFileContents);
    if (created) return created;
  }
  const edits = Array.isArray(request.fileEdits) ? request.fileEdits : [];
  for (const edit of edits) {
    const content = edit?.after?.content;
    if (typeof content === "string") {
      const next = withoutToolPlaceholders(content);
      if (next) return next;
    }
  }
  return "";
}
