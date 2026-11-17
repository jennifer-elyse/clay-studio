import { settingsFromLoad } from "../src/save-settings.js";

const loaded = {
  ok: true,
  settings: {
    projectsRoot: "/tmp/old",
    seatModels: {},
    defaults: {
      cursor: { work: "claude", build: "grok", fast: "composer" },
      codex: { work: "gpt", build: "gpt", fast: "mini" },
      copilot: { work: "sol", build: "sol", fast: "luna" },
    },
  },
};

describe("settingsFromLoad", () => {
  test("keeps a load that is still the latest request", () => {
    expect(settingsFromLoad(0, 0, loaded)).toEqual(loaded.settings);
  });

  test("drops a load that finished after a save", () => {
    expect(settingsFromLoad(0, 1, loaded)).toBeNull();
  });

  test("drops a failed load", () => {
    expect(settingsFromLoad(0, 0, { ok: false, message: "Could not load settings." })).toBeNull();
  });
});
