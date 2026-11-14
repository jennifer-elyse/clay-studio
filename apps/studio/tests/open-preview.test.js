import { openRunningApp } from "../server/open-preview.js";

describe("open running app", () => {
  test("asks the system browser to open a localhost preview", () => {
    /** @type {Array<[string, string[]]>} */
    const calls = [];
    const result = openRunningApp("http://127.0.0.1:4312", "darwin", (command, args) => {
      calls.push([command, args]);
    });
    expect(result).toEqual({ ok: true, url: "http://127.0.0.1:4312" });
    expect(calls).toEqual([["open", ["http://127.0.0.1:4312"]]]);
  });

  test("leaves a missing preview closed", () => {
    const result = openRunningApp(undefined, "darwin", () => {
      throw new Error("should not launch");
    });
    expect(result.ok).toBe(false);
  });

  test("refuses a url that is not the local app", () => {
    const result = openRunningApp("https://example.com", "darwin", () => {
      throw new Error("should not launch");
    });
    expect(result).toMatchObject({ ok: false, code: "PREVIEW_ASLEEP" });
  });
});
