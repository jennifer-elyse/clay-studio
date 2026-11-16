import {
  codexEffort,
  cursorModelOptions,
  defaultModels,
  hasSeatOverride,
  modelFor,
  phaseFor,
  resolveCopilotModel,
} from "../src/models.js";

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

  test("Copilot uses Sol for plan and build, and a listed model when Sol is absent", () => {
    expect(modelFor("fast", "copilot")).toBe("gpt-6-luna");
    expect(modelFor("plan", "copilot")).toBe("gpt-6.1-sol");
    expect(modelFor("build", "copilot")).toBe("gpt-6.1-sol");
    const catalog = [{ id: "claude-sonnet-5.5" }, { id: "gpt-5.6-luna" }];
    expect(resolveCopilotModel("plan", catalog)).toBe("claude-sonnet-5.5");
    expect(resolveCopilotModel("fast", catalog)).toBe("gpt-5.6-luna");
    expect(resolveCopilotModel("plan", [])).toBe("gpt-6.1-sol");
    expect(resolveCopilotModel("plan", [{ id: "gpt-6.1-sol" }])).toBe("gpt-6.1-sol");
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

  test("a saved override beats the environment, which beats the built-in default", () => {
    process.env.CLAY_CODEX_PLAN_MODEL = "env-work";
    expect(modelFor("plan", "codex")).toBe("env-work");
    expect(modelFor("plan", "codex", { codex: { work: "saved-work" } })).toBe("saved-work");
    expect(modelFor("build", "codex", { codex: { work: "saved-work" } })).toBe("saved-work");
    expect(modelFor("fast", "codex", { codex: { work: "saved-work" } })).toBe("gpt-5.4-mini");
    delete process.env.CLAY_CODEX_PLAN_MODEL;
    expect(modelFor("plan", "codex")).toBe("gpt-5.4");
  });

  test("overrides apply per phase kind: work covers plan and build, fast covers quick turns", () => {
    const overrides = { copilot: { work: "gpt-x-work", fast: "gpt-x-fast" } };
    expect(modelFor("plan", "copilot", overrides)).toBe("gpt-x-work");
    expect(modelFor("build", "copilot", overrides)).toBe("gpt-x-work");
    expect(modelFor("fast", "copilot", overrides)).toBe("gpt-x-fast");
    const onlyFast = { copilot: { fast: "gpt-x-fast" } };
    expect(modelFor("plan", "copilot", onlyFast)).toBe("gpt-6.1-sol");
    expect(modelFor("fast", "copilot", onlyFast)).toBe("gpt-x-fast");
  });

  test("a Cursor work override replaces both Claude plan and Grok build", () => {
    const overrides = { cursor: { work: "my-model" } };
    expect(modelFor("plan", "cursor", overrides)).toBe("my-model");
    expect(modelFor("build", "cursor", overrides)).toBe("my-model");
    expect(modelFor("fast", "cursor", overrides)).toBe("composer-2.5");
    expect(cursorModelOptions("my-model", "build").params).toBeUndefined();
  });

  test("blank overrides are no override, and the mock seat ignores overrides", () => {
    expect(hasSeatOverride("codex", "plan", { codex: { work: undefined } })).toBe(false);
    expect(hasSeatOverride("codex", "plan", {})).toBe(false);
    expect(modelFor("plan", "codex", { codex: { work: undefined } })).toBe("gpt-5.4");
    expect(modelFor("build", "mock", { codex: { work: "x" } })).toBe("mock-clay");
  });

  test("defaults report what runs without an override, including environment values", () => {
    expect(defaultModels("codex")).toEqual({ work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" });
    expect(defaultModels("cursor")).toEqual({ work: "claude-4.5-sonnet", build: "grok-4.7", fast: "composer-2.5" });
    process.env.CLAY_COPILOT_MODEL = "env-copilot";
    expect(defaultModels("copilot").work).toBe("env-copilot");
    delete process.env.CLAY_COPILOT_MODEL;
  });

  test("a typed Copilot override is used as-is, even when the account does not list it", () => {
    const catalog = [{ id: "claude-sonnet-5.5" }];
    expect(resolveCopilotModel("plan", catalog, { copilot: { work: "typed-model" } })).toBe("typed-model");
    expect(resolveCopilotModel("plan", catalog)).toBe("claude-sonnet-5.5");
  });
});
