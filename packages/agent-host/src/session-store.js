import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

export const SessionSchema = z.object({
  agentId: z.string().optional(),
  seat: z.enum(["cursor", "codex", "copilot", "mock"]),
  model: z.string().optional(),
  appDir: z.string(),
  slug: z.string(),
  previewUrl: z.string().optional(),
  lastRunId: z.string().optional(),
});

/**
 * @typedef {z.infer<typeof SessionSchema>} Session
 */

/**
 * Directory for this Clay Studio installation. Project names live here and
 * stay put when a session file is pointed somewhere else.
 * @returns {string}
 */
export function installationProfileDir() {
  const override = process.env.CLAY_PROFILE_DIR?.trim();
  return path.resolve(override || path.join(os.homedir(), ".clay", "studio"));
}

/**
 * @returns {string}
 */
export function sessionPath() {
  return path.resolve(process.env.CLAY_SESSION_PATH || path.join(installationProfileDir(), "session.json"));
}

/**
 * @returns {Promise<Session | null>}
 */
export async function loadSession() {
  try {
    const raw = await fs.readFile(sessionPath(), "utf8");
    return SessionSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {Session} session
 */
export async function saveSession(session) {
  const file = sessionPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(SessionSchema.parse(session), null, 2), "utf8");
}
