import { followRoot } from "../src/use-root-browser.js";

describe("followRoot", () => {
  test("keeps the folder the user opened", () => {
    expect(followRoot({ start: "/Projects", seen: "/Projects", target: "/Projects/notes" })).toEqual({
      seen: "/Projects",
      target: "/Projects/notes",
      changed: false,
    });
  });

  test("follows a projects folder that arrives later", () => {
    expect(followRoot({ start: "/Projects", seen: "", target: "" })).toEqual({
      seen: "/Projects",
      target: "/Projects",
      changed: true,
    });
  });
});
