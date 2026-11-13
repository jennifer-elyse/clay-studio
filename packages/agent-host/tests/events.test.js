import { makeEvent, parseUiEvent, UiEventSchema } from "../src/events.js";

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

  test("rejects unknown types", () => {
    expect(() => parseUiEvent({ type: "nope", id: "1" })).toThrow();
    expect(UiEventSchema.safeParse({ type: "error", id: "1", text: "x" }).success).toBe(true);
  });
});
