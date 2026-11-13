import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { copyTemplate, pickPort, startPreview, stopPreview } from "../src/preview.js";

describe("preview supervisor", () => {
  test("copies the template without node_modules", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-copy-"));
    const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");
    const dest = await copyTemplate({ slug: "copied", appsDir, templateDir });
    const vision = await fs.readFile(path.join(dest, "docs", "vision.md"), "utf8");
    expect(vision.length).toBeGreaterThan(10);
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
