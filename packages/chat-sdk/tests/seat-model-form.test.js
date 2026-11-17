import { seatModelFields, seatModelHint, seatModelInput } from "../src/seat-model-form.js";

const settings = {
  seatModels: { codex: { work: "gpt-5.5" } },
  defaults: {
    codex: { work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" },
    cursor: { work: "claude-4.5-sonnet", build: "grok-4.7", fast: "composer-2.5" },
  },
};

describe("seat model form", () => {
  test("fields show the saved value, else the default", () => {
    expect(seatModelFields("codex", settings)).toEqual({
      work: { value: "gpt-5.5", placeholder: "gpt-5.4" },
      fast: { value: "gpt-5.4-mini", placeholder: "gpt-5.4-mini" },
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

  test("the cursor hint says the work field replaces both models", () => {
    expect(seatModelHint("cursor")).toMatch(/one model/);
    expect(seatModelHint("codex")).toMatch(/Used for plan and build/);
  });
});
