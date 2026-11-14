/**
 * Folder preview for the project form. The host checks the name again on save.
 * @param {string} name
 * @returns {string}
 */
export function folderFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * @param {string} dir
 * @param {string} leaf
 * @returns {string}
 */
export function joinPath(dir, leaf) {
  if (!leaf) return dir;
  if (!dir) return leaf;
  const slash = dir.includes("\\") ? "\\" : "/";
  return `${dir.replace(/[\\/]$/, "")}${slash}${leaf}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function pathLeaf(value) {
  const parts = String(value).split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] || "";
}

/**
 * @param {string} value
 * @returns {string}
 */
export function pathParent(value) {
  const slash = String(value).includes("\\") ? "\\" : "/";
  const parts = String(value).split(/[/\\]/).filter(Boolean);
  if (parts.length < 2) return "";
  const root = String(value).startsWith(slash) ? slash : "";
  return `${root}${parts.slice(0, -1).join(slash)}`;
}

/**
 * Short label for the folder being browsed. The user directory reads as `~`.
 * @param {string} dir
 * @param {string} [label]
 * @returns {string}
 */
export function folderDirectoryLabel(dir, label = "") {
  if (label) return label;
  const normalized = String(dir || "").replace(/\\/g, "/");
  if (!normalized) return "~/Projects";
  if (/^\/(?:Users|home)\/[^/]+$/.test(normalized)) return "~";
  if (/^\/(?:Users|home)\/[^/]+\/Projects$/.test(normalized)) return "~/Projects";
  const home = normalized.match(/^\/(?:Users|home)\/[^/]+/);
  if (home && normalized.startsWith(`${home[0]}/`)) return `~${normalized.slice(home[0].length)}`;
  return dir;
}

/**
 * The user's Projects directory stays first. Known projects stay ahead of other folders.
 * @param {{ name: string, project?: boolean }[]} entries
 * @param {string[]} [projectFolders]
 * @returns {typeof entries}
 */
export function orderFolderEntries(entries, projectFolders = []) {
  const known = new Set(projectFolders);
  /** @type {typeof entries} */
  const top = [];
  /** @type {typeof entries} */
  const projects = [];
  /** @type {typeof entries} */
  const rest = [];
  for (const entry of entries) {
    if (entry.name === "Projects") top.push(entry);
    else if (entry.project || known.has(entry.name)) projects.push(entry);
    else rest.push(entry);
  }
  return [...top, ...projects, ...rest];
}

/**
 * Planning needs a selected project, or a name the user has typed.
 * @param {object} input
 * @param {{ id?: string } | null | undefined} input.project
 * @param {unknown[]} [input.projects]
 * @param {string} [input.name]
 * @returns {{ ok: true, projectName?: string } | { ok: false, message: string }}
 */
export function planNeedsProject(input) {
  if (input.project?.id) return { ok: true };
  const given = (input.name ?? "").trim();
  if (given) return { ok: true, projectName: given };
  if ((input.projects ?? []).length) {
    return { ok: false, message: "Choose a project, or name one, before planning." };
  }
  return { ok: false, message: "Name a project before planning." };
}
