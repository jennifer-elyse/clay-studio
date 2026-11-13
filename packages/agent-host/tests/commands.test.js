import { filterCommands, parseSlash } from "../src/commands.js";

describe("slash commands", () => {
  test("parses /plan rest", () => {
    const parsed = parseSlash("/plan intake form");
    expect(parsed.command?.id).toBe("plan");
    expect(parsed.rest).toBe("intake form");
  });

  test("plain text is chat", () => {
    const parsed = parseSlash("make a tracker");
    expect(parsed.command).toBeNull();
    expect(parsed.rest).toBe("make a tracker");
  });

  test("filters pills", () => {
    expect(filterCommands("/pl").map((c) => c.id)).toContain("plan");
  });

  test("parses the extra Clay commands", () => {
    const ids = ["/help", "/clear", "/search", "/think", "/summarize", "/write", "/code", "/image", "/settings", "/debug", "/reset"].map(
      (slash) => parseSlash(slash).command?.id,
    );
    expect(ids).toEqual(["help", "clear", "search", "think", "summarize", "write", "code", "image", "settings", "debug", "reset"]);
  });
});
