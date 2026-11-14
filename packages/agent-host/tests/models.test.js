import { codexEffort, cursorModelOptions, modelFor, phaseFor } from "../src/models.js";

describe("seat models", () => {
  const previous = {};

  beforeEach(() => {
    for (const key of [
      "CLAY_PLAN_MODEL",
      "CLAY_BUILD_MODEL",
      "CLAY_FAST_MODEL",
      "CLAY_COPILOT_MODEL",
      "CLAY_COPILOT_FAST_MODEL",
      "CLAY_CODEX_MODEL",
      "CLAY_CODEX_FAST_MODEL",
      "CLAY_CODEX_PLAN_MODEL",
    ]) {
      previous[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test("each command lands on the phase that matches its cost", () => {
    expect(phaseFor("plan")).toBe("plan");
    expect(phaseFor("spec")).toBe("plan");
    expect(phaseFor("build")).toBe("build");
    expect(phaseFor("think")).toBe("fast");
    expect(phaseFor("fix")).toBe("fast");
    expect(phaseFor("chat")).toBe("fast");
  });

  test("Cursor spends Claude only on the spec, and Grok High only on the build", () => {
    expect(modelFor("plan", "cursor")).toBe("claude-4.5-sonnet");
    expect(modelFor("build", "cursor")).toBe("grok-4.7");
    expect(modelFor("fast", "cursor")).toBe("composer-2.5");
    expect(cursorModelOptions("grok-4.7", "build").params).toEqual([{ id: "reasoning_effort", value: "high" }]);
    expect(cursorModelOptions("claude-4.5-sonnet", "plan").params).toBeUndefined();
    expect(cursorModelOptions("grok-4.7", "fast").params).toBeUndefined();
    expect(cursorModelOptions("composer-2.5", "fast").params).toBeUndefined();
  });

  test("Copilot keeps premium requests on the plan and the build", () => {
    expect(modelFor("fast", "copilot")).toBe("gpt-5-mini");
    expect(modelFor("plan", "copilot")).toBe("gpt-5.4");
    expect(modelFor("build", "copilot")).toBe("gpt-5.4");
  });

  test("Codex uses the smaller model at low effort except for plan and build", () => {
    expect(modelFor("fast", "codex")).toBe("gpt-5.4-mini");
    expect(modelFor("plan", "codex")).toBe("gpt-5.4");
    expect(modelFor("build", "codex")).toBe("gpt-5.4");
    expect(codexEffort("fast")).toBe("low");
    expect(codexEffort("build")).toBe("medium");
    process.env.CLAY_CODEX_MODEL = "gpt-5.4";
    expect(modelFor("fast", "codex")).toBe("gpt-5.4");
  });
});
