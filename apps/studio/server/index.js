import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createHost } from "@cswg/agent-host";
import { attachSocket } from "./ws.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CLAY_HOST_PORT || 8787);
const slug = process.env.CLAY_APP_SLUG || "studio-app";

const app = express();
app.use(express.json({ limit: "1mb" }));

const host = await createHost({ slug, seat: process.env.CLAY_STUDIO_SEAT });

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ...host.snapshot() });
});

app.get("/api/session", (_req, res) => {
  res.json(host.snapshot());
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

const server = http.createServer(app);
attachSocket(server, host);

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Clay host on http://127.0.0.1:${port}\n`);
});
