import { blueMotionForClip } from "../src/blue-motion.js";
import { COMMAND_CLIPS, AMBIENT_CLIPS } from "../src/animations.js";

test("the scalable Blue Clay rig supports every existing clip", () => {
  const states = new Set(["morph", "roll", "think", "focus", "bounce", "interested", "judging", "concerned", "settle", "idle"]);
  for (const name of [...Object.values(COMMAND_CLIPS), ...AMBIENT_CLIPS]) {
    expect(states.has(blueMotionForClip(name))).toBe(true);
  }
});

test("the unicorn and eye animation states remain separate", () => {
  expect(blueMotionForClip("image.webp")).toBe("morph");
  expect(blueMotionForClip("pop-shape.webp")).toBe("morph");
  expect(blueMotionForClip("blink.webp")).toBe("idle");
  expect(blueMotionForClip("judging.webp")).toBe("judging");
});
