import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { isInsideRepo, studioRoot } from "./preview.js";
import { installationProfileDir } from "./session-store.js";
import { defaultModels } from "./models.js";

const SEATS = /** @type {const} */ (["cursor", "codex", "copilot"]);

/** Letters, digits, dot, colon, slash, dash. No spaces or control characters. */
const MODEL_NAME = /^[\w.:/-]+$/;

/**
 * Blank means "no override". The value is trimmed and stored as undefined.
 */
export const SeatModelName = z
  .string()
  .trim()
  .max(100, "Model names are 100 characters or fewer.")
  .refine((value) => value === "" || MODEL_NAME.test(value), "Model names use letters, numbers, dots, colons, slashes, and dashes.")
  .transform((value) => value || undefined);

export const SeatModelPair = z.object({
  work: SeatModelName.optional(),
  fast: SeatModelName.optional(),
});

export const SeatModelsInput = z.object({
  cursor: SeatModelPair.nullable().optional(),
  codex: SeatModelPair.nullable().optional(),
  copilot: SeatModelPair.nullable().optional(),
});

export const SettingsInput = z
  .object({
    projectsRoot: z
      .string()
      .trim()
      .min(1, "Choose a folder.")
      .refine((value) => path.isAbsolute(value), "Choose a full folder path.")
      .optional(),
    seatModels: SeatModelsInput.optional(),
  })
  .refine((value) => value.projectsRoot !== undefined || value.seatModels !== undefined, "Send a folder or seat models.");

export const SettingsSchema = z.object({
  projectsRoot: z.string().optional(),
  seat: z.enum(["cursor", "codex", "copilot"]).optional(),
  seatModels: z
    .object({
      cursor: SeatModelPair.optional(),
      codex: SeatModelPair.optional(),
      copilot: SeatModelPair.optional(),
    })
    .optional(),
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
 * The model each seat uses without an override. Environment values count.
 * @returns {Record<"cursor" | "codex" | "copilot", { work: string, build: string, fast: string }>}
 */
export function seatModelDefaults() {
  return { cursor: defaultModels("cursor"), codex: defaultModels("codex"), copilot: defaultModels("copilot") };
}

/**
 * Apply a Settings edit to the saved overrides. Null clears a seat. A blank or default value
 * is not stored, so the seat follows its default. Cursor work has no single default, so it is kept.
 *
 * @param {Settings["seatModels"]} current
 * @param {z.infer<typeof SeatModelsInput>} input
 * @param {ReturnType<typeof seatModelDefaults>} defaults
 * @returns {NonNullable<Settings["seatModels"]>}
 */
export function mergeSeatModels(current = {}, input, defaults) {
  const next = { ...current };
  for (const seat of SEATS) {
    if (!(seat in input)) continue;
    const pair = input[seat];
    if (pair === null) {
      delete next[seat];
      continue;
    }
    if (pair === undefined) continue;
    const fallback = defaults[seat];
    const kept = {};
    if (pair.work && (seat === "cursor" || pair.work !== fallback.work)) kept.work = pair.work;
    if (pair.fast && pair.fast !== fallback.fast) kept.fast = pair.fast;
    if (kept.work || kept.fast) next[seat] = kept;
    else delete next[seat];
  }
  return next;
}

/**
 * @param {Settings} settings
 */
export async function saveSettings(settings) {
  const file = settingsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(SettingsSchema.parse(settings), null, 2), "utf8");
}

/**
 * Check a projects folder. It must exist, be a folder, and sit outside Clay.
 * @param {string} value
 * @param {string} [repoRoot]
 * @returns {Promise<string>} the resolved folder
 */
export async function validateProjectsRoot(value, repoRoot = studioRoot()) {
  const dir = path.resolve(value);
  if (isInsideRepo(dir, repoRoot)) throw new Error("Clay keeps projects outside itself.");
  const info = await fs.stat(dir).catch(() => null);
  if (!info) throw new Error("That folder does not exist.");
  if (!info.isDirectory()) throw new Error("Choose a folder, not a file.");
  return dir;
}
