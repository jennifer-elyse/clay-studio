/** Clay body pigment is separate from eye, mouth and unicorn illustration. */
export const CLAY_COLOR_KEY = "clay-studio-clay-color";
export const DEFAULT_CLAY_COLOR = "#2D7FF0";
export const CLAY_COLOR_PRESETS = Object.freeze([
  { name: "Clay Blue", value: "#2D7FF0" },
  { name: "Turquoise", value: "#37C8C6" },
  { name: "Lavender", value: "#A78BFA" },
  { name: "Cherry Magenta", value: "#D84C92" },
]);

export const CLAY_WHITE_POINT = 240;
export const CLAY_MAX_SPECULAR = .08;
export const CLAY_MATERIAL_VERSION = "clay-materials-v2";

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

/** Composite registered neutral diffuse, grayscale light, bounded specular and
 * body mask over the untouched illustrated eyes, mouth and unicorn.
 * All parameters are ImageData or RGBA byte arrays of equal pixel count.
 * Alpha comes exclusively from original; never from the material maps.
 */
export function composeClayMaterial(original, diffuse, light, specular, color) {
  const out = original.data ?? original;
  const d = diffuse.data ?? diffuse;
  const l = light.data ?? light;
  const s = specular.data ?? specular;
  if (!validClayColor(color) || color.toUpperCase() === DEFAULT_CLAY_COLOR) return out;
  if (d.length !== out.length || l.length !== out.length || s.length !== out.length) {
    throw new Error("Clay material maps must have identical pixel dimensions");
  }
  const tint = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] < 12) {
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      continue;
    }
    const coverage = d[i + 3] / 255;
    if (coverage <= 0) continue;
    const neutralDiffuse = Math.max(.60, Math.min(1.10, d[i] / CLAY_WHITE_POINT));
    const lightMultiplier = Math.max(.52, Math.min(1.10, l[i] / CLAY_WHITE_POINT));
    const highlight = Math.min(CLAY_MAX_SPECULAR, s[i] / 255);
    for (let c = 0; c < 3; c++) {
      const shaded = Math.min(255, tint[c] * neutralDiffuse * lightMultiplier);
      const lit = shaded + (255 - shaded) * highlight;
      out[i + c] = Math.round(out[i + c] * (1 - coverage) + lit * coverage);
    }
  }
  return out;
}
