import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadSettings, saveSettings, updateSettings } from "../src/settings.js";

describe("settings", () => {
  test("settings round-trip through the profile, and a patch keeps what was saved", async () => {
    const previous = process.env.CLAY_PROFILE_DIR;
    process.env.CLAY_PROFILE_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "clay-profile-"));
    try {
      expect(await loadSettings()).toEqual({});
      await saveSettings({ seat: "codex" });
      await updateSettings({ seat: "copilot" });
      expect(await loadSettings()).toEqual({ seat: "copilot" });
    } finally {
      if (previous === undefined) delete process.env.CLAY_PROFILE_DIR;
      else process.env.CLAY_PROFILE_DIR = previous;
    }
  });
});
