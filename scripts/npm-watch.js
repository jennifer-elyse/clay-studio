import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

/** Twelve hours. A running app checks again when this interval has passed. */
export const NPM_WATCH_MS = 12 * 60 * 60 * 1000;

/**
 * @param {string | undefined} checkedAt
 * @param {number} now
 * @param {number} [intervalMs]
 * @returns {boolean}
 */
export function watchIsDue(checkedAt, now, intervalMs = NPM_WATCH_MS) {
  if (!checkedAt) return true;
  const then = Date.parse(checkedAt);
  if (Number.isNaN(then)) return true;
  return now - then >= intervalMs;
}

/**
 * @param {string} value
 * @returns {[number, number, number] | null}
 */
export function parseVersion(value) {
  const match = String(value).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {string} candidate
 * @param {string} current
 * @returns {boolean}
 */
export function isNewerVersion(candidate, current) {
  const next = parseVersion(candidate);
  const prev = parseVersion(current);
  if (!next || !prev) return false;
  for (let index = 0; index < 3; index += 1) {
    if (next[index] > prev[index]) return true;
    if (next[index] < prev[index]) return false;
  }
  return false;
}

/**
 * @param {string} stdout
 * @param {Record<string, string>} installed
 * @returns {Array<{ name: string, version: string }>}
 */
export function upgradesFromAudit(stdout, installed) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return [];
  const report = JSON.parse(stdout.slice(start, end + 1));
  const vulnerabilities = report?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") return [];
  /** @type {Map<string, string>} */
  const chosen = new Map();
  for (const entry of Object.values(vulnerabilities)) {
    if (!entry || typeof entry !== "object") continue;
    const fix = /** @type {{ fixAvailable?: { name?: string, version?: string } }} */ (entry).fixAvailable;
    if (!fix?.name || !fix.version) continue;
    const current = installed[fix.name];
    if (!current || !isNewerVersion(fix.version, current)) continue;
    const already = chosen.get(fix.name);
    if (!already || isNewerVersion(fix.version, already)) chosen.set(fix.name, fix.version);
  }
  return [...chosen.entries()].map(([name, version]) => ({ name, version }));
}

/**
 * @param {string} root
 * @returns {Promise<{ checkedAt?: string } | null>}
 */
async function readStamp(root) {
  try {
    const raw = await fs.readFile(path.join(root, ".clay", "npm-watch.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.checkedAt !== "string") return null;
    return { checkedAt: parsed.checkedAt };
  } catch {
    return null;
  }
}

/**
 * @param {string} root
 * @param {string} checkedAt
 */
async function writeStamp(root, checkedAt) {
  const dir = path.join(root, ".clay");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "npm-watch.json"), JSON.stringify({ checkedAt }, null, 2), "utf8");
}

/**
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string }>}
 */
function runNpm(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
}

/**
 * @param {{ code: number | null }} result
 * @param {boolean} allowAuditStatus
 * @returns {boolean}
 */
function commandFailed(result, allowAuditStatus) {
  if (result.code === 0) return false;
  if (allowAuditStatus && result.code === 1) return false;
  return true;
}

/**
 * @param {string} root
 * @returns {Promise<Record<string, string>>}
 */
async function installedDirect(root) {
  const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  let packages = {};
  try {
    const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
    packages = lock.packages ?? {};
  } catch {
    packages = {};
  }
  /** @type {Record<string, string>} */
  const versions = {};
  for (const [name, range] of Object.entries(dependencies)) {
    const locked = packages[`node_modules/${name}`];
    versions[name] = locked?.version || String(range);
  }
  return versions;
}

/**
 * Apply safe audit fixes, then install a newer patched release. A downgrade is refused.
 * @param {string} root
 * @param {(args: string[], cwd: string) => Promise<{ code: number | null, stdout: string, stderr: string }>} [run]
 */
export async function settleNpmPackages(root, run = runNpm) {
  const fix = await run(["audit", "fix"], root);
  if (commandFailed(fix, true)) {
    const detail = `${fix.stderr || fix.stdout || ""}`.trim().split("\n").slice(-2).join(" ");
    return { upgrades: [], error: detail || `npm exited ${fix.code ?? "signal"}` };
  }
  const audit = await run(["audit", "--json"], root);
  if (commandFailed(audit, true)) {
    const detail = `${audit.stderr || audit.stdout || ""}`.trim().split("\n").slice(-2).join(" ");
    return { upgrades: [], error: detail || `npm exited ${audit.code ?? "signal"}` };
  }
  const installed = await installedDirect(root);
  const upgrades = upgradesFromAudit(audit.stdout, installed);
  for (const upgrade of upgrades) {
    const installedPkg = await run(["install", `${upgrade.name}@${upgrade.version}`], root);
    if (commandFailed(installedPkg, false)) {
      const detail = `${installedPkg.stderr || installedPkg.stdout || ""}`.trim().split("\n").slice(-2).join(" ");
      return { upgrades: [], error: detail || `npm exited ${installedPkg.code ?? "signal"}` };
    }
  }
  return { upgrades, error: "" };
}

/**
 * @param {string} root
 * @param {object} [options]
 * @param {number} [options.now]
 * @param {boolean} [options.force]
 * @param {number} [options.intervalMs]
 * @param {(root: string) => Promise<{ upgrades: Array<{ name: string, version: string }>, error: string }>} [options.settle]
 * @returns {Promise<{ ran: boolean, checkedAt: string, upgrades: Array<{ name: string, version: string }>, error: string }>}
 */
export async function runNpmWatch(root, options = {}) {
  const now = options.now ?? Date.now();
  const stamp = await readStamp(root);
  if (!options.force && !watchIsDue(stamp?.checkedAt, now, options.intervalMs)) {
    return { ran: false, checkedAt: stamp?.checkedAt ?? "", upgrades: [], error: "" };
  }
  const report = await (options.settle ?? ((dir) => settleNpmPackages(dir)))(root);
  if (report.error) return { ran: true, checkedAt: "", upgrades: [], error: report.error };
  const checkedAt = new Date(now).toISOString();
  await writeStamp(root, checkedAt);
  return { ran: true, checkedAt, upgrades: report.upgrades, error: "" };
}

/**
 * Check on startup when the last check is at least 12 hours old, then every 12 hours.
 * @param {string} root
 * @param {Parameters<typeof runNpmWatch>[1]} [options]
 * @returns {() => void}
 */
export function startNpmWatch(root, options = {}) {
  let pending = false;
  const run = () => {
    if (pending) return;
    pending = true;
    runNpmWatch(root, options)
      .then((result) => {
        if (result.error) process.stderr.write(`npm watch: ${result.error}\n`);
        else if (result.ran) {
          const patched = result.upgrades.length
            ? ` Patched ${result.upgrades.map((item) => `${item.name}@${item.version}`).join(", ")}.`
            : "";
          process.stdout.write(`npm watch: checked.${patched}\n`);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "npm watch failed";
        process.stderr.write(`npm watch: ${message}\n`);
      })
      .finally(() => {
        pending = false;
      });
  };
  run();
  const timer = setInterval(run, options.intervalMs ?? NPM_WATCH_MS);
  timer.unref();
  return () => clearInterval(timer);
}
