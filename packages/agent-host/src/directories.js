import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { isClayProject } from "./projects.js";
import { isInsideRepo, studioRoot } from "./preview.js";

export const DirectoryQuery = z.object({
  path: z.string().optional(),
  name: z.string().optional(),
  leaf: z.string().optional(),
});

/**
 * @param {string} [home]
 * @returns {string}
 */
export function projectsHome(home = os.homedir()) {
  if (home === os.homedir() && process.env.CLAY_PROJECTS_DIR) return path.resolve(process.env.CLAY_PROJECTS_DIR);
  return path.resolve(path.join(home, "Projects"));
}

/**
 * Slug for a project folder. Empty when the name has no letters or digits.
 * @param {string} name
 * @returns {string}
 */
export function projectSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * @param {{ leaf?: string, name?: string }} input
 * @returns {string}
 */
export function projectLeaf(input) {
  const given = input.leaf?.trim();
  if (given) {
    if (given.includes("/") || given.includes("\\") || given.includes("..")) {
      throw new Error("Folder name must be a single name.");
    }
    return given;
  }
  return projectSlug(input.name || "");
}

/**
 * Home-relative label. The user directory stays `~`.
 * @param {string} dir
 * @param {string} [home]
 * @returns {string}
 */
export function displayPath(dir, home = os.homedir()) {
  const resolved = path.resolve(dir);
  const root = path.resolve(home);
  if (resolved === root) return "~";
  const prefix = `${root}${path.sep}`;
  if (resolved.startsWith(prefix)) return `~${path.sep}${resolved.slice(prefix.length)}`;
  return resolved;
}

/**
 * Known projects stay ahead of the other folders. Everything else is alphabetical.
 * @param {{ name: string, path: string }[]} entries
 * @param {string[]} [first]
 * @returns {{ name: string, path: string }[]}
 */
export function orderDirectoryEntries(entries, first = []) {
  const rank = new Map(first.map((name, index) => [name, index]));
  return [...entries].sort((left, right) => {
    const leftRank = rank.has(left.name) ? /** @type {number} */ (rank.get(left.name)) : first.length;
    const rightRank = rank.has(right.name) ? /** @type {number} */ (rank.get(right.name)) : first.length;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.name.localeCompare(right.name);
  });
}

/**
 * @param {string} dir
 * @returns {Promise<{ name: string, path: string }[]>}
 */
export async function listDirectories(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
    .map((entry) => ({ name: entry.name, path: path.join(dir, entry.name) }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * List one directory. With no path, the listing starts in the user's Projects folder.
 * The selected project folder is that directory plus the slugged project name.
 * @param {{ path?: string, name?: string, leaf?: string, home?: string, repoRoot?: string, first?: string[] }} [input]
 */
export async function browseDirectories(input = {}) {
  const home = input.home || os.homedir();
  const parent = input.path?.trim() ? path.resolve(input.path) : projectsHome(home);
  const leaf = projectLeaf(input);
  const selected = leaf ? path.join(parent, leaf) : parent;
  const up = path.dirname(parent);
  /** @type {{ name: string, path: string }[]} */
  let entries = [];
  let missing = false;
  try {
    const info = await fs.stat(parent);
    if (!info.isDirectory()) {
      const error = /** @type {NodeJS.ErrnoException} */ (new Error("Choose a folder."));
      error.code = "ENOTDIR";
      throw error;
    }
    entries = await listDirectories(parent);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    if (code === "ENOENT") missing = true;
    else throw error;
  }
  const repoRoot = input.repoRoot || studioRoot();
  /** @type {string[]} */
  const projects = [];
  const seen = new Set();
  for (const name of input.first || []) {
    const entry = entries.find((item) => item.name === name);
    if (!entry || seen.has(name) || isInsideRepo(entry.path, repoRoot)) continue;
    projects.push(name);
    seen.add(name);
  }
  for (const entry of entries) {
    if (seen.has(entry.name) || isInsideRepo(entry.path, repoRoot)) continue;
    if (await isClayProject(entry.path)) {
      projects.push(entry.name);
      seen.add(entry.name);
    }
  }
  const pins = path.resolve(parent) === path.resolve(home) ? ["Projects", ...projects] : projects;
  const ordered = orderDirectoryEntries(entries, pins);
  const projectNames = new Set(projects);
  const exists = entries.some((entry) => entry.name === leaf);
  return {
    path: parent,
    label: displayPath(parent, home),
    parent: up === parent ? null : up,
    selected,
    selectedLabel: displayPath(selected, home),
    pending: leaf && !exists ? leaf : "",
    missing,
    blocked: isInsideRepo(selected, input.repoRoot || studioRoot()),
    entries: ordered.map((entry) => ({ ...entry, project: projectNames.has(entry.name) })),
  };
}
