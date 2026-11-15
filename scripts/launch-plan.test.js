import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  browserOpen,
  isNodeNewEnough,
  launchSteps,
  needsRuntimeInstall,
  nodeDownload,
  npmBin,
  packageInstalled,
  parseNodeVersion,
  readPinnedNodeVersion,
  seatPackagesInstalled,
} from "./launch-plan.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("pinned Node is 26 and has a mac arm64 archive", () => {
  const version = readPinnedNodeVersion(root);
  assert.equal(parseNodeVersion(version)[0], 26);
  assert.equal(isNodeNewEnough(version), true);
  assert.equal(isNodeNewEnough("v18.20.0"), false);
  const asset = nodeDownload(version, "darwin", "arm64");
  assert.ok(asset);
  assert.match(asset.url, new RegExp(`node-${version}-darwin-arm64.tar.gz$`));
  assert.equal(nodeDownload(version, "win32", "ia32"), null);
});

test("launch skips setup when Studio is already running", () => {
  assert.deepEqual(launchSteps({ healthy: true, installed: false, built: false }), ["open"]);
  assert.deepEqual(launchSteps({ healthy: false, installed: false, built: false }), [
    "install",
    "build",
    "start",
    "open",
  ]);
  assert.deepEqual(launchSteps({ healthy: false, installed: true, built: true }), ["start", "open"]);
});

test("installs Node 26 when it or npm is missing", () => {
  const pinned = "v26.13.1";
  assert.equal(needsRuntimeInstall({ nodeVersion: "", npmOk: false, pinned }), true);
  assert.equal(needsRuntimeInstall({ nodeVersion: "v22.23.5", npmOk: true, pinned }), true);
  assert.equal(needsRuntimeInstall({ nodeVersion: "26.13.1", npmOk: false, pinned }), true);
  assert.equal(needsRuntimeInstall({ nodeVersion: "26.12.1", npmOk: true, pinned }), false);
  assert.equal(
    needsRuntimeInstall({ nodeVersion: "26.12.1", npmOk: true, pinned, privateRuntime: true }),
    true,
  );
  assert.equal(
    needsRuntimeInstall({ nodeVersion: "26.13.1", npmOk: true, pinned, privateRuntime: true }),
    false,
  );
});

test("a finished install includes the seat packages", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clay-launch-"));
  assert.equal(seatPackagesInstalled(dir), false);
  for (const name of ["@cursor/sdk", "@github/copilot-sdk", "@openai/codex-sdk", "@cswg/clay-studio"]) {
    const folder = path.join(dir, "node_modules", ...name.split("/"));
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "package.json"), "{}");
    assert.equal(packageInstalled(dir, name), true);
  }
  assert.equal(seatPackagesInstalled(dir), true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("npm sits beside node, and the browser opener matches the OS", () => {
  assert.equal(npmBin("/usr/local/bin/node", "darwin"), "/usr/local/bin/npm");
  assert.match(npmBin("C:/node/node.exe", "win32"), /npm\.cmd$/);
  assert.deepEqual(browserOpen("http://127.0.0.1:8787", "darwin"), {
    command: "open",
    args: ["http://127.0.0.1:8787"],
  });
});
