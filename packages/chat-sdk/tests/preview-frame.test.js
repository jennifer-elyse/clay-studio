import { frameSrc } from "../src/preview-frame.js";

describe("preview frame", () => {
  test("loads a localhost app and refuses the studio origin", () => {
    expect(frameSrc("http://127.0.0.1:4312", "http://127.0.0.1:5173")).toBe("http://127.0.0.1:4312/");
    expect(frameSrc("http://127.0.0.1:5173/app", "http://127.0.0.1:5173")).toBe("");
    expect(frameSrc("https://example.com", "http://127.0.0.1:5173")).toBe("");
    expect(frameSrc("javascript:alert(1)", "http://127.0.0.1:5173")).toBe("");
    expect(frameSrc("", "http://127.0.0.1:5173")).toBe("");
  });
});
