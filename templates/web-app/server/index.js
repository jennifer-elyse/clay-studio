import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { warnStack } from "../scripts/stack-versions.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || "127.0.0.1";
const dist = path.resolve(here, "../client/dist");
const client = path.resolve(here, "../client");
const built = fs.existsSync(dist);

const app = express();
app.use(express.json({ limit: "200kb" }));

app.get("/v1/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(built ? dist : client));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/v1/")) return next();
  const page = built ? path.join(dist, "index.html") : path.join(client, "fallback.html");
  res.sendFile(page);
});

app.use((_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Nothing here.", requestId: "local" });
});

if (process.env.CLAY_STACK_CHECKED !== "1") await warnStack(path.resolve(here, ".."));

app.listen(port, host, () => {
  process.stdout.write(`Clay app on http://${host}:${port}\n`);
});
