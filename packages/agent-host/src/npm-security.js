import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { makeEvent } from "./events.js";

/**
 * @typedef {object} FixRelease
 * @property {string} name
 * @property {string} version
 * @property {boolean} [isSemVerMajor]
 */

/**
 * @typedef {object} Advisory
 * @property {string} name
 * @property {string} severity
 * @property {string} title
 * @property {string} url
 * @property {true | FixRelease | null} fixAvailable
 */

/**
 * @typedef {object} Upgrade
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef {object} SecurityReport
 * @property {Upgrade[]} upgrades
 * @property {Advisory[]} remaining
 * @property {Advisory[]} blocking
 * @property {boolean} needsRepair
 * @property {string} error
 * @property {string} repairPrompt
 */

/**
 * @typedef {object} NpmResult
 * @property {number | null} code
 * @property {string} stdout
 * @property {string} stderr
 */

const SECURITY_COMMANDS = new Set(["build", "fix"]);

/**
 * @param {string} command
 * @returns {boolean}
 */
export function needsSecurityPass(command) {
  return SECURITY_COMMANDS.has(command);
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
 * @returns {unknown}
 */
export function parseAuditJson(stdout) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) return {};
  return JSON.parse(stdout.slice(start, end + 1));
}

/**
 * @param {unknown} report
 * @returns {Advisory[]}
 */
export function advisoriesFromAudit(report) {
  const record = report && typeof report === "object" ? /** @type {Record<string, unknown>} */ (report) : {};
  const vulnerabilities = record.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") return [];
  return Object.values(vulnerabilities).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const info = /** @type {Record<string, unknown>} */ (entry);
    const via = Array.isArray(info.via) ? info.via.find((item) => item && typeof item === "object") : null;
    const source = via && typeof via === "object" ? /** @type {Record<string, unknown>} */ (via) : {};
    const name = String(info.name ?? source.name ?? "");
    if (!name) return [];
    return [
      {
        name,
        severity: String(info.severity ?? source.severity ?? "low"),
        title: String(source.title ?? info.name ?? "Open advisory"),
        url: source.url ? String(source.url) : "",
        fixAvailable: normalizeFix(info.fixAvailable),
      },
    ];
  });
}

/**
 * @param {unknown} value
 * @returns {true | FixRelease | null}
 */
function normalizeFix(value) {
  if (value === true) return true;
  if (!value || typeof value !== "object") return null;
  const fix = /** @type {Record<string, unknown>} */ (value);
  if (!fix.name || !fix.version) return null;
  return {
    name: String(fix.name),
    version: String(fix.version),
    isSemVerMajor: Boolean(fix.isSemVerMajor),
  };
}

/**
 * @param {Record<string, string>} dependencies
 * @param {Record<string, { version?: string }>} packages
 * @returns {Record<string, string>}
 */
export function installedDirectVersions(dependencies, packages) {
  /** @type {Record<string, string>} */
  const versions = {};
  for (const [name, range] of Object.entries(dependencies)) {
    versions[name] = packages[`node_modules/${name}`]?.version || String(range);
  }
  return versions;
}

/**
 * Newer patched releases for direct dependencies. An older suggested release is ignored.
 * @param {Advisory[]} advisories
 * @param {Record<string, string>} installedByName
 * @returns {Upgrade[]}
 */
export function upgradesFor(advisories, installedByName) {
  /** @type {Map<string, string>} */
  const chosen = new Map();
  for (const advisory of advisories) {
    const fix = advisory.fixAvailable;
    if (!fix || fix === true) continue;
    const installed = installedByName[fix.name];
    if (!installed || !isNewerVersion(fix.version, installed)) continue;
    const already = chosen.get(fix.name);
    if (!already || isNewerVersion(fix.version, already)) chosen.set(fix.name, fix.version);
  }
  return [...chosen.entries()].map(([name, version]) => ({ name, version }));
}

/**
 * High and critical advisories that still have a newer fix, or a same-range fix npm did not apply.
 * @param {Advisory[]} advisories
 * @param {Record<string, string>} installedByName
 * @returns {Advisory[]}
 */
export function blockingAdvisories(advisories, installedByName) {
  return advisories.filter((advisory) => {
    if (advisory.severity !== "high" && advisory.severity !== "critical") return false;
    const fix = advisory.fixAvailable;
    if (fix === true) return true;
    if (!fix) return false;
    const installed = installedByName[fix.name];
    return Boolean(installed && isNewerVersion(fix.version, installed));
  });
}

