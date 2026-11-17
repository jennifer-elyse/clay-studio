import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  loadSettings,
  mergeSeatModels,
  saveSettings,
  SettingsInput,
  SeatModelsInput,
  updateSettings,
  validateProjectsRoot,
} from "../src/settings.js";

const DEFAULTS = {
  cursor: { work: "claude-4.5-sonnet", build: "grok-4.7", fast: "composer-2.5" },
  codex: { work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" },
  copilot: { work: "gpt-6.1-sol", build: "gpt-6.1-sol", fast: "gpt-6-luna" },
};

describe("settings", () => {
  test("the input needs an absolute folder", () => {
    expect(SettingsInput.safeParse({ projectsRoot: "" }).success).toBe(false);
    expect(SettingsInput.safeParse({ projectsRoot: "relative/dir" }).success).toBe(false);
    expect(SettingsInput.safeParse({ projectsRoot: "/tmp" }).success).toBe(true);
    expect(SettingsInput.safeParse({}).success).toBe(false);
  });

  test("seat models are optional per seat, blank means no override, and null clears", () => {
    const ok = (value) => SettingsInput.safeParse(value);
    expect(ok({ seatModels: { codex: { work: "gpt-5.5", fast: "" } } }).data.seatModels.codex).toEqual({
      work: "gpt-5.5",
      fast: undefined,
    });
    expect(ok({ seatModels: { cursor: null } }).success).toBe(true);
    expect(ok({ projectsRoot: "/tmp", seatModels: { copilot: { work: "gpt-6.1-sol" } } }).success).toBe(true);
    expect(ok({ seatModels: {} }).success).toBe(true);
    expect(ok({}).success).toBe(false);
  });

  test("seat model names are short, trimmed, and free of spaces or control characters", () => {
    const parse = (work) => SeatModelsInput.safeParse({ codex: { work } });
    expect(parse("  gpt-5.4  ").data.codex.work).toBe("gpt-5.4");
    expect(parse("openai/gpt-5.4:high").success).toBe(true);
    expect(parse("gpt 5.4").success).toBe(false);
    expect(parse("gpt-5.4\n").data.codex.work).toBe("gpt-5.4");
    expect(parse("gpt\u0007").success).toBe(false);
    expect(parse("a".repeat(101)).success).toBe(false);
    expect(parse("a".repeat(100)).success).toBe(true);
    expect(parse("").data.codex.work).toBeUndefined();
  });

  test("a projects folder must exist, be a folder, and sit outside Clay", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-settings-"));
    const file = path.join(dir, "file.txt");
    await fs.writeFile(file, "x");
    await expect(validateProjectsRoot(dir)).resolves.toBe(dir);
    await expect(validateProjectsRoot(path.join(dir, "missing"))).rejects.toThrow("does not exist");
    await expect(validateProjectsRoot(file)).rejects.toThrow("not a file");
    await expect(validateProjectsRoot(path.join(dir, "inside"), dir)).rejects.toThrow("outside itself");
  });

  test("settings round-trip through the profile", async () => {
    const previous = process.env.CLAY_PROFILE_DIR;
    process.env.CLAY_PROFILE_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "clay-profile-"));
    try {
      expect(await loadSettings()).toEqual({});
      await saveSettings({ projectsRoot: "/tmp/x" });
      expect(await loadSettings()).toEqual({ projectsRoot: "/tmp/x" });
    } finally {
      if (previous === undefined) delete process.env.CLAY_PROFILE_DIR;
      else process.env.CLAY_PROFILE_DIR = previous;
    }
  });

  test("a seat override that matches the default is not stored, and null clears a seat", () => {
    const set = (current, input) => mergeSeatModels(current, SeatModelsInput.parse(input), DEFAULTS);
    expect(set({}, { codex: { work: "gpt-5.4", fast: "gpt-5.4-mini" } })).toEqual({});
    expect(set({}, { codex: { work: "gpt-5.5", fast: "" } })).toEqual({ codex: { work: "gpt-5.5" } });
    expect(set({ codex: { work: "gpt-5.5" } }, { codex: { work: "" } })).toEqual({});
    expect(set({ codex: { work: "gpt-5.5" } }, { codex: null })).toEqual({});
    expect(set({ copilot: { fast: "x" } }, { codex: { work: "y" } })).toEqual({ copilot: { fast: "x" }, codex: { work: "y" } });
  });

  test("cursor work is kept even when it looks like the plan default, since it also drives build", () => {
    const next = mergeSeatModels({}, SeatModelsInput.parse({ cursor: { work: "claude-4.5-sonnet" } }), DEFAULTS);
    expect(next).toEqual({ cursor: { work: "claude-4.5-sonnet" } });
  });

  test("the chosen seat is saved and survives other settings changes", async () => {
    const previous = process.env.CLAY_PROFILE_DIR;
    process.env.CLAY_PROFILE_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "clay-profile-"));
    try {
      await updateSettings({ seat: "copilot" });
      await updateSettings({ seatModels: { codex: { work: "x" } } });
      expect((await loadSettings()).seat).toBe("copilot");
    } finally {
      if (previous === undefined) delete process.env.CLAY_PROFILE_DIR;
      else process.env.CLAY_PROFILE_DIR = previous;
    }
  });

  test("updateSettings keeps the projects folder when seat models change", async () => {
    const previous = process.env.CLAY_PROFILE_DIR;
    process.env.CLAY_PROFILE_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "clay-profile-"));
    try {
      await saveSettings({ projectsRoot: "/tmp/x" });
      await updateSettings({ seatModels: { codex: { work: "gpt-5.5" } } });
      expect(await loadSettings()).toEqual({ projectsRoot: "/tmp/x", seatModels: { codex: { work: "gpt-5.5" } } });
    } finally {
      if (previous === undefined) delete process.env.CLAY_PROFILE_DIR;
      else process.env.CLAY_PROFILE_DIR = previous;
    }
  });
});
