import { AMBIENT_CLIPS, COMMAND_CLIPS, clipForCommand } from "../src/animations.js";

describe("clipForCommand", () => {
  test("maps slash command names to files", () => {
    expect(clipForCommand("help")).toBe("help.webp");
    expect(clipForCommand("think")).toBe("think.webp");
    expect(clipForCommand("reset")).toBe("new.webp");
    expect(clipForCommand("code")).toBe(COMMAND_CLIPS.code);
  });

  test("picks ambient clips at random for unnamed commands", () => {
    const clip = clipForCommand("plan", { random: () => 0 });
    expect(AMBIENT_CLIPS).toContain(clip);
    expect(clip).toBe(AMBIENT_CLIPS[0]);
  });

  test("avoids repeating the previous ambient clip", () => {
    const clip = clipForCommand("plan", { previous: "idle.webp", random: () => 0 });
    expect(clip).not.toBe("idle.webp");
  });
});
