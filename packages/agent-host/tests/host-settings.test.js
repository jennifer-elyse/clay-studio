import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHost } from "../src/host.js";

const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");

async function collect(iter) {
  for await (const event of iter) void event;
}

/** A fresh profile, as on a first launch. Each call to `boot` is a restart of Studio. */
async function profile() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "clay-host-settings-"));
  process.env.CLAY_PROFILE_DIR = path.join(root, "profile");
  process.env.CLAY_SESSION_PATH = path.join(root, "session.json");
  const boot = (input = {}) => {
    delete process.env.CLAY_STUDIO_SEAT;
    return createHost({ appsDir: path.join(root, "apps"), templateDir, ...input });
  };
  return { root, boot };
}

describe("settings across a restart", () => {
  const saved = { seat: process.env.CLAY_STUDIO_SEAT, profile: process.env.CLAY_PROFILE_DIR, session: process.env.CLAY_SESSION_PATH };
  afterEach(() => {
    for (const [key, name] of [["seat", "CLAY_STUDIO_SEAT"], ["profile", "CLAY_PROFILE_DIR"], ["session", "CLAY_SESSION_PATH"]]) {
      if (saved[key] === undefined) delete process.env[name];
      else process.env[name] = saved[key];
    }
  });

  test("the chosen seat comes back after a restart", async () => {
    const { boot } = await profile();
    const first = await boot({ seat: "mock" });
    await collect(first.setSeat("codex"));
    const second = await boot();
    expect(second.snapshot().seat).toBe("codex");
  });

  test("an explicit seat wins over the saved one", async () => {
    const { boot } = await profile();
    const first = await boot({ seat: "mock" });
    await collect(first.setSeat("codex"));
    const second = await boot({ seat: "copilot" });
    expect(second.snapshot().seat).toBe("copilot");
  });

  test("model overrides are saved, shown with defaults, and cleared by reset", async () => {
    const { boot } = await profile();
    const first = await boot({ seat: "mock" });
    await first.setSeatModels({ codex: { work: "gpt-5.5", fast: "" } });
    const second = await boot({ seat: "mock" });
    const view = second.seatModelSettings();
    expect(view.seatModels).toEqual({ codex: { work: "gpt-5.5" } });
    expect(view.defaults.codex.work).toBeTruthy();
    await second.setSeatModels({ codex: null });
    expect((await boot({ seat: "mock" })).seatModelSettings().seatModels).toEqual({});
  });

  test("the projects folder comes back after a restart, and a deleted one falls back to the default", async () => {
    const { root, boot } = await profile();
    const first = await boot({ seat: "mock" });
    const next = path.join(root, "elsewhere");
    await fs.mkdir(next);
    await first.setProjectsRoot(next);
    expect((await boot({ seat: "mock", appsDir: undefined })).projectsRoot).toBe(next);
    await fs.rmdir(next);
    expect((await boot({ seat: "mock", appsDir: undefined })).projectsRoot).not.toBe(next);
  });
});
