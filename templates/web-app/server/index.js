import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { openDb } from "./db.js";
import { registerRequests } from "./requests.js";
import { respondError } from "./respond.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || "127.0.0.1";

const app = express();
app.use(express.json({ limit: "200kb" }));

app.get("/v1/health", (_req, res) => {
  res.json({ ok: true });
});

registerRequests(app);

const dist = path.resolve(here, "../client/dist");
const fallback = path.resolve(here, "../client/fallback.html");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/v1/")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
} else {
  app.use(express.static(path.resolve(here, "../client")));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/v1/")) return next();
    res.sendFile(fallback);
  });
}

app.use((req, res) => {
  respondError(req, res, "NOT_FOUND", "Nothing here.");
});

await openDb();
app.listen(port, host, () => {
  process.stdout.write(`Clay app on http://${host}:${port}\n`);
});
