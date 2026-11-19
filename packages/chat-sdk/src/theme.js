export const THEMES = ["classic", "blue"];
const THEME_KEY = "clay-studio-theme";

/** @param {{ getItem: (key: string) => string | null }} [storage] */
export function readTheme(storage) {
  try {
    const value = (storage ?? globalThis.localStorage)?.getItem(THEME_KEY);
    return THEMES.includes(value) ? value : "classic";
  } catch {
    return "classic";
  }
}

/** @param {string} theme @param {{ setItem: (key: string, value: string) => void }} [storage] */
export function saveTheme(theme, storage) {
  if (!THEMES.includes(theme)) return;
  try { (storage ?? globalThis.localStorage)?.setItem(THEME_KEY, theme); } catch { /* Storage may be unavailable in private mode. */ }
}
