import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = /^(\d+)\.(\d+)\.(\d+)/;

/**
 * @param {string} value
 * @returns {[number, number, number] | null}
 */
export function parseVersion(value) {
  const match = String(value).trim().match(VERSION);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {-1 | 0 | 1 | null}
 */
export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

/**
 * `^` and `~` ranges only. Anything else is treated as not the production release.
 * @param {string} range
 * @param {string} version
 */
export function rangeIncludes(range, version) {
  const raw = String(range).trim();
  const target = parseVersion(version);
  if (!target) return false;
  const caret = raw.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
  if (caret) {
    const base = `${caret[1]}.${caret[2]}.${caret[3]}`;
    if (compareVersions(version, base) < 0) return false;
    const ceiling = caret[1] === "0" ? `0.${Number(caret[2]) + 1}.0` : `${Number(caret[1]) + 1}.0.0`;
    return compareVersions(version, ceiling) < 0;
  }
  const tilde = raw.match(/^~(\d+)\.(\d+)\.(\d+)$/);
  if (tilde) {
    const base = `${tilde[1]}.${tilde[2]}.${tilde[3]}`;
    if (compareVersions(version, base) < 0) return false;
    return compareVersions(version, `${tilde[1]}.${Number(tilde[2]) + 1}.0`) < 0;
  }
  return Boolean(raw.match(/^(\d+)\.(\d+)\.(\d+)$/)) && compareVersions(raw, version) === 0;
}

/**
 * @param {object} input
 * @param {string} input.name
 * @param {string[]} input.declared
 * @param {string | null} input.installed
 * @param {string | null} input.latest
 * @returns {string | null}
 */
export function dependencyWarning({ name, declared, installed, latest }) {
  if (!latest) return `${name}: the latest production release could not be read.`;
  const blocked = declared.filter((range) => !rangeIncludes(range, latest));
  const order = installed ? compareVersions(installed, latest) : null;
  if (order === 0 && blocked.length === 0) return null;
  const using = installed ? `${name} ${installed}` : `${name} is not installed`;
  const rangeNote = blocked.length ? ` Declared ${blocked.join(", ")} does not include ${latest}.` : "";
  if (order !== null && order > 0) return `${using} is newer than the latest production release ${latest}.${rangeNote}`;
  return `${using}. The latest production release is ${latest}.${rangeNote}`;
}

/**
 * @param {string[]} bundled
 * @param {string | null} installed
 * @returns {string[]}
 */
export function bundleWarnings(bundled, installed) {
  if (!installed) return [];
  return [...new Set(bundled)]
    .filter((version) => version !== installed)
    .map((version) => `Vite is serving React ${version}. Installed React is ${installed}. Restart Vite with --force.`);
}

/**
 * @param {object} manifest
 * @returns {[string, string][]}
 */
export function productionDeps(manifest) {
  const deps = { ...manifest.dependencies, ...manifest.peerDependencies };
  return Object.entries(deps).filter(([name, range]) => {
    if (name.startsWith("@cswg/")) return false;
    if (typeof range !== "string") return false;
    return !range.startsWith("workspace:") && !range.startsWith("file:") && !range.startsWith("link:");
  });
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function manifestPaths(root) {
  const rootManifest = path.join(root, "package.json");
  const manifest = JSON.parse(fs.readFileSync(rootManifest, "utf8"));
  const paths = [rootManifest];
  for (const pattern of manifest.workspaces ?? []) {
    const glob = pattern.endsWith("/*") ? path.join(root, pattern.slice(0, -2)) : null;
    if (glob) {
      if (!fs.existsSync(glob)) continue;
      for (const name of fs.readdirSync(glob)) {
        const file = path.join(glob, name, "package.json");
        if (fs.existsSync(file)) paths.push(file);
      }
      continue;
    }
    const file = path.join(root, pattern, "package.json");
    if (fs.existsSync(file)) paths.push(file);
  }
  return paths;
}

/**
 * @param {string} root
 * @param {string} name
 * @returns {string | null}
 */
export function readInstalled(root, name) {
  const file = path.join(root, "node_modules", ...name.split("/"), "package.json");
  if (!fs.existsSync(file)) return null;
  const version = JSON.parse(fs.readFileSync(file, "utf8")).version;
  return typeof version === "string" ? version : null;
}

/**
 * @param {string} root
 * @returns {Map<string, { declared: string[], installed: string | null }>}
 */
export function collectRecords(root) {
  /** @type {Map<string, { declared: string[], installed: string | null }>} */
  const records = new Map();
  for (const file of manifestPaths(root)) {
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const [name, range] of productionDeps(manifest)) {
      const current = records.get(name) ?? { declared: [], installed: readInstalled(root, name) };
      if (!current.declared.includes(range)) current.declared.push(range);
      records.set(name, current);
    }
  }
  return records;
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function bundledReactVersions(root) {
  const dirs = [path.join(root, "node_modules", ".vite", "deps")];
  const manifestPath = path.join(root, "package.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const pattern of manifest.workspaces ?? []) {
      if (!pattern.endsWith("/*")) continue;
      const dir = path.join(root, pattern.slice(0, -2));
      if (!fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) dirs.push(path.join(dir, name, "node_modules", ".vite", "deps"));
    }
  }
  /** @type {Set<string>} */
  const found = new Set();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".js")) continue;
      const text = fs.readFileSync(path.join(dir, name), "utf8");
      for (const match of text.matchAll(/ReactVersion = "(\d+\.\d+\.\d+)"/g)) found.add(match[1]);
    }
  }
  return [...found];
}

