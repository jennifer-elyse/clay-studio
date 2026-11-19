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

import { CLAY_COLOR_KEY, DEFAULT_CLAY_COLOR, readClayColor, saveClayColor } from "../src/clay-color.js";

test("Clay starts blue and remembers a separate body color", () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  expect(readClayColor(storage)).toBe(DEFAULT_CLAY_COLOR);
  expect(saveClayColor("#d84c92", storage)).toBe(true);
  expect(data.get(CLAY_COLOR_KEY)).toBe("#D84C92");
  expect(readClayColor(storage)).toBe("#D84C92");
  expect(saveClayColor("not-a-hex", storage)).toBe(false);
  expect(readClayColor(storage)).toBe("#D84C92");
});
test("Clay color survives disabled storage", () => {
  expect(readClayColor({ getItem: () => { throw new Error("blocked"); } })).toBe(DEFAULT_CLAY_COLOR);
  expect(saveClayColor("#37C8C6", { setItem: () => { throw new Error("blocked"); } })).toBe(false);
});
