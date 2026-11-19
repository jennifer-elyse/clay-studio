import { recolorClayPixels } from "../src/clay-color.js";

test("recolors blue clay while retaining white eyes, dark pupils and mouth", () => {
  const frame = new Uint8ClampedArray([
    34, 95, 189, 255,  // blue clay
    235, 243, 253, 255, // white eye
    9, 18, 34, 255, // dark pupil
    220, 65, 123, 255, // pink tongue
    0, 0, 0, 2, // transparent fringe
  ]);
  recolorClayPixels(frame, "#D84C92");
  expect(frame[0]).toBeGreaterThan(frame[2]); // now magenta-dominant
  expect(Array.from(frame.slice(4, 16))).toEqual([235, 243, 253, 255, 9, 18, 34, 255, 220, 65, 123, 255]);
  expect(Array.from(frame.slice(16,20))).toEqual([0,0,0,0]);
});
test("the original blue preset is unchanged", () => {
  const frame = new Uint8ClampedArray([34,95,189,255]);
  recolorClayPixels(frame, "#2D7FF0");
  expect(Array.from(frame)).toEqual([34,95,189,255]);
});
