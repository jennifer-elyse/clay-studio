import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { installationProfileDir } from "./session-store.js";

export const SettingsSchema = z.object({
  seat: z.enum(["cursor", "codex", "copilot"]).optional(),
});

/**
 * @typedef {z.infer<typeof SettingsSchema>} Settings
 */

/**
 * @returns {string}
 */
export function settingsPath() {
  return path.join(installationProfileDir(), "settings.json");
}

/**
 * @returns {Promise<Settings>}
 */
export async function loadSettings() {
  try {
    return SettingsSchema.parse(JSON.parse(await fs.readFile(settingsPath(), "utf8")));
  } catch {
    return {};
  }
}

/**
 * Merge a settings patch into what is on disk, so one setting never drops another.
 * @param {Partial<Settings>} patch
 */
export async function updateSettings(patch) {
  await saveSettings({ ...(await loadSettings()), ...patch });
}

/**
 * @param {Settings} settings
 */
export async function saveSettings(settings) {
  const file = settingsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(SettingsSchema.parse(settings), null, 2), "utf8");
}
