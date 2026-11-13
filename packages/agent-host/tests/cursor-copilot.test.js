import { createCopilotAdapter } from "../src/copilot-adapter.js";
import { createCursorAdapter } from "../src/cursor-adapter.js";

describe("adapters exist", () => {
  test("cursor and copilot factories", () => {
    const ctx = { appDir: "/tmp", slug: "x" };
    expect(createCursorAdapter(ctx).provider).toBe("cursor");
    expect(createCopilotAdapter(ctx).provider).toBe("copilot");
  });
});
