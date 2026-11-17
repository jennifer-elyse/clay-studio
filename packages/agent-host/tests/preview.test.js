import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {
  containPreview,
  copyTemplate,
  defaultAppsDir,
  getPreview,
  isInsideRepo,
  isPortOpen,
  onPreviewCrash,
  pickPort,
  PREVIEW_STOPPED,
  startPreview,
  stopPreview,
  studioRoot,
} from "../src/preview.js";

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
    for (const name of ["docs/design.md", "docs/code.md", "docs/erd.md", "AGENTS.md", "README.md"]) {
      const text = await fs.readFile(path.join(dest, name), "utf8");
      expect(text.length).toBeGreaterThan(10);
    }
    const server = await fs.readFile(path.join(dest, "server", "index.js"), "utf8");
    expect(server).toContain("express");
    const vite = await fs.readFile(path.join(dest, "client", "vite.config.js"), "utf8");
    expect(vite).toContain("defineConfig");
    const ignore = await fs.readFile(path.join(dest, ".gitignore"), "utf8");
    expect(ignore).toContain("node_modules/");
    expect(ignore).toContain(".env");
    expect(ignore).toContain("dist");
    const dockerignore = await fs.readFile(path.join(dest, ".dockerignore"), "utf8");
    expect(dockerignore).toContain("node_modules");
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
    const pkg = JSON.parse(await fs.readFile(path.join(dest, "package.json"), "utf8"));
    expect(pkg.dependencies.react).toBe("^19.3.1");
    expect(pkg.dependencies["react-dom"]).toBe("^19.3.1");
    const lint = await fs.readFile(path.join(dest, "eslint.config.js"), "utf8");
    expect(lint).toContain("eslint-plugin-react-hooks");
    expect(lint).toContain("recommended");
    const rule = await fs.readFile(path.join(dest, ".cursor", "rules", "clay-code.mdc"), "utf8");
    expect(rule).toContain("React 19");
    expect(rule).toContain("useActionState");
    const constitution = await fs.readFile(path.join(dest, "docs", "code.md"), "utf8");
    expect(constitution).toContain("## React");
    expect(constitution).toContain("^19.3.1");
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

  test("serves the client index through Vite", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-prev-"));
    const port = await pickPort();
    await fs.writeFile(path.join(appDir, "package.json"), '{"type":"module"}\n', "utf8");
    await fs.mkdir(path.join(appDir, "server"), { recursive: true });
    await fs.mkdir(path.join(appDir, "client"), { recursive: true });
    await fs.mkdir(path.join(appDir, "node_modules", "vite", "bin"), { recursive: true });
    await fs.writeFile(
      path.join(appDir, "server", "index.js"),
      `import http from "node:http";
const port = Number(process.env.PORT);
http.createServer((req, res) => { res.end("api"); }).listen(port, "127.0.0.1");
`,
      "utf8",
    );
    await fs.writeFile(path.join(appDir, "client", "vite.config.js"), "export default {};\n", "utf8");
    await fs.writeFile(path.join(appDir, "client", "index.html"), "<!doctype html><h1>Clay</h1>\n", "utf8");
    await fs.writeFile(
      path.join(appDir, "node_modules", "vite", "bin", "vite.js"),
      `import http from "node:http";
const flag = process.argv.indexOf("--port");
const port = Number(process.argv[flag + 1]);
const api = process.env.CLAY_API_PORT;
http.createServer((req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end("<!doctype html><h1>Clay</h1><p>index " + api + "</p>");
}).listen(port, "127.0.0.1");
`,
      "utf8",
    );
    const handle = await startPreview({ appDir, port, install: false });
    const body = await new Promise((resolve, reject) => {
      http.get(handle.url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }).on("error", reject);
    });
    expect(String(body)).toContain("<h1>Clay</h1>");
    expect(String(body)).not.toContain("api");
    expect(String(body)).toMatch(/index \d+/);
    await stopPreview(appDir);
  });

  test("a crashed app stays a short preview message", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-prev-"));
    await fs.mkdir(path.join(appDir, "server"), { recursive: true });
    await fs.writeFile(
      path.join(appDir, "server", "index.js"),
      "process.stderr.write('Open npm advisories:\\nprototype poisoning\\n'); process.exit(1);\n",
      "utf8",
    );
    const opened = await containPreview({ appDir, install: false });
    expect(opened).toEqual({ ok: false, message: PREVIEW_STOPPED });
    expect(opened.ok ? "" : opened.message).not.toMatch(/advisories|poisoning/);
  });

  test("a running app that exits is not started again", async () => {
    const appDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-prev-"));
    const port = await pickPort();
    await fs.mkdir(path.join(appDir, "server"), { recursive: true });
    await fs.writeFile(
      path.join(appDir, "server", "index.js"),
      `import http from "node:http";
const port = Number(process.env.PORT);
const server = http.createServer((req, res) => { res.end("ok"); });
server.listen(port, "127.0.0.1", () => {
  setTimeout(() => server.close(() => process.exit(1)), 200);
});
`,
      "utf8",
    );
    let crashes = 0;
    const stop = onPreviewCrash((dir) => {
      if (dir === appDir) crashes += 1;
    });
    try {
      await startPreview({ appDir, port, install: false });
      const deadline = Date.now() + 2000;
      while (crashes === 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      expect(crashes).toBe(1);
      expect(getPreview(appDir)).toBeNull();
      expect(await isPortOpen(port)).toBe(false);
    } finally {
      stop();
      await stopPreview(appDir);
    }
  });
});
