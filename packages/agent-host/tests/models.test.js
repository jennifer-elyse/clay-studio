import {
  codexEffort,
  cursorModelOptions,
  defaultModels,
  hasSeatOverride,
  modelFor,
  phaseFor,
  resolveCopilotModel,
  harnessModelChoices,
  nextModelAfterLimit,
  resolveHarnessModel,
  selectableModels,
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
    expect(phaseFor("constitution")).toBe("plan");
    expect(phaseFor("analyze")).toBe("plan");
    expect(phaseFor("build")).toBe("build");
    expect(phaseFor("converge")).toBe("build");
    expect(phaseFor("think")).toBe("fast");
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

  test("the first listed model in the family wins, ahead of an older built-in name", () => {
    const cursor = [
      { id: "auto-smart" },
      { id: "claude-fable-5", aliases: ["claude-4.5-sonnet"] },
      { id: "claude-4.5-sonnet" },
      { id: "grok-4.7", parameters: [{ id: "reasoning_effort", values: [{ value: "high" }, { value: "low" }] }] },
      { id: "grok-4" },
      { id: "composer-2.5" },
      { id: "composer-2" },
    ];
    expect(resolveHarnessModel("plan", "cursor", cursor).id).toBe("claude-fable-5");
    expect(harnessModelChoices("plan", "cursor", cursor).map((choice) => choice.id)).toEqual([
      "claude-fable-5",
      "claude-4.5-sonnet",
    ]);
    const limit = "You've hit your usage limit for Opus You've saved $633 on API model usage this month with Pro+.";
    const opusCatalog = [{ id: "claude-opus-4.8" }, { id: "claude-sonnet-5.5" }, { id: "claude-haiku-4.5" }];
    const opusChoices = harnessModelChoices("plan", "cursor", opusCatalog);
    expect(nextModelAfterLimit(opusChoices, 0, limit)?.id).toBe("claude-sonnet-5.5");
    expect(nextModelAfterLimit(opusChoices, 0, "The file could not be written.")).toBeNull();
    expect(resolveHarnessModel("build", "cursor", cursor)).toEqual({
      id: "grok-4.7",
      params: [{ id: "reasoning_effort", value: "high" }],
    });
    expect(resolveHarnessModel("fast", "cursor", cursor).id).toBe("composer-2.5");
    const copilot = [{ id: "gpt-5.6-sol" }, { id: "gpt-6.1-sol" }, { id: "gpt-5.6-luna" }];
    expect(resolveCopilotModel("plan", copilot)).toBe("gpt-5.6-sol");
    expect(resolveCopilotModel("fast", copilot)).toBe("gpt-5.6-luna");
    const codex = [{ model: "gpt-5.5", isDefault: true }, { model: "gpt-5.4-mini", isDefault: false }];
    expect(resolveHarnessModel("plan", "codex", codex).id).toBe("gpt-5.5");
    expect(resolveHarnessModel("fast", "codex", codex).id).toBe("gpt-5.4-mini");
  });

  test("a missing family uses the first concrete model, and a router-only list uses auto-smart", () => {
    expect(resolveHarnessModel("plan", "cursor", [{ id: "auto-smart" }, { id: "grok-4.7" }]).id).toBe("grok-4.7");
    expect(resolveHarnessModel("fast", "cursor", [{ id: "muse-wonder-1" }]).id).toBe("muse-wonder-1");
    const router = [{
      id: "auto-smart",
      parameters: [{ id: "optimize_for", values: [{ value: "cost" }, { value: "intelligence" }] }],
    }];
    expect(resolveHarnessModel("plan", "cursor", router)).toEqual({
      id: "auto-smart",
      params: [{ id: "optimize_for", value: "intelligence" }],
    });
    expect(resolveHarnessModel("fast", "cursor", router).params).toEqual([{ id: "optimize_for", value: "cost" }]);
    expect(resolveHarnessModel("plan", "cursor", []).id).toBe("claude-4.5-sonnet");
  });

  test("high reasoning is sent only when the listed Grok allows it", () => {
    const grok = [{
      id: "grok-4.7",
      parameters: [{ id: "reasoning_effort", values: [{ value: "low" }] }],
      variants: [{ isDefault: true, params: [{ id: "reasoning_effort", value: "low" }] }],
    }];
    expect(resolveHarnessModel("build", "cursor", grok).params).toEqual([{ id: "reasoning_effort", value: "low" }]);
    expect(resolveHarnessModel("build", "cursor", [{ id: "grok-4.7" }]).params).toEqual([
      { id: "reasoning_effort", value: "high" },
    ]);
  });

  test("the picker lists concrete models and keeps a display name", () => {
    expect(selectableModels([
      { id: "auto" },
      { id: "claude-fable-5", displayName: "Claude Fable" },
      { id: "claude-fable-5", displayName: "again" },
      { id: "grok-4.7", name: "Grok" },
    ])).toEqual([
      { id: "claude-fable-5", label: "Claude Fable" },
      { id: "grok-4.7", label: "Grok" },
    ]);
    expect(selectableModels([{ id: "auto" }, { model: "default", isDefault: true }])).toEqual([
      { id: "auto", label: "auto" },
      { id: "default", label: "default" },
    ]);
  });
});
