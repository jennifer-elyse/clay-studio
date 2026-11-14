import { spawn } from "node:child_process";
import { browserOpen } from "../../../scripts/launch-plan.js";

const LOCAL_APP = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/;

/**
 * Open a localhost app in the operating system's default browser.
 * @param {string | undefined} url
 * @param {string} platform
 * @param {(command: string, args: string[]) => void} [launch]
 * @returns {{ ok: true, url: string } | { ok: false, code: string, message: string }}
 */
export function openRunningApp(url, platform, launch = launchDetached) {
  if (!url || !LOCAL_APP.test(url)) {
    return { ok: false, code: "PREVIEW_ASLEEP", message: "The app is not running." };
  }
  const opener = browserOpen(url, platform);
  launch(opener.command, opener.args);
  return { ok: true, url };
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function launchDetached(command, args) {
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.unref();
}