/**
 * The production release is the npm `latest` tag.
 * @param {string} name
 * @param {typeof fetch} [fetchImpl]
 */
export async function latestProduction(name, fetchImpl = globalThis.fetch) {
  const spec = name.startsWith("@") ? `@${name.slice(1).replace("/", "%2f")}` : name;
  const response = await fetchImpl(`https://registry.npmjs.org/${spec}/latest`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`${name} returned ${response.status}`);
  const body = await response.json();
  if (typeof body.version !== "string" || !parseVersion(body.version)) throw new Error(`${name} has no production version`);
  return body.version;
}

/**
 * @param {string} root
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<string[]>}
 */
export async function stackReport(root, fetchImpl = globalThis.fetch) {
  const records = collectRecords(root);
  const names = [...records.keys()];
  const latest = await Promise.all(
    names.map(async (name) => {
      try {
        return [name, await latestProduction(name, fetchImpl)];
      } catch {
        return [name, null];
      }
    }),
  );
  if (names.length > 0 && latest.every(([, version]) => version === null)) {
    return ["The npm registry could not be reached, so production versions were not checked."];
  }
  /** @type {string[]} */
  const lines = [];
  for (const [name, version] of latest) {
    const record = records.get(name);
    const warning = dependencyWarning({
      name,
      declared: record?.declared ?? [],
      installed: record?.installed ?? null,
      latest: version,
    });
    if (warning) lines.push(warning);
  }
  lines.push(...bundleWarnings(bundledReactVersions(root), records.get("react")?.installed ?? readInstalled(root, "react")));
  return lines.sort();
}

/**
 * @param {string[]} lines
 */
export function formatStackReport(lines) {
  if (lines.length === 0) return "Stack check: production dependencies match the latest releases.";
  return ["Stack check: production dependencies are behind the latest releases.", ...lines.map((line) => `- ${line}`)].join("\n");
}

/**
 * @param {string} [root]
 * @returns {Promise<string[]>}
 */
export async function warnStack(root = projectRoot()) {
  try {
    const lines = await stackReport(root);
    const text = formatStackReport(lines);
    (lines.length === 0 ? process.stdout : process.stderr).write(`${text}\n`);
    return lines;
  } catch (error) {
    process.stderr.write(`Stack check failed: ${error instanceof Error ? error.message : "unknown"}\n`);
    return [];
  }
}

/** @returns {string} */
export function projectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) warnStack();
