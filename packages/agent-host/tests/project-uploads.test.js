import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHost } from "../src/host.js";
import { saveProjectFiles, uploadMessage, uploadTarget } from "../src/project-uploads.js";

const svg = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>").toString("base64");
const text = Buffer.from("A short note.").toString("base64");

describe("project uploads", () => {
  test("sorts a file by its type and drops a path", () => {
    expect(uploadTarget("../../Notes.SVG")).toEqual({ folder: "images", name: "notes.svg" });
    expect(uploadTarget("Policy.PDF")).toEqual({ folder: "docs", name: "policy.pdf" });
    expect(uploadTarget("theme.WOFF2")).toEqual({ folder: "fonts", name: "theme.woff2" });
    expect(uploadTarget("notes.exe")).toBeNull();
  });

  test("saves each kind in its public folder", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-uploads-"));
    const first = await saveProjectFiles(appDir, [
      { name: "Hero.svg", data: svg },
      { name: "hero.svg", data: svg },
      { name: "policy.pdf", data: text },
      { name: "clip.mp4", data: text },
      { name: "theme.woff", data: text },
      { name: "hello.wav", data: text },
    ]);
    expect(first).toEqual([
      "/images/hero.svg",
      "/images/hero-2.svg",
      "/docs/policy.pdf",
      "/video/clip.mp4",
      "/fonts/theme.woff",
      "/audio/hello.wav",
    ]);
    const again = await saveProjectFiles(appDir, [{ name: "hero.svg", data: svg }]);
    expect(again).toEqual(["/images/hero-3.svg"]);
    const stored = await fs.readFile(path.join(appDir, "client", "public", "images", "hero.svg"), "utf8");
    expect(stored).toContain("<svg");
    const doc = await fs.readFile(path.join(appDir, "client", "public", "docs", "policy.pdf"), "utf8");
    expect(doc).toBe("A short note.");
    expect(uploadMessage(first)).toContain("/docs/policy.pdf");
  });

  test("asks for a project before saving", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "clay-upload-host-"));
    const saved = {
      seat: process.env.CLAY_STUDIO_SEAT,
      profile: process.env.CLAY_PROFILE_DIR,
      session: process.env.CLAY_SESSION_PATH,
    };
    process.env.CLAY_STUDIO_SEAT = "mock";
    process.env.CLAY_PROFILE_DIR = path.join(root, "profile");
    process.env.CLAY_SESSION_PATH = path.join(root, "session.json");
    try {
      const host = await createHost({ appsDir: path.join(root, "apps"), seat: "mock" });
      /** @type {import("../src/events.js").UiEvent[]} */
      const seen = [];
      host.subscribe((event) => seen.push(event));
      const reply = await host.uploadFiles([]);
      expect(reply.status).toBe(400);
      expect(seen.map((event) => event.type)).toEqual(["user_text", "error"]);
      expect(seen[1].text).toBe("Name a project before adding files.");
    } finally {
      if (saved.seat === undefined) delete process.env.CLAY_STUDIO_SEAT;
      else process.env.CLAY_STUDIO_SEAT = saved.seat;
      if (saved.profile === undefined) delete process.env.CLAY_PROFILE_DIR;
      else process.env.CLAY_PROFILE_DIR = saved.profile;
      if (saved.session === undefined) delete process.env.CLAY_SESSION_PATH;
      else process.env.CLAY_SESSION_PATH = saved.session;
    }
  });
});
