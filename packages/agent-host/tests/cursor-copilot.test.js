import { createCodexAdapter } from "../src/codex-adapter.js";
import { createCopilotAdapter } from "../src/copilot-adapter.js";
import { createCursorAdapter } from "../src/cursor-adapter.js";

describe("adapters exist", () => {
  test("cursor and copilot factories", () => {
    const ctx = { appDir: "/tmp", slug: "x" };
    expect(createCursorAdapter(ctx).provider).toBe("cursor");
    expect(createCodexAdapter(ctx).provider).toBe("codex");
    expect(createCopilotAdapter(ctx).provider).toBe("copilot");
  });
});
