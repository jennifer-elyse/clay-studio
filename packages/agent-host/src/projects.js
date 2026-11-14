import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { slugify } from "./plan-gate.js";
import { isInsideRepo } from "./preview.js";
import { installationProfileDir } from "./session-store.js";

export { installationProfileDir };

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  folder: z.string().min(1),
  dir: z.string().min(1).optional(),
});

export const ProjectRegistrySchema = z.object({
  activeId: z.string().nullable().optional(),
  projects: z.array(ProjectSchema),
});

/**
 * @typedef {z.infer<typeof ProjectSchema>} ProjectRecord
 * @typedef {z.infer<typeof ProjectRegistrySchema>} ProjectRegistry
 */

/**
 * Named-project cache for this installation. It stays in the installation
 * profile, outside any generated app.
 * @returns {string}
 */
export function projectsPath() {
  return path.join(installationProfileDir(), "projects.json");
}

/**
 * A project folder is one path segment, outside Clay.
 * @param {string} folder
 * @returns {string}
 */
export function assertFolderName(folder) {
  const name = folder.trim();
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error("Folder name must be a single name.");
  }
  return name;
}

/**
 * Folder to create when the user named a project and left the folder blank.
 * @param {string} name
 * @returns {string}
 */
export function folderFromName(name) {
  return assertFolderName(slugify(name));
}

/**
 * Absolute project directory. A stored dir wins; otherwise the folder sits in appsDir.
 * @param {ProjectRecord} project
 * @param {string} appsDir
 * @returns {string}
 */
export function projectLocation(project, appsDir) {
  return project.dir ? path.resolve(project.dir) : path.join(appsDir, assertFolderName(project.folder));
}

/**
 * Where a save should put the project. A single name stays under appsDir.
 * An absolute path is the chosen folder from the file browser.
 * @param {string | undefined} folderInput
 * @param {string} name
 * @param {string} appsDir
 * @returns {{ folder: string, dir: string }}
 */
export function placementFor(folderInput, name, appsDir) {
  const trimmed = (folderInput ?? "").trim();
  if (!trimmed) {
    const folder = folderFromName(name);
    return { folder, dir: path.join(appsDir, folder) };
  }
  if (path.isAbsolute(trimmed)) {
    const dir = path.resolve(trimmed);
    const folder = assertFolderName(path.basename(dir));
    if (isInsideRepo(dir)) throw new Error(`Clay keeps projects outside itself. Refusing ${dir}.`);
    return { folder, dir };
  }
  const folder = assertFolderName(trimmed);
  return { folder, dir: path.join(appsDir, folder) };
}

/**
 * Persist dir only when the project is outside the default apps directory.
 * @param {string} dir
 * @param {string} appsDir
 * @returns {string | undefined}
 */
export function rememberedDir(dir, appsDir) {
  if (path.resolve(path.dirname(dir)) === path.resolve(appsDir)) return undefined;
  return path.resolve(dir);
}

/**
 * @param {string} target
 * @returns {Promise<boolean>}
 */
async function pathExists(target) {
  return fs.access(target).then(() => true).catch(() => false);
}

/**
 * Move a project directory. Missing sources are left for the template copy to create.
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
export async function relocateProject(from, to) {
  const prev = path.resolve(from);
  const next = path.resolve(to);
  if (prev === next || !(await pathExists(prev))) return next;
  assertFolderName(path.basename(next));
  if (isInsideRepo(next)) throw new Error(`Clay keeps projects outside itself. Refusing ${next}.`);
  if (await pathExists(next)) throw new Error(`${next} already exists.`);
  await fs.mkdir(path.dirname(next), { recursive: true });
  await fs.rename(prev, next);
  return next;
}

/**
 * @returns {Promise<ProjectRegistry>}
 */
export async function loadProjectRegistry() {
  try {
    const raw = await fs.readFile(projectsPath(), "utf8");
    return ProjectRegistrySchema.parse(JSON.parse(raw));
  } catch {
    return { activeId: null, projects: [] };
  }
}

/**
 * @param {ProjectRegistry} registry
 */
export async function saveProjectRegistry(registry) {
  const file = projectsPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(ProjectRegistrySchema.parse(registry), null, 2), "utf8");
}

/**
 * @param {string} dir
 * @returns {Promise<boolean>}
 */
export async function isClayProject(dir) {
  return fs
    .access(path.join(dir, "AGENTS.md"))
    .then(() => true)
    .catch(() => false);
}

/**
 * @param {string} appsDir
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
export async function renameProjectFolder(appsDir, from, to) {
  const prev = assertFolderName(from);
  const next = assertFolderName(to);
  const dest = path.join(appsDir, next);
  if (prev === next) return dest;
  if (isInsideRepo(appsDir) || isInsideRepo(dest)) {
    throw new Error(`Clay keeps projects outside itself. Refusing ${dest}.`);
  }
  const taken = await fs
    .access(dest)
    .then(() => true)
    .catch(() => false);
  if (taken) throw new Error(`${next} already exists.`);
  await fs.rename(path.join(appsDir, prev), dest);
  return dest;
}
