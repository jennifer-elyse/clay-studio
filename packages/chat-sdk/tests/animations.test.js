import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { COMMANDS } from "@cswg/agent-host/commands";
import { AMBIENT_CLIPS, ANIMATION_BASE, BLUE_ANIMATION_BASE, COMMAND_CLIPS, clipForCommand } from "../src/animations.js";

const dir = fileURLToPath(new URL("../../../apps/studio/public/assets/animations/", import.meta.url));

describe("slash command animations", () => {
  test("all registered slash commands and aliases resolve to WebP assets", () => {
    const ids = COMMANDS.map((cmd) => cmd.id);
    expect(Object.keys(COMMAND_CLIPS).sort()).toEqual(ids.sort());
    for (const cmd of COMMANDS) {
      const clip = clipForCommand(cmd.id);
      expect(clip.endsWith(".webp")).toBe(true);
      for (const base of [ANIMATION_BASE, BLUE_ANIMATION_BASE]) {
        const file = `${dir}${base === BLUE_ANIMATION_BASE ? "blue/" : ""}${clip}`;
        expect(existsSync(file)).toBe(true);
        const bytes = readFileSync(file);
        expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
        expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
        expect(bytes.includes(Buffer.from("ANIM"))).toBe(true);
      }
    }
  });
  test("blue slash commands each have a distinct animated WebP", () => {
    const bytes = COMMANDS.map((cmd) => readFileSync(`${dir}blue/${clipForCommand(cmd.id)}`).toString("base64"));
    expect(new Set(bytes).size).toBe(COMMANDS.length);
  });
  test("both themes have animated ambient loops", () => {
    for (const clip of AMBIENT_CLIPS) {
      expect(existsSync(`${dir}${clip}`)).toBe(true);
      expect(existsSync(`${dir}blue/${clip}`)).toBe(true);
    }
  });
  test("no ambient fallbacks for slash commands", () => {
    expect(clipForCommand("plan")).toBe("plan.webp");
    expect(clipForCommand("reset")).toBe("new.webp");
    expect(clipForCommand("seat")).toBe("seats.webp");
  });
  test("unknown messages still use ambient clips without a repeat", () => {
    expect(AMBIENT_CLIPS).toContain(clipForCommand(null, { random: () => 0 }));
    expect(clipForCommand(null, { previous: "idle.webp", random: () => 0 })).not.toBe("idle.webp");
  });
});
