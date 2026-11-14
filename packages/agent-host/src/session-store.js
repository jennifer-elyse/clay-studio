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
 * @returns {string}
 */
export function sessionPath() {
  return path.resolve(process.env.CLAY_SESSION_PATH || path.join(os.homedir(), ".clay", "studio", "session.json"));
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
