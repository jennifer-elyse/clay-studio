/** Clay body's optional color, independent of the classic/blue theme. */
export const CLAY_COLOR_KEY = "clay-studio-clay-color";
export const DEFAULT_CLAY_COLOR = "#2D7FF0";
export const CLAY_COLOR_PRESETS = Object.freeze([
  { name: "Clay Blue", value: "#2D7FF0" },
  { name: "Turquoise", value: "#37C8C6" },
  { name: "Lavender", value: "#A78BFA" },
  { name: "Cherry Magenta", value: "#D84C92" },
]);

export function validClayColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}
export function readClayColor(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(CLAY_COLOR_KEY);
    return validClayColor(value) ? value.toUpperCase() : DEFAULT_CLAY_COLOR;
  } catch {
    return DEFAULT_CLAY_COLOR;
  }
}
export function saveClayColor(value, storage = globalThis.localStorage) {
  if (!validClayColor(value)) return false;
  try {
    storage?.setItem(CLAY_COLOR_KEY, value.toUpperCase());
    return true;
  } catch {
    return false;
  }
}

/** Recolor only saturated blue clay; leave neutral eyes, mouth and unicorn intact.
 * Work on straight/unpremultiplied canvas RGBA. Never overwrite the alpha.
 */
export function recolorClayPixels(pixels, color) {
  if (!validClayColor(color) || color.toUpperCase() === DEFAULT_CLAY_COLOR) return pixels;
  const target = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const targetLuma = .2126 * target[0] + .7152 * target[1] + .0722 * target[2];
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (a < 12) {
      pixels[i] = pixels[i + 1] = pixels[i + 2] = pixels[i + 3] = 0;
      continue;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturation = max ? (max - min) / max : 0;
    // Material key: the original clay's cobalt/royal blue, excluding white sclera,
    // black pupils, pink tongues and pastel unicorn material.
    const blue = b > r * 1.32 && b > g * 1.09 && g >= r * .83 && saturation > .24;
    if (!blue) continue;
    const sourceLuma = .2126 * r + .7152 * g + .0722 * b;
    // Preserve local surface relief; avoid clipped flat highlights.
    const level = Math.max(.22, Math.min(1.35, sourceLuma / 120));
    const contrast = targetLuma < 70 ? 1.10 : 1;
    for (let c = 0; c < 3; c++) {
      pixels[i + c] = Math.min(255, Math.round(target[c] * level * contrast));
    }
  }
  return pixels;
}
