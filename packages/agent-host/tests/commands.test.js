import { filterCommands, parseSlash, withThink } from "../src/commands.js";

describe("slash commands", () => {
  test("parses a Spec Kit command and its hyphen alias", () => {
    const parsed = parseSlash("/speckit.plan intake form");
    expect(parsed.command?.id).toBe("plan");
    expect(parsed.rest).toBe("intake form");
    expect(parsed.think).toBe(false);
    expect(parseSlash("/speckit-specify albums").command?.id).toBe("spec");
    expect(parseSlash("/speckit.implement").command?.id).toBe("build");
  });

  test("plain text is chat", () => {
    const parsed = parseSlash("make a tracker");
    expect(parsed.command).toBeNull();
    expect(parsed.rest).toBe("make a tracker");
    expect(parsed.think).toBe(false);
  });

  test("filters pills", () => {
    expect(filterCommands("/pl").map((c) => c.id)).toContain("plan");
    expect(filterCommands("/speckit.conv").map((c) => c.id)).toEqual(["converge"]);
  });

  test("keeps help, seats, summarize, and upload", () => {
    const ids = ["/help", "/summarize", "/upload", "/seats", "/seat"].map((slash) => parseSlash(slash).command?.id);
    expect(ids).toEqual(["help", "summarize", "upload", "seat", "seat"]);
  });

  test("parses /seats and /seat as the same command", () => {
    expect(parseSlash("/seats").command?.id).toBe("seat");
    expect(parseSlash("/seat cursor").command?.id).toBe("seat");
    expect(parseSlash("/seats codex").rest).toBe("codex");
  });

  test("the brain puts /think in the same command", () => {
    expect(withThink("/speckit.plan ")).toBe("/speckit.plan /think ");
    const parsed = parseSlash("/speckit.plan /think intake form");
    expect(parsed.command?.id).toBe("plan");
    expect(parsed.rest).toBe("intake form");
    expect(parsed.think).toBe(true);
    expect(withThink("/speckit.implement /think ")).toBe("/speckit.implement /think ");
  });
});
