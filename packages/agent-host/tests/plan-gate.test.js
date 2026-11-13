import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { assertBuildAllowed, PlanGateError, setPlanStatus, writePlan } from "../src/plan-gate.js";

async function tmpApp() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-plan-"));
  return dir;
}

describe("plan gate", () => {
  test("blocks build without an approved plan", async () => {
    const appDir = await tmpApp();
    await expect(assertBuildAllowed(appDir)).rejects.toBeInstanceOf(PlanGateError);
  });

  test("allows build after approval", async () => {
    const appDir = await tmpApp();
    const plan = await writePlan({
      appDir,
      slug: "001-tracker",
      title: "Tracker",
      body: "## Goal\n\nShip a tracker.",
    });
    await expect(assertBuildAllowed(appDir)).rejects.toBeInstanceOf(PlanGateError);
    await setPlanStatus(plan.path, "approved");
    const approved = await assertBuildAllowed(appDir);
    expect(approved.title).toBe("Tracker");
  });
});
