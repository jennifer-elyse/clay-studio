import { buildPrompt, planPrompt, promptFor, specPrompt } from "../src/prompts.js";

describe("Clay 1.0 prompts", () => {
  test("plan and build name only the docs that step needs", () => {
    const plan = planPrompt({ appDir: "/tmp/app", rest: "intake form", seat: "cursor" });
    const build = buildPrompt({
      appDir: "/tmp/app",
      plan: { path: "/tmp/app/docs/app-plan/001/plan.md", title: "Intake" },
      rest: "",
      seat: "cursor",
    });
    expect(plan).toContain("Clay may open at most 5 subtasks");
    expect(plan).toContain("A subtask must not start an agent");
    expect(plan).toContain("Cursor already loaded AGENTS.md");
    expect(plan).toContain("docs/vision.md");
    expect(plan).toContain("docs/erd.md");
    expect(plan).toContain("docs/code.md");
    expect(plan).toContain("technical plan");
    expect(plan).not.toContain("spec of record");
    expect(plan).toContain("Do not implement code yet");
    expect(plan).toContain("docs/app-plan/");
    expect(plan).toContain("Clay asks the person to approve it");
    expect(plan).toContain("definition of done");
    expect(plan).not.toContain("docs/design.md, docs/vision.md, and docs/erd.md");
    expect(build).toContain("Execute the tasks in tasks.md");
    expect(build).toContain("Do not change a checklist marker");
    expect(build).toContain("Do not downgrade a package");
    expect(build).toContain("docs/app-plan/001/plan.md");
    expect(build).not.toContain("Read docs/vision.md");
    const spec = specPrompt({ appDir: "/tmp/app", rest: "intake form", specPath: "docs/app-plan/001-intake/spec.md", seat: "codex" });
    expect(spec).toContain("Codex already loaded AGENTS.md");
    expect(spec).toContain("what and why");
    expect(spec).toContain("AC-1");
    expect(spec).toContain("docs/app-plan/001-intake/spec.md");
    expect(spec).toContain("Do not implement code");
    expect(promptFor("spec", { appDir: "/tmp/app", rest: "intake form", specPath: "docs/app-plan/001-intake/spec.md", seat: "codex" })).toBe(spec);
  });

  test("a short turn does not open the constitution", () => {
    const analyzed = promptFor("analyze", { rest: "the button does nothing", seat: "copilot" });
    expect(analyzed).toContain("Copilot already loaded AGENTS.md");
    expect(analyzed).toContain("Do not edit files");
    expect(analyzed).not.toContain("docs/vision.md");
    expect(analyzed).not.toContain("docs/code.md");
    const code = promptFor("code", { rest: "rename a label", seat: "cursor", appDir: "/tmp/app" });
    expect(code).toContain("Use the IDE");
    expect(code).toContain("Workspace: /tmp/app");
    expect(code).toContain("approved /speckit.plan");
    expect(code).toContain("docs/code.md");
    expect(code).not.toContain("docs/vision.md");
    const think = promptFor("think", { rest: "the intake form", seat: "cursor" });
    expect(think).toContain("five short sentences");
    expect(think).toContain("docs/vision.md only");
  });

  test("the brain stays inside the same turn", () => {
    const plan = promptFor("plan", { appDir: "/tmp/app", rest: "intake form", seat: "cursor", thinkFirst: true });
    expect(plan).toContain("five short sentences");
    expect(plan).toContain("Do not implement code yet");
    expect(plan.indexOf("five short sentences")).toBeLessThan(plan.indexOf("Do not implement code yet"));
  });
});
