import { pillLock } from "../src/pill-state.js";

describe("pill lock", () => {
  test("Plan and Implement stay available after they finish", () => {
    expect(pillLock("plan", { plan: false, build: false })).toBe("");
    expect(pillLock("plan", { plan: true })).toBe("");
    expect(pillLock("build", { plan: true, build: true })).toBe("");
    expect(pillLock("run", { plan: true, build: true })).toBe("");
  });
});
