import { composeClayMaterial, DEFAULT_CLAY_COLOR } from "../src/clay-color.js";

test("material maps recolor dark clay without painting eyes, mouth or transparent border", () => {
  const original = new Uint8ClampedArray([
    0, 21, 62, 255,    // near-black clay edge
    235, 243, 253, 255, // white sclera
    9, 18, 34, 255,  // pupil
    220, 65, 123, 255, // tongue
    10, 10, 10, 2, // fringe with nearly zero alpha
  ]);
  const diffuse = new Uint8ClampedArray([
    240, 240, 240, 255,
    240, 240, 240, 0,
    240, 240, 240, 0,
    240, 240, 240, 0,
    240, 240, 240, 0,
  ]);
  const light = new Uint8ClampedArray(Array.from({length: 5}, () => [150, 150, 150, 255]).flat());
  const specular = new Uint8ClampedArray(Array.from({length: 5}, () => [0, 0, 0, 255]).flat());
  composeClayMaterial(original, diffuse, light, specular, "#D84C92");
  expect(original[0]).toBeGreaterThan(70); // dark rim now pink, not navy
  expect(original[0]).toBeGreaterThan(original[2]);
  expect(Array.from(original.slice(4, 16))).toEqual([
    235, 243, 253, 255, 9, 18, 34, 255, 220, 65, 123, 255,
  ]);
  expect(Array.from(original.slice(16, 20))).toEqual([0,0,0,0]);
});
test("white and turquoise are legible under the same registered light map", () => {
  const diffuse = new Uint8ClampedArray([240,240,240,255]);
  const light = new Uint8ClampedArray([170,170,170,255]);
  const spec = new Uint8ClampedArray([20,20,20,255]);
  const lightClay = new Uint8ClampedArray([4,35,90,255]);
  const turquoise = new Uint8ClampedArray([4,35,90,255]);
  composeClayMaterial(lightClay,diffuse,light,spec,"#E8F5FF");
  composeClayMaterial(turquoise,diffuse,light,spec,"#37C8C6");
  expect(lightClay[0]).toBeGreaterThan(120);
  expect(turquoise[1]).toBeGreaterThan(110);
});
test("default blue preserves the original diffuse illustration and alpha", () => {
  const base = new Uint8ClampedArray([34,95,189,255]);
  const map = new Uint8ClampedArray([240,240,240,255]);
  composeClayMaterial(base,map,map,map,DEFAULT_CLAY_COLOR);
  expect(Array.from(base)).toEqual([34,95,189,255]);
});
test("misregistered maps fail instead of silently producing a halo", () => {
  expect(() => composeClayMaterial(new Uint8ClampedArray(8),new Uint8ClampedArray(4),
    new Uint8ClampedArray(8),new Uint8ClampedArray(8),"#D84C92")).toThrow(/identical/);
});
