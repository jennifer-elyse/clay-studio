#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const studio = path.resolve(here, "..");
const child = spawn(process.execPath, ["server/index.js"], {
  cwd: studio,
  env: { ...process.env, CLAY_SERVE_UI: "1" },
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
