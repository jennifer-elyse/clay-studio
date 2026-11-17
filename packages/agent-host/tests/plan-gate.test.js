import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { approvalEvents } from "../src/plan-offer.js";
import { assertBuildAllowed, commandDone, markPlanBuilt, PlanGateError, planReadyForApproval, setPlanStatus, writePlan } from "../src/plan-gate.js";

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

  test("a written plan is what the approval card offers", async () => {
    const appDir = await tmpApp();
    const started = Date.now();
    const missing = await planReadyForApproval(appDir, "docs/plans/001-tracker/plan.md", started);
    expect(missing.ok).toBe(false);
    const written = await writePlan({
      appDir,
      slug: "009-other",
      title: "Other",
      body: "## Goal\n\nTrack requests.",
    });
    const offered = await planReadyForApproval(appDir, "docs/plans/001-tracker/plan.md", started);
    expect(offered.ok).toBe(true);
    if (!offered.ok) return;
    expect(offered.plan.path).toBe(written.path);
    expect(offered.plan.status).toBe("draft");
    const events = await approvalEvents({
      appDir,
      relativePath: written.path,
      sinceMs: started,
      runId: "run-1",
      agentId: "agent-1",
    });
    expect(events.map((event) => event.type)).toEqual(["plan"]);
    expect(events[0].plan?.status).toBe("draft");
  });

  test("an approved plan turns Plan off, and a finished build turns Build off", async () => {
    const appDir = await tmpApp();
    expect(await commandDone(appDir)).toEqual({ plan: false, build: false });
    const plan = await writePlan({
      appDir,
      slug: "001-tracker",
      title: "Tracker",
      body: "## Goal\n\nShip a tracker.",
    });
    expect(await commandDone(appDir)).toEqual({ plan: false, build: false });
    await setPlanStatus(plan.path, "approved");
    expect(await commandDone(appDir)).toEqual({ plan: true, build: false });
    expect(await markPlanBuilt(appDir)).toBe(true);
    expect(await commandDone(appDir)).toEqual({ plan: true, build: true });
    const raw = await fs.readFile(plan.path, "utf8");
    expect(raw).toContain("status: approved");
    expect(raw).toContain("built: true");
  });
});
