import { buildPrompt, CLAY_STANDARDS, planPrompt, promptFor } from "../src/prompts.js";

describe("Clay 1.0 prompts", () => {
  test("plan and build carry the platform standards", () => {
    const plan = planPrompt({ appDir: "/tmp/app", rest: "intake form" });
    const build = buildPrompt({
      appDir: "/tmp/app",
      plan: { path: "/tmp/app/docs/plans/001/plan.md", title: "Intake" },
      rest: "",
    });
    for (const prompt of [plan, build]) {
      expect(prompt).toContain("Clay 1.0");
      expect(prompt).toContain("Idempotency-Key");
      expect(prompt).toContain("docs/code.md");
      expect(prompt).toContain("container queries");
      expect(prompt).toContain("tabular figures");
      expect(prompt).toContain("Do not downgrade a package");
      expect(prompt).toContain(CLAY_STANDARDS);
    }
    expect(plan).toContain("Do not implement code yet");
    expect(plan).toContain("definition-of-done");
    expect(build).toContain("Implement ONLY the approved plan");
  });

  test("code and fix still apply the standards", () => {
    expect(promptFor("code", { rest: "rename a label" })).toContain("approved /plan");
    expect(promptFor("fix", { rest: "the button does nothing" })).toContain("Pure functions");
  });
});
