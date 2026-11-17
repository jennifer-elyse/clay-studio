import { pillLock } from "../src/pill-state.js";

describe("pill lock", () => {
  test("Plan stays off only after approval, and Build only after a finished build", () => {
    expect(pillLock("plan", { plan: false, build: false })).toBe("");
    expect(pillLock("build", { plan: true, build: false })).toBe("");
    expect(pillLock("plan", { plan: true })).toBe("This project already has an approved plan.");
    expect(pillLock("build", { build: true })).toBe("This project is already built.");
    expect(pillLock("run", { plan: true, build: true })).toBe("");
  });
});
