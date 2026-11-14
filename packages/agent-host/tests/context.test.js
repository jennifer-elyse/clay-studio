import { commandNeedsTools, compactAfter, compactBefore, FAST_TURN_LIMIT } from "../src/context.js";

describe("agent context", () => {
  test("preview tools ride only on turns that change the running app", () => {
    expect(commandNeedsTools("build")).toBe(true);
    expect(commandNeedsTools("fix")).toBe(true);
    expect(commandNeedsTools("code")).toBe(false);
    expect(commandNeedsTools("plan")).toBe(false);
    expect(commandNeedsTools("chat")).toBe(false);
    expect(commandNeedsTools("spec")).toBe(false);
  });

  test("a resumed or long thread is compacted before the next send", () => {
    expect(compactBefore({ phase: "fast", turns: 0, hasHistory: true })).toBe(true);
    expect(compactBefore({ phase: "plan", turns: 2, hasHistory: false })).toBe(true);
    expect(compactBefore({ phase: "fast", turns: FAST_TURN_LIMIT, hasHistory: false })).toBe(true);
    expect(compactBefore({ phase: "fast", turns: 1, hasHistory: false })).toBe(false);
    expect(compactBefore({ phase: "plan", turns: 0, hasHistory: false })).toBe(false);
  });

  test("plan and build are compacted afterward", () => {
    expect(compactAfter("plan")).toBe(true);
    expect(compactAfter("build")).toBe(true);
    expect(compactAfter("fast")).toBe(false);
  });
});