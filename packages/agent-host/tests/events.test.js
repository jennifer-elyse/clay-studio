import { BUILDING_STATUS, makeEvent, parseUiEvent, runStartFields, UiEventSchema } from "../src/events.js";

describe("UiEvent", () => {
  test("parses a plan event", () => {
    const event = makeEvent("plan", {
      plan: {
        id: "001-tracker",
        path: "docs/plans/001-tracker/plan.md",
        title: "Tracker",
        body: "Goal",
        status: "draft",
      },
    });
    expect(event.type).toBe("plan");
    expect(event.plan?.status).toBe("draft");
  });

  test("build names its status and other commands stay quiet", () => {
    expect(runStartFields("build")).toEqual({ text: BUILDING_STATUS });
    expect(runStartFields("plan")).toEqual({});
    const event = makeEvent("run_started", { runId: "r", ...runStartFields("build") });
    expect(event.text).toBe("Creating the application…");
  });

  test("rejects unknown types", () => {
    expect(() => parseUiEvent({ type: "nope", id: "1" })).toThrow();
    expect(UiEventSchema.safeParse({ type: "error", id: "1", text: "x" }).success).toBe(true);
  });
});
