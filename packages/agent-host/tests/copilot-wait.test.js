import { BUILD_WAIT_MS, copilotWaitMs } from "../src/copilot-adapter.js";

describe("copilot wait", () => {
  test("a build waits ten minutes", () => {
    expect(BUILD_WAIT_MS).toBe(10 * 60 * 1000);
    expect(copilotWaitMs("build")).toBe(BUILD_WAIT_MS);
  });

  test("a plan still waits three minutes", () => {
    expect(copilotWaitMs("plan")).toBe(3 * 60 * 1000);
    expect(copilotWaitMs("spec")).toBe(3 * 60 * 1000);
    expect(copilotWaitMs("fix")).toBeUndefined();
  });
});
