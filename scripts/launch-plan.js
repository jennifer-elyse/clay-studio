import fs from "node:fs";
import path from "node:path";

export const MIN_NODE_MAJOR = 20;

/**
 * @param {string} root
 */
export function readPinnedNodeVersion(root) {
  return fs.readFileSync(path.join(root, "scripts", "node-version.txt"), "utf8").trim();
}

/**
 * @param {string} raw
 * @returns {[number, number, number]}
 */
export function parseNodeVersion(raw) {
  const match = String(raw).trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {string} raw
 */
export function isNodeNewEnough(raw) {
  return parseNodeVersion(raw)[0] >= MIN_NODE_MAJOR;
}

/**
 * Clay Studio runs on the pinned Node.js major. The official archive includes npm.
 * The private runtime must match the pinned patch. Another install of that major is fine when npm sits beside node.
 * @param {{ nodeVersion: string, npmOk: boolean, pinned: string, privateRuntime?: boolean }} input
 */
export function needsRuntimeInstall(input) {
  if (!input.npmOk) return true;
  const node = parseNodeVersion(input.nodeVersion);
  const pinned = parseNodeVersion(input.pinned);
  if (input.privateRuntime) return node[0] !== pinned[0] || node[1] !== pinned[1] || node[2] !== pinned[2];
  return node[0] !== pinned[0];
}

/**
 * Official Node.js binary for a private runtime folder.
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @returns {{ name: string, url: string, archive: string } | null}
 */
export function nodeDownload(version, platform, arch) {
  const os = platform === "darwin" ? "darwin" : platform === "linux" ? "linux" : platform === "win32" ? "win" : null;
  const cpu = arch === "arm64" || arch === "aarch64" ? "arm64" : arch === "x64" || arch === "x86_64" ? "x64" : null;
  if (!os || !cpu) return null;
  const archive = os === "win" ? "zip" : "tar.gz";
  const name = `node-${version}-${os}-${cpu}`;
  return {
    name,
    archive,
    url: `https://nodejs.org/dist/${version}/${name}.${archive}`,
  };
}

/**
 * @param {object} state
 * @param {boolean} state.healthy
 * @param {boolean} state.installed
 * @param {boolean} state.built
 * @returns {Array<"open" | "install" | "build" | "start">}
 */
export function launchSteps(state) {
  if (state.healthy) return ["open"];
  /** @type {Array<"open" | "install" | "build" | "start">} */
  const steps = [];
  if (!state.installed) steps.push("install");
  if (!state.built) steps.push("build");
  steps.push("start", "open");
  return steps;
}

/**
 * @param {string} nodePath
 * @param {string} platform
 */
export function npmBin(nodePath, platform) {
  const dir = path.dirname(nodePath);
  return platform === "win32" ? path.join(dir, "npm.cmd") : path.join(dir, "npm");
}

/**
 * @param {string} url
 * @param {string} platform
 * @returns {{ command: string, args: string[] }}
 */
export function browserOpen(url, platform) {
  if (platform === "darwin") return { command: "open", args: [url] };
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", "", url] };
  return { command: "xdg-open", args: [url] };
}

export const STUDIO_URL = "http://127.0.0.1:8787";
