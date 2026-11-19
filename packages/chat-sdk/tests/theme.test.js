import { readTheme, saveTheme } from "../src/theme.js";

test("classic theme is the default", () => {
  expect(readTheme({ getItem: () => null })).toBe("classic");
  expect(readTheme({ getItem: () => "unknown" })).toBe("classic");
});
test("theme choice persists with storage", () => {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  saveTheme("blue", storage);
  expect(readTheme(storage)).toBe("blue");
  saveTheme("invalid", storage);
  expect(readTheme(storage)).toBe("blue");
});
test("storage denial keeps classic available", () => {
  expect(readTheme({ getItem: () => { throw new Error("blocked"); } })).toBe("classic");
  expect(() => saveTheme("blue", { setItem: () => { throw new Error("blocked"); } })).not.toThrow();
});
