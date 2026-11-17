import {
  fallbackHarnessModels,
  harnessModelChoice,
  harnessModelMenu,
  harnessModelShown,
  seatModelFields,
  seatModelHint,
  seatModelInput,
  seatModelKey,
} from "../src/seat-model-form.js";

const settings = {
  seatModels: { codex: { work: "gpt-5.5" } },
  defaults: {
    codex: { work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" },
    cursor: { work: "claude-4.5-sonnet", build: "grok-4.7", fast: "composer-2.5" },
  },
};

describe("seat model form", () => {
  test("a saved name fills the field, and no save leaves the default in the placeholder", () => {
    expect(seatModelFields("codex", settings)).toEqual({
      work: { value: "gpt-5.5", placeholder: "gpt-5.4" },
      fast: { value: "", placeholder: "gpt-5.4-mini" },
    });
    expect(seatModelFields("codex", { defaults: settings.defaults })).toEqual({
      work: { value: "", placeholder: "gpt-5.4" },
      fast: { value: "", placeholder: "gpt-5.4-mini" },
    });
  });

  test("cursor work starts blank and its placeholder names both models", () => {
    expect(seatModelFields("cursor", settings).work).toEqual({
      value: "",
      placeholder: "claude-4.5-sonnet plan · grok-4.7 build",
    });
  });

  test("save sends both fields, reset sends null for the seat", () => {
    expect(seatModelInput("codex", { work: "gpt-5.5", fast: "" })).toEqual({
      seatModels: { codex: { work: "gpt-5.5", fast: "" } },
    });
    expect(seatModelInput("codex", { reset: true })).toEqual({ seatModels: { codex: null } });
  });

  test("the input key waits for settings and changes when the saved names change", () => {
    expect(seatModelKey("codex", null)).toBeNull();
    const saved = seatModelKey("codex", settings);
    const cleared = seatModelKey("codex", { ...settings, seatModels: {} });
    expect(saved).toBe(seatModelKey("codex", settings));
    expect(cleared).not.toBe(saved);
  });

  test("the cursor hint says the work field replaces both models", () => {
    expect(seatModelHint("cursor")).toMatch(/one model/);
    expect(seatModelHint("codex")).toMatch(/Blank keeps the default/);
  });

  test("the harness badge shows the saved model, and a pick keeps the quick-turn name", () => {
    expect(harnessModelShown({ provider: "codex", model: "gpt-5.4" }, settings)).toBe("gpt-5.5");
    expect(harnessModelShown({ provider: "mock", model: "mock-clay" }, settings)).toBe("mock-clay");
    expect(harnessModelChoice("codex", { ...settings, seatModels: { codex: { work: "gpt-5.5", fast: "gpt-5.4-mini" } } }, "gpt-5.4")).toEqual({
      seatModels: { codex: { work: "gpt-5.4", fast: "gpt-5.4-mini" } },
    });
  });

  test("the menu uses the account list, then the defaults, and keeps the current model", () => {
    const live = [{ id: "gpt-5.5", label: "GPT 5.5" }];
    expect(harnessModelMenu("codex", settings, live, "gpt-5.4")).toEqual([
      { id: "gpt-5.4", label: "gpt-5.4" },
      { id: "gpt-5.5", label: "GPT 5.5" },
    ]);
    expect(fallbackHarnessModels("cursor", settings).map((row) => row.id)).toEqual([
      "claude-4.5-sonnet",
      "grok-4.7",
      "composer-2.5",
    ]);
    expect(harnessModelMenu("cursor", settings, [], "composer-2.5").map((row) => row.id)).toEqual([
      "claude-4.5-sonnet",
      "grok-4.7",
      "composer-2.5",
    ]);
    expect(harnessModelMenu("mock", settings, [], "")).toEqual([]);
  });
});