/**
 * @param {SecurityReport} report
 * @returns {string}
 */
export function securitySummary(report) {
  if (report.error) return `npm security check did not finish. ${report.error}`;
  const lines = [];
  if (report.upgrades.length) {
    lines.push(`Patched releases installed: ${report.upgrades.map((item) => `${item.name}@${item.version}`).join(", ")}.`);
  }
  if (!report.remaining.length) lines.push("npm audit has no open advisories.");
  else {
    lines.push(`Open npm advisories:\n${report.remaining.map((item) => `${item.severity} ${item.name}: ${item.title}`).join("\n")}`);
  }
  const downgrade = report.remaining.some((item) => item.fixAvailable && item.fixAvailable !== true);
  if (downgrade && !report.blocking.length) {
    lines.push("Clay did not downgrade a package to clear an advisory.");
  }
  return lines.join("\n");
}

/**
 * @param {SecurityReport} report
 * @returns {string}
 */
export function repairPrompt(report) {
  const upgrades = report.upgrades.map((item) => `${item.name}@${item.version}`).join(", ");
  const blocking = report.blocking.map((item) => `${item.severity} ${item.name}: ${item.title}`).join("\n");
  return [
    "Clay checked npm audit. Fix open security issues before this change is done.",
    upgrades ? `These patched releases are now installed: ${upgrades}. Make the app work on them.` : "",
    "Do not downgrade a package to clear an advisory.",
    blocking ? `These high or critical advisories still have a newer fix:\n${blocking}` : "",
    "Leave the tests passing.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<NpmResult>}
 */
function runNpm(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
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
 * @param {NpmResult} result
 * @param {boolean} allowAuditStatus
 * @returns {boolean}
 */
function commandFailed(result, allowAuditStatus) {
  if (result.code === 0) return false;
  if (allowAuditStatus && result.code === 1) return false;
  return true;
}

/**
 * @param {NpmResult} result
 * @returns {SecurityReport}
 */
function failedReport(result) {
  const detail = `${result.stderr || result.stdout || ""}`.trim().split("\n").slice(-4).join(" ");
  const report = emptyReport();
  report.error = detail || `npm exited ${result.code ?? "signal"}`;
  return report;
}

/**
 * @returns {SecurityReport}
 */
function emptyReport() {
  /** @type {SecurityReport} */
  const report = {
    upgrades: [],
    remaining: [],
    blocking: [],
    needsRepair: false,
    error: "",
    repairPrompt: "",
  };
  report.repairPrompt = repairPrompt(report);
  return report;
}

/**
 * @param {string} appDir
 * @returns {Promise<string>}
 */
async function dependencyToken(appDir) {
  const pkgTime = (await fs.stat(path.join(appDir, "package.json"))).mtimeMs;
  const lockTime = await fs.stat(path.join(appDir, "package-lock.json")).then((info) => info.mtimeMs).catch(() => 0);
  return `${pkgTime}:${lockTime}`;
}

/**
 * @param {string} appDir
 * @param {string} token
 * @returns {Promise<SecurityReport | null>}
 */
async function readStamp(appDir, token) {
  try {
    const raw = await fs.readFile(path.join(appDir, ".clay", "npm-security.json"), "utf8");
    const stamp = JSON.parse(raw);
    if (stamp.token !== token || !Array.isArray(stamp.remaining)) return null;
    const report = emptyReport();
    report.remaining = stamp.remaining;
    report.repairPrompt = repairPrompt(report);
    return report;
  } catch {
    return null;
  }
}

/**
 * @param {string} appDir
 * @param {string} token
 * @param {Advisory[]} remaining
 */
async function writeStamp(appDir, token, remaining) {
  const dir = path.join(appDir, ".clay");
  await fs.mkdir(dir, { recursive: true });
  const body = {
    token,
    remaining: remaining.map((item) => ({
      name: item.name,
      severity: item.severity,
      title: item.title,
      url: item.url,
      fixAvailable: item.fixAvailable,
    })),
  };
  await fs.writeFile(path.join(dir, "npm-security.json"), JSON.stringify(body, null, 2), "utf8");
}

/**
 * @param {string} file
 * @returns {Promise<Record<string, unknown>>}
 */
async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

/**
 * @param {Record<string, unknown>} pkg
 * @param {Record<string, unknown>} lock
 * @returns {Record<string, string>}
 */
function versionsFrom(pkg, lock) {
  const dependencies = {
    ...asRecord(pkg.dependencies),
    ...asRecord(pkg.devDependencies),
  };
  const packages = asRecord(lock.packages);
  /** @type {Record<string, string>} */
  const ranges = {};
  for (const [name, range] of Object.entries(dependencies)) ranges[name] = String(range);
  /** @type {Record<string, { version?: string }>} */
  const locked = {};
  for (const [name, value] of Object.entries(packages)) {
    if (value && typeof value === "object" && "version" in value) {
      locked[name] = { version: String(/** @type {{ version?: unknown }} */ (value).version ?? "") };
    }
  }
  return installedDirectVersions(ranges, locked);
}

/**
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * Apply safe npm audit fixes, then upgrade direct dependencies to a newer patched release.
 * A suggested downgrade is left in place and does not block the build.
 * @param {string} appDir
 * @param {object} [options]
 * @param {boolean} [options.force]
 * @param {(args: string[], cwd: string) => Promise<NpmResult>} [options.run]
 * @returns {Promise<SecurityReport>}
 */
export async function settleNpmSecurity(appDir, options = {}) {
  const run = options.run ?? runNpm;
  try {
    await fs.access(path.join(appDir, "package.json"));
  } catch {
    return emptyReport();
  }
  try {
    if (!options.force) {
      const cached = await readStamp(appDir, await dependencyToken(appDir));
      if (cached) return cached;
    }
    const fix = await run(["audit", "fix"], appDir);
    if (commandFailed(fix, true)) return failedReport(fix);
    const audit = await run(["audit", "--json"], appDir);
    if (commandFailed(audit, true)) return failedReport(audit);
    let pkg = await readJson(path.join(appDir, "package.json"));
    let lock = await readJson(path.join(appDir, "package-lock.json")).catch(() => ({}));
    let installed = versionsFrom(pkg, lock);
    let advisories = advisoriesFromAudit(parseAuditJson(audit.stdout));
    const upgrades = upgradesFor(advisories, installed);
    for (const upgrade of upgrades) {
      const installedPkg = await run(["install", `${upgrade.name}@${upgrade.version}`], appDir);
      if (commandFailed(installedPkg, false)) return failedReport(installedPkg);
    }
    if (upgrades.length) {
      pkg = await readJson(path.join(appDir, "package.json"));
      lock = await readJson(path.join(appDir, "package-lock.json")).catch(() => ({}));
      installed = versionsFrom(pkg, lock);
      const again = await run(["audit", "--json"], appDir);
      if (commandFailed(again, true)) return failedReport(again);
      advisories = advisoriesFromAudit(parseAuditJson(again.stdout));
    }
    const report = emptyReport();
    report.upgrades = upgrades;
    report.remaining = advisories;
    report.blocking = blockingAdvisories(advisories, installed);
    report.needsRepair = upgrades.length > 0 || report.blocking.length > 0;
    report.repairPrompt = repairPrompt(report);
    if (!report.blocking.length) await writeStamp(appDir, await dependencyToken(appDir), advisories);
    return report;
  } catch (error) {
    const report = emptyReport();
    report.error = error instanceof Error ? error.message : "npm security check failed.";
    return report;
  }
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.runId
 * @param {string} input.agentId
 * @param {(prompt: string) => AsyncIterable<import("./events.js").UiEvent>} [input.repair]
 * @param {(args: string[], cwd: string) => Promise<NpmResult>} [input.run]
 */
export async function* secureAfterRun({ appDir, runId, agentId, repair, run }) {
  yield makeEvent("step", {
    step: { label: "Checking npm security", status: "running" },
    runId,
    agentId,
  });
  let report = await settleNpmSecurity(appDir, { run });
  if (report.needsRepair && repair) {
    yield makeEvent("step", {
      step: { label: "Fixing open npm security issues", status: "running" },
      runId,
      agentId,
    });
    yield* repair(report.repairPrompt);
    report = await settleNpmSecurity(appDir, { force: true, run });
  }
  const text = securitySummary(report);
  yield makeEvent("assistant_text", { text, runId, agentId });
  if (report.error || report.blocking.length) {
    yield makeEvent("error", { text, runId, agentId, status: "error" });
    yield makeEvent("run_finished", { runId, agentId, status: "error" });
    return;
  }
  yield makeEvent("step", {
    step: { label: "Checking npm security", status: "done" },
    runId,
    agentId,
  });
  yield makeEvent("run_finished", { runId, agentId, status: "finished" });
}
