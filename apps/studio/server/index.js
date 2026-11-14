import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createHost } from "@cswg/agent-host";
import { browseDirectories, DirectoryQuery } from "@cswg/agent-host/directories";
import { warnStack } from "../../../scripts/stack-versions.js";
import { openRunningApp } from "./open-preview.js";
import { attachSocket } from "./ws.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CLAY_HOST_PORT || 8787);
const app = express();
app.use(express.json({ limit: "1mb" }));

const host = await createHost({
  slug: process.env.CLAY_APP_SLUG,
  seat: process.env.CLAY_STUDIO_SEAT,
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ...host.snapshot() });
});

app.get("/api/directories", async (req, res) => {
  const parsed = DirectoryQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ code: "BAD_REQUEST", message: "Give a folder to browse.", requestId: "directories" });
    return;
  }
  try {
    res.json(await browseDirectories(parsed.data));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "";
    const missing = code === "ENOTDIR";
    res.status(missing ? 404 : 400).json({
      code: missing ? "NOT_FOUND" : "BAD_REQUEST",
      message: error instanceof Error ? error.message : "That folder is not available.",
      requestId: "directories",
    });
  }
});

app.get("/api/session", (_req, res) => {
  res.json(host.snapshot());
});

app.post("/api/preview/open", (_req, res) => {
  const result = openRunningApp(host.snapshot().preview?.url, process.platform);
  if (!result.ok) {
    res.status(409).json({ code: result.code, message: result.message, requestId: "preview-open" });
    return;
  }
  res.json({ ok: true, url: result.url });
});

app.post("/api/auth/cursor", async (_req, res) => {
  try {
    if (host.adapter.login) await host.adapter.login();
    res.json({ ok: true, seat: "cursor" });
  } catch (error) {
    res.status(500).json({
      code: "AUTH_FAILED",
      message: error instanceof Error ? error.message : "Login failed",
      requestId: "auth-cursor",
    });
  }
});

if (process.env.CLAY_SERVE_UI === "1") {
  const dist = path.resolve(here, "../dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

if (process.env.CLAY_STACK_CHECKED !== "1") await warnStack(path.resolve(here, "../../.."));

const server = http.createServer(app);
attachSocket(server, host);

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Clay host on http://127.0.0.1:${port}\n`);
});
