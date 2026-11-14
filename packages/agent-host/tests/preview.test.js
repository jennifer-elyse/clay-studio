import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { copyTemplate, defaultAppsDir, isInsideRepo, pickPort, startPreview, stopPreview, studioRoot } from "../src/preview.js";

describe("preview supervisor", () => {
  test("puts a new project outside Clay and keeps directory permissions", async () => {
    const previous = process.env.CLAY_APPS_DIR;
    delete process.env.CLAY_APPS_DIR;
    const root = studioRoot();
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-copy-"));
    const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");
    try {
      expect(isInsideRepo(defaultAppsDir(), root)).toBe(false);
      expect(defaultAppsDir()).toBe(path.resolve(root, ".."));
      process.env.CLAY_APPS_DIR = root;
      expect(() => defaultAppsDir()).toThrow(/outside/);
      await expect(copyTemplate({ slug: "inside", appsDir: root, templateDir })).rejects.toThrow(/outside/);
      const dest = await copyTemplate({ slug: "copied", appsDir, templateDir });
      expect(isInsideRepo(dest, root)).toBe(false);
      const templateMode = (await fs.stat(templateDir)).mode & 0o777;
      const destMode = (await fs.stat(dest)).mode & 0o777;
      expect(destMode).toBe(templateMode);
      const readmeMode = (await fs.stat(path.join(templateDir, "README.md"))).mode & 0o777;
      const copiedMode = (await fs.stat(path.join(dest, "README.md"))).mode & 0o777;
      expect(copiedMode).toBe(readmeMode);
    } finally {
      if (previous === undefined) delete process.env.CLAY_APPS_DIR;
      else process.env.CLAY_APPS_DIR = previous;
    }
  });

  test("copies the template without node_modules", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-copy-"));
    const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");
    const dest = await copyTemplate({ slug: "copied", appsDir, templateDir });
    const vision = await fs.readFile(path.join(dest, "docs", "vision.md"), "utf8");
    expect(vision.length).toBeGreaterThan(10);
    const dockerfile = await fs.readFile(path.join(dest, "Dockerfile"), "utf8");
    expect(dockerfile).toContain("syntax=docker/dockerfile:1.6");
    expect(dockerfile).toContain("node:22-alpine3.23");
    expect(dockerfile).toContain("AS builder");
    expect(dockerfile).toContain("AS runner");
    expect(dockerfile).toContain("npm ci --omit=dev");
    expect(dockerfile).toContain("apk upgrade --no-cache");
    expect(dockerfile).toContain("ENV PORT=8080");
    expect(dockerfile).toContain('CMD ["node", "server/index.js"]');
    expect(dockerfile).toContain("client/dist");
    expect(dockerfile).not.toContain("SITE_TEMPLATE");
    await fs.rm(path.join(dest, "Dockerfile"));
    const again = await copyTemplate({ slug: "copied", appsDir, templateDir });
    const restored = await fs.readFile(path.join(again, "Dockerfile"), "utf8");
    expect(restored).toContain('CMD ["node", "server/index.js"]');
  });

  test("starts a tiny localhost server", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-prev-"));
    const port = await pickPort();
    await fs.mkdir(path.join(appDir, "server"), { recursive: true });
    await fs.writeFile(
      path.join(appDir, "server", "index.js"),
      `import http from "node:http";
const port = Number(process.env.PORT);
http.createServer((req, res) => { res.end("ok"); }).listen(port, "127.0.0.1");
`,
      "utf8",
    );
    const handle = await startPreview({ appDir, port, install: false });
    const body = await new Promise((resolve, reject) => {
      http.get(handle.url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }).on("error", reject);
    });
    expect(body).toBe("ok");
    await stopPreview(appDir);
  });
});
