import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bundledReactVersions,
  bundleWarnings,
  collectRecords,
  dependencyWarning,
  formatStackReport,
  productionDeps,
  rangeIncludes,
  stackReport,
} from "./stack-versions.js";

const here = path.dirname(fileURLToPath(import.meta.url));

test("caret ranges stay inside the same major, except 0.x", () => {
  assert.equal(rangeIncludes("^19.3.1", "19.3.1"), true);
  assert.equal(rangeIncludes("^19.3.1", "19.4.0"), true);
  assert.equal(rangeIncludes("^19.3.1", "20.0.0"), false);
  assert.equal(rangeIncludes("^4.21.2", "5.3.0"), false);
  assert.equal(rangeIncludes("~8.18.0", "8.18.9"), true);
  assert.equal(rangeIncludes("~8.18.0", "8.19.0"), false);
  assert.equal(rangeIncludes(">=1.0.0", "1.2.0"), false);
});

test("a matching production release is silent", () => {
  assert.equal(
    dependencyWarning({ name: "react", declared: ["^19.3.1"], installed: "19.3.1", latest: "19.3.1" }),
    null,
  );
});

test("an older release and a range that excludes it are both named", () => {
  const warning = dependencyWarning({
    name: "express",
    declared: ["^4.21.2"],
    installed: "4.22.3",
    latest: "5.3.0",
  });
  assert.match(warning, /express 4\.22\.3/);
  assert.match(warning, /5\.3\.0/);
  assert.match(warning, /\^4\.21\.2/);
});

test("a Vite prebundle on an older React is a warning", () => {
  assert.deepEqual(bundleWarnings(["18.3.1"], "19.3.1"), [
    "Vite is serving React 18.3.1. Installed React is 19.3.1. Restart Vite with --force.",
  ]);
  assert.deepEqual(bundleWarnings(["19.3.1"], "19.3.1"), []);
});

test("workspace packages and dev dependencies are not production", () => {
  const deps = productionDeps({
    dependencies: { express: "^4.21.2", "@cswg/agent-host": "0.1.0" },
    peerDependencies: { react: "^19.3.1" },
    devDependencies: { vite: "^6.0.3" },
  });
  assert.deepEqual(deps, [
    ["express", "^4.21.2"],
    ["react", "^19.3.1"],
  ]);
});

test("installed versions come from the project root", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "clay-stack-"));
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      workspaces: ["apps/*"],
      dependencies: { express: "workspace:skip" },
    }),
  );
  fs.mkdirSync(path.join(root, "apps", "studio"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "apps", "studio", "package.json"),
    JSON.stringify({ dependencies: { express: "^4.21.2", "@cswg/clay-chat": "0.1.0" } }),
  );
  fs.mkdirSync(path.join(root, "node_modules", "express"), { recursive: true });
  fs.writeFileSync(path.join(root, "node_modules", "express", "package.json"), JSON.stringify({ version: "4.22.3" }));
  fs.mkdirSync(path.join(root, "apps", "studio", "node_modules", ".vite", "deps"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "apps", "studio", "node_modules", ".vite", "deps", "react.js"),
    'var ReactVersion = "18.3.1";',
  );
  const records = collectRecords(root);
  assert.equal(records.get("express")?.installed, "4.22.3");
  assert.equal(records.has("@cswg/clay-chat"), false);
  assert.deepEqual(bundledReactVersions(root), ["18.3.1"]);
  fs.rmSync(root, { recursive: true, force: true });
});

test("a dead registry warns once instead of failing", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "clay-stack-"));
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { react: "^19.3.1" } }));
  const lines = await stackReport(root, async () => {
    throw new Error("offline");
  });
  assert.deepEqual(lines, ["The npm registry could not be reached, so production versions were not checked."]);
  assert.match(formatStackReport(lines), /behind the latest releases/);
  fs.rmSync(root, { recursive: true, force: true });
});

test("the generated app uses the same stack check", () => {
  const studio = fs.readFileSync(path.join(here, "stack-versions.js"), "utf8");
  const template = fs.readFileSync(path.join(here, "../templates/web-app/scripts/stack-versions.js"), "utf8");
  assert.equal(template, studio);
});
