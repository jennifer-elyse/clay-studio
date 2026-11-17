import { createCodexAdapter } from "../src/codex-adapter.js";
import { createCopilotAdapter } from "../src/copilot-adapter.js";
import { createCursorAdapter, needsCursorLogin } from "../src/cursor-adapter.js";

describe("adapters exist", () => {
  test("cursor and copilot factories", () => {
    const ctx = { appDir: "/tmp", slug: "x" };
    expect(createCursorAdapter(ctx).provider).toBe("cursor");
    expect(createCodexAdapter(ctx).provider).toBe("codex");
    expect(createCopilotAdapter(ctx).provider).toBe("copilot");
  });

  test("a stored Cursor login is enough, and a missing one asks to sign in", () => {
    expect(needsCursorLogin({ status: "logged-in" }, "")).toBe(false);
    expect(needsCursorLogin({ status: "logged-out" }, "")).toBe(true);
    expect(needsCursorLogin(undefined, "")).toBe(true);
    expect(needsCursorLogin({ status: "logged-out" }, "cursor_key")).toBe(false);
  });
});
