import { writesArtifacts } from "./commands.js";

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
 * A plan path, the plan folder itself, or a parent such as docs.
 * @param {string} value
 * @param {string} planFolder
 * @returns {boolean}
 */
export function isPlanPath(value, planFolder) {
  const parts = String(value ?? "")
    .replaceAll("\\", "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "-p");
  if (parts.length === 0 || !planFolder) return false;
  if (parts.includes(planFolder)) return true;
  const joined = parts.join("/");
  return `docs/${planFolder}`.startsWith(`${joined}/`) || `docs/${planFolder}` === joined;
}

/**
 * mkdir of the plan folder only. Other commands stay refused during a plan.
 * @param {any} request
 * @param {string} planFolder
 * @returns {boolean}
 */
function isPlanDirectoryCommand(request, planFolder) {
  if (request.kind !== "shell" || request.hasWriteFileRedirection) return false;
  const text = String(request.fullCommandText ?? "").trim();
  if (!/^mkdir(?:\s+-p)?\s+\S/i.test(text) || /[;&|`$<>]/.test(text)) return false;
  const commands = Array.isArray(request.commands) ? request.commands : [];
  if (commands.some((command) => command?.identifier && command.identifier !== "mkdir")) return false;
  const listed = Array.isArray(request.possiblePaths) ? request.possiblePaths : [];
  const targets = (listed.length > 0 ? listed : text.split(/\s+/).slice(1)).filter(
    (target) => target && !String(target).startsWith("-"),
  );
  return targets.length > 0 && targets.every((target) => isPlanPath(target, planFolder));
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
  if (command === "analyze") {
    return { kind: "reject", feedback: "Analyze only reads. Do not change files." };
  }
  if (command === "constitution") {
    const name = String(request.fileName ?? "").replaceAll("\\", "/");
    if (request.kind === "write" && (name === "docs/constitution.md" || name.endsWith("/docs/constitution.md"))) {
      return { kind: "approve-once" };
    }
    return { kind: "reject", feedback: "Write the constitution at docs/constitution.md." };
  }
  if (command === "converge") {
    const name = String(request.fileName ?? "").replaceAll("\\", "/");
    if (request.kind === "write" && name.endsWith("tasks.md") && isPlanPath(name, planFolder)) {
      return { kind: "approve-once" };
    }
    return { kind: "reject", feedback: "Converge may only append tasks.md." };
  }
  if (request.kind === "write") {
    if (writesArtifacts(command)) {
      const name = String(request.fileName ?? "");
      if (!isPlanPath(name, planFolder)) {
        return { kind: "reject", feedback: `Write the plan under docs/${planFolder}/.` };
      }
    }
    return { kind: "approve-once" };
  }
  if (writesArtifacts(command)) {
    if (isPlanDirectoryCommand(request, planFolder)) return { kind: "approve-once" };
    return { kind: "reject", feedback: `Create docs/${planFolder}/ and write the plan there.` };
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
