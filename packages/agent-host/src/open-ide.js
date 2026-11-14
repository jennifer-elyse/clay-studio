import fs from "node:fs";
import { spawn } from "node:child_process";
import { codePrompt } from "./prompts.js";

const MAX_LINK = 8000;

/**
 * @param {string} text
 */
export function promptDeeplink(text) {
  const url = new URL("cursor://anysphere.cursor-deeplink/prompt");
  url.searchParams.set("text", text);
  return url.toString();
}

/**
 * @param {string} [platform]
 */
export function cursorCommand(platform = process.platform) {
  const override = process.env.CLAY_CURSOR_BIN?.trim();
  if (override) return override;
  if (platform === "darwin") {
    const mac = "/Applications/Cursor.app/Contents/Resources/app/bin/cursor";
    if (fs.existsSync(mac)) return mac;
  }
  return "cursor";
}

/**
 * @param {string} url
 * @param {string} platform
 * @returns {{ command: string, args: string[] }}
 */
function openLink(url, platform) {
  if (platform === "darwin") return { command: "open", args: [url] };
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", "", url] };
  return { command: "xdg-open", args: [url] };
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function launchDetached(command, args) {
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.unref();
}

/**
 * Open the project in the Cursor IDE and leave the /code prompt ready to review.
 * The deeplink does not send the prompt. The person reviews it in the IDE first.
 *
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.rest
 * @param {string} input.platform
 * @param {string} [input.cursorCommand]
 * @param {(command: string, args: string[]) => void} [launch]
 * @param {(ms: number) => Promise<void>} [wait]
 * @returns {Promise<{ ok: true, prompt: string, link: string } | { ok: false, code: string, message: string }>}
 */
export async function openCodeInIde(input, launch = launchDetached, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  const prompt = codePrompt(input.rest, "cursor", input.appDir);
  const link = promptDeeplink(prompt);
  if (link.length > MAX_LINK) {
    return { ok: false, code: "PROMPT_TOO_LONG", message: "That /code note is too long to open in the IDE." };
  }
  const folder = input.cursorCommand || cursorCommand(input.platform);
  const opener = openLink(link, input.platform);
  try {
    launch(folder, ["-n", "--classic", input.appDir]);
    await wait(400);
    launch(opener.command, opener.args);
  } catch {
    return { ok: false, code: "IDE_UNAVAILABLE", message: "Cursor could not open. Install it, then try /code again." };
  }
  return { ok: true, prompt, link };
}
