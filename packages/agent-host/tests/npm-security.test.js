import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  advisoriesFromAudit,
  blockingAdvisories,
  isNewerVersion,
  parseAuditJson,
  settleNpmSecurity,
  upgradesFor,
} from "../src/npm-security.js";

const audit = {
  vulnerabilities: {
    zod: {
      name: "zod",
      severity: "high",
      via: [{ title: "Zod can exhaust memory", url: "https://example.test/zod", severity: "high" }],
      fixAvailable: { name: "zod", version: "4.6.7", isSemVerMajor: true },
    },
    jest: {
      name: "jest",
      severity: "low",
      via: [{ title: "deepmerge prototype note", severity: "low" }],
      fixAvailable: { name: "jest", version: "25.1.0", isSemVerMajor: true },
    },
  },
};

describe("npm security", () => {
  test("upgrades to a newer patched release and refuses a downgrade", () => {
    expect(isNewerVersion("4.6.7", "^3.24.2")).toBe(true);
    expect(isNewerVersion("25.1.0", "29.7.0")).toBe(false);
    const advisories = advisoriesFromAudit(audit);
    const installed = { zod: "3.24.2", jest: "29.7.0" };
    expect(upgradesFor(advisories, installed)).toEqual([{ name: "zod", version: "4.6.7" }]);
    expect(blockingAdvisories(advisories, installed).map((item) => item.name)).toEqual(["zod"]);
    expect(blockingAdvisories(advisories, { zod: "4.6.7", jest: "29.7.0" })).toEqual([]);
  });

  test("parses an audit document that starts with a warning line", () => {
    const parsed = parseAuditJson(`npm warn example\n${JSON.stringify(audit)}\n`);
    expect(advisoriesFromAudit(parsed)).toHaveLength(2);
  });

  test("installs the patched direct dependency and does not downgrade", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-audit-"));
    await fs.writeFile(
      path.join(appDir, "package.json"),
      JSON.stringify({
        dependencies: { zod: "^3.24.2" },
        devDependencies: { jest: "^29.7.0" },
      }),
      "utf8",
    );
    await fs.writeFile(
      path.join(appDir, "package-lock.json"),
      JSON.stringify({
        packages: {
          "node_modules/zod": { version: "3.24.2" },
          "node_modules/jest": { version: "29.7.0" },
        },
      }),
      "utf8",
    );
    const calls = [];
    let audits = 0;
    const report = await settleNpmSecurity(appDir, {
      async run(args) {
        calls.push(args.join(" "));
        if (args[0] === "install") {
          const pkg = JSON.parse(await fs.readFile(path.join(appDir, "package.json"), "utf8"));
          pkg.dependencies.zod = "^4.6.7";
          await fs.writeFile(path.join(appDir, "package.json"), JSON.stringify(pkg), "utf8");
          const lock = JSON.parse(await fs.readFile(path.join(appDir, "package-lock.json"), "utf8"));
          lock.packages["node_modules/zod"].version = "4.6.7";
          await fs.writeFile(path.join(appDir, "package-lock.json"), JSON.stringify(lock), "utf8");
          return { code: 0, stdout: "{}", stderr: "" };
        }
        if (args[1] === "--json") audits += 1;
        const body = audits > 1 ? { vulnerabilities: { jest: audit.vulnerabilities.jest } } : audit;
        return { code: 1, stdout: JSON.stringify(body), stderr: "" };
      },
    });
    expect(calls).toEqual(["audit fix", "audit --json", "install zod@4.6.7", "audit --json"]);
    expect(report.upgrades).toEqual([{ name: "zod", version: "4.6.7" }]);
    expect(report.blocking).toEqual([]);
    expect(report.needsRepair).toBe(true);
    expect(report.repairPrompt).toContain("zod@4.6.7");
    expect(report.repairPrompt).toContain("Do not downgrade");
    const again = await settleNpmSecurity(appDir, {
      async run() {
        throw new Error("cached projects should not audit again");
      },
    });
    expect(again.remaining.map((item) => item.name)).toEqual(["jest"]);
    expect(again.needsRepair).toBe(false);
  });
});
