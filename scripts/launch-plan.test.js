import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  browserOpen,
  isNodeNewEnough,
  launchSteps,
  needsRuntimeInstall,
  nodeDownload,
  npmBin,
  parseNodeVersion,
  readPinnedNodeVersion,
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

test("npm sits beside node, and the browser opener matches the OS", () => {
  assert.equal(npmBin("/usr/local/bin/node", "darwin"), "/usr/local/bin/npm");
  assert.match(npmBin("C:/node/node.exe", "win32"), /npm\.cmd$/);
  assert.deepEqual(browserOpen("http://127.0.0.1:8787", "darwin"), {
    command: "open",
    args: ["http://127.0.0.1:8787"],
  });
});
