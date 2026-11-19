import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { NPM_WATCH_MS, isNewerVersion, runNpmWatch, settleNpmPackages, upgradesFromAudit, watchIsDue } from "./npm-watch.js";

const hour = 60 * 60 * 1000;

test("a check is due every 12 hours", () => {
  const now = Date.parse("2026-11-19T12:00:00.000Z");
  assert.equal(NPM_WATCH_MS, 12 * hour);
  assert.equal(watchIsDue(undefined, now), true);
  assert.equal(watchIsDue("not-a-date", now), true);
  assert.equal(watchIsDue(new Date(now - 12 * hour + 1).toISOString(), now), false);
  assert.equal(watchIsDue(new Date(now - 12 * hour).toISOString(), now), true);
});

test("a suggested downgrade is not an upgrade", () => {
  assert.equal(isNewerVersion("4.6.7", "3.24.2"), true);
  assert.equal(isNewerVersion("25.1.0", "29.7.0"), false);
  const audit = JSON.stringify({
    vulnerabilities: {
      zod: { fixAvailable: { name: "zod", version: "4.6.7" } },
      jest: { fixAvailable: { name: "jest", version: "25.1.0" } },
    },
  });
  assert.deepEqual(upgradesFromAudit(audit, { zod: "3.24.2", jest: "29.7.0" }), [{ name: "zod", version: "4.6.7" }]);
});

test("a fresh tree audits and a recent stamp waits", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "clay-watch-"));
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ dependencies: { zod: "^3.24.2" } }),
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "package-lock.json"),
    JSON.stringify({ packages: { "node_modules/zod": { version: "3.24.2" } } }),
    "utf8",
  );
  const calls = [];
  const now = Date.parse("2026-11-19T12:00:00.000Z");
  const first = await runNpmWatch(root, {
    now,
    settle: async () => {
      calls.push("settle");
      return { upgrades: [{ name: "zod", version: "4.6.7" }], error: "" };
    },
  });
  assert.equal(first.ran, true);
  assert.deepEqual(first.upgrades, [{ name: "zod", version: "4.6.7" }]);
  const second = await runNpmWatch(root, {
    now: now + hour,
    settle: async () => {
      calls.push("again");
      return { upgrades: [], error: "" };
    },
  });
  assert.equal(second.ran, false);
  assert.deepEqual(calls, ["settle"]);
  const failed = await fs.mkdtemp(path.join(os.tmpdir(), "clay-watch-fail-"));
  const broken = await runNpmWatch(failed, {
    now,
    settle: async () => ({ upgrades: [], error: "registry offline" }),
  });
  assert.equal(broken.error, "registry offline");
  const stamp = await fs.readFile(path.join(failed, ".clay", "npm-watch.json"), "utf8").catch(() => "");
  assert.equal(stamp, "");
});

test("settle installs a newer patch and refuses a downgrade", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "clay-settle-"));
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ dependencies: { zod: "^3.24.2" }, devDependencies: { jest: "^29.7.0" } }),
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "package-lock.json"),
    JSON.stringify({
      packages: {
        "node_modules/zod": { version: "3.24.2" },
        "node_modules/jest": { version: "29.7.0" },
      },
    }),
    "utf8",
  );
  const calls = [];
  const body = {
    vulnerabilities: {
      zod: { fixAvailable: { name: "zod", version: "4.6.7" } },
      jest: { fixAvailable: { name: "jest", version: "25.1.0" } },
    },
  };
  const report = await settleNpmPackages(root, async (args) => {
    calls.push(args.join(" "));
    if (args[1] === "--json") return { code: 1, stdout: JSON.stringify(body), stderr: "" };
    return { code: 0, stdout: "", stderr: "" };
  });
  assert.deepEqual(calls, ["audit fix", "audit --json", "install zod@4.6.7"]);
  assert.deepEqual(report.upgrades, [{ name: "zod", version: "4.6.7" }]);
});

test("the generated app uses the same npm watch", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const studio = await fs.readFile(path.join(here, "npm-watch.js"), "utf8");
  const template = await fs.readFile(path.join(here, "../templates/web-app/scripts/npm-watch.js"), "utf8");
  assert.equal(template, studio);
});
