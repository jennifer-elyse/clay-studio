import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COMMANDS, parseSlash } from "@cswg/agent-host/commands";
import { AMBIENT_CLIPS, ANIMATION_BASE, BLUE_ANIMATION_BASE, COMMAND_CLIPS, animationSrc, clipForCommand } from "../src/animations.js";

const directory = fileURLToPath(new URL("../../../apps/studio/public/assets/animations/", import.meta.url));
const purpleManifest = JSON.parse(readFileSync(new URL("../../../apps/studio/public/assets/animations/clay-chatbot/manifest.json", import.meta.url), "utf8"));

/** Validate the RIFF container and count actual animated WebP frame chunks. */
function frameCount(path) {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  expect(bytes.readUInt32LE(4) + 8).toBe(bytes.length);
  let position = 12;
  let frames = 0;
  let animation = false;
  let animatedFlag = false;
  while (position < bytes.length) {
    expect(position + 8).toBeLessThanOrEqual(bytes.length);
    const tag = bytes.toString("ascii", position, position + 4);
    const length = bytes.readUInt32LE(position + 4);
    expect(position + 8 + length).toBeLessThanOrEqual(bytes.length);
    if (tag === "VP8X") animatedFlag = (bytes[position + 8] & 2) !== 0;
    if (tag === "ANIM") animation = true;
    if (tag === "ANMF") frames += 1;
    position += 8 + length + (length % 2);
  }
  expect(position).toBe(bytes.length);
  expect(animatedFlag).toBe(true);
  expect(animation).toBe(true);
  return frames;
}

describe("Purple Clay slash-command coverage", () => {
  test("registers a real WebP for every command, including the /seat alias", () => {
    const ids = COMMANDS.map(({ id }) => id);
    const slashes = COMMANDS.flatMap(({ slash, aliases = [] }) => [slash, ...aliases]);
    expect(Object.keys(COMMAND_CLIPS).sort()).toEqual(ids.sort());
    expect(purpleManifest.theme).toBe("purple");
    expect(purpleManifest.default).toBe(true);
    expect(purpleManifest.internal_theme_id).toBe("classic");
    expect(purpleManifest.asset_base).toBe("../");
    expect(Object.keys(purpleManifest.slash_commands).sort()).toEqual(slashes.sort());
    for (const command of COMMANDS) {
      const clip = clipForCommand(command.id);
      expect(clip.endsWith(".webp")).toBe(true);
      expect(animationSrc(clip)).toBe(`${ANIMATION_BASE}/${clip}`);
      for (const slash of [command.slash, ...(command.aliases ?? [])]) {
        expect(parseSlash(slash).command?.id).toBe(command.id);
        expect(clipForCommand(parseSlash(slash).command?.id)).toBe(clip);
        expect(purpleManifest.slash_commands[slash].file).toBe(clip);
      }
      expect(existsSync(`${directory}${clip}`)).toBe(true);
      expect(frameCount(`${directory}${clip}`)).toBeGreaterThan(1);
    }
  });

  test("every ambient Purple Clay clip is present and animated", () => {
    expect(Object.keys(purpleManifest.states).sort()).toEqual(AMBIENT_CLIPS.map((name) => name.replace(".webp", "")).sort());
    for (const clip of AMBIENT_CLIPS) {
      expect(purpleManifest.states[clip.replace(".webp", "")].file).toBe(clip);
      expect(existsSync(`${directory}${clip}`)).toBe(true);
      expect(frameCount(`${directory}${clip}`)).toBeGreaterThan(1);
    }
  });
});

describe("Blue Clay parity and clip selection", () => {
  test("Blue Clay has animated WebPs for the same commands and ambient states", () => {
    for (const clip of [...Object.values(COMMAND_CLIPS), ...AMBIENT_CLIPS]) {
      const path = `${directory}blue/${clip}`;
      expect(animationSrc(clip, BLUE_ANIMATION_BASE)).toBe(`${BLUE_ANIMATION_BASE}/${clip}`);
      expect(existsSync(path)).toBe(true);
      expect(frameCount(path)).toBeGreaterThanOrEqual(["image.webp", "pop-shape.webp"].includes(clip) ? 12 : 24);
      const file = readFileSync(path);
      expect(file.byteLength).toBeGreaterThan(100000);
      expect(file[24] + ((file[25] & 63) << 8) + 1).toBeGreaterThanOrEqual(300);
      expect(file[27] + ((file[28] & 63) << 8) + 1).toBeGreaterThanOrEqual(300);
    }
  });
  test("the two transformation clips contain the exact generated 12-frame asset", () => {
    const source = readFileSync(`${directory}blue/morph-source.webp`);
    expect(frameCount(`${directory}blue/morph-source.webp`)).toBe(12);
    for (const clip of ["image.webp", "pop-shape.webp"]) {
      expect(readFileSync(`${directory}blue/${clip}`).equals(source)).toBe(true);
    }
  });

  test("unknown messages choose ambient clips without repeating the previous clip", () => {
    expect(AMBIENT_CLIPS).toContain(clipForCommand(null, { random: () => 0 }));
    expect(clipForCommand(null, { previous: "idle.webp", random: () => 0 })).not.toBe("idle.webp");
  });
});
