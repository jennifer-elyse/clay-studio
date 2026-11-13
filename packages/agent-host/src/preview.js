import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {string}
 */
export function defaultTemplateDir() {
  return path.resolve(here, "../../../templates/web-app");
}

/**
 * @returns {string}
 */
export function defaultAppsDir() {
  return path.resolve(process.env.CLAY_APPS_DIR || path.join(os.homedir(), "Clay", "apps"));
}

/**
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

/**
 * @returns {Promise<number>}
 */
export async function pickPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not bind a preview port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

/**
 * @param {string} from
 * @param {string} to
 */
async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else {
      await fs.copyFile(src, dest);
    }
  }
}

/**
 * @param {object} input
 * @param {string} input.slug
 * @param {string} [input.templateDir]
 * @param {string} [input.appsDir]
 */
export async function copyTemplate({ slug, templateDir = defaultTemplateDir(), appsDir = defaultAppsDir() }) {
  const dest = path.join(appsDir, slug);
  await fs.mkdir(appsDir, { recursive: true });
  const exists = await fs
    .access(dest)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await copyDir(templateDir, dest);
  }
  return dest;
}

/**
 * @typedef {object} PreviewHandle
 * @property {string} appDir
 * @property {number} port
 * @property {string} url
 * @property {() => Promise<void>} stop
 * @property {string[]} logs
 */

/** @type {Map<string, PreviewHandle>} */
const running = new Map();

/**
 * @param {string} command
 * @param {string[]} args
 * @param {object} opts
 * @param {string} opts.cwd
 * @param {Record<string, string | undefined>} [opts.env]
 * @param {string[]} opts.logs
 * @returns {import("node:child_process").ChildProcess}
 */
function spawnLogged(command, args, { cwd, env, logs }) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
  return child;
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {number} [input.port]
 * @param {boolean} [input.install]
 * @returns {Promise<PreviewHandle>}
 */
/**
 * Tiny localhost page used by Playwright and mock demos when the starter
 * has not been installed yet.
 * @param {number} [port]
 * @returns {Promise<PreviewHandle>}
 */
export async function startFixturePreview(port, appDir = "__fixture__") {
  const boundPort = port ?? (await pickPort());
  const logs = /** @type {string[]} */ ([]);
  const server = http.createServer((_req, res) => {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html lang="en"><title>Request tracker</title>
<body style="font-family:Helvetica,sans-serif;background:#f4e6d4;color:#3d2c24;padding:24px">
<h1>Request tracker</h1>
<p>Synthetic store requests. No customer data.</p>
<ul><li>New cooler — submitted</li><li>Extra pallet — approved</li></ul>
</body></html>`);
  });
  await new Promise((resolve, reject) => {
    server.listen(boundPort, "127.0.0.1", resolve);
    server.on("error", reject);
  });
  const handle = {
    appDir,
    port: boundPort,
    url: `http://127.0.0.1:${boundPort}`,
    logs,
    async stop() {
      await new Promise((resolve) => server.close(() => resolve(undefined)));
      running.delete(appDir);
    },
  };
  running.set(appDir, handle);
  return handle;
}

export async function startPreview({ appDir, port, install = true }) {
  const existing = running.get(appDir);
  if (existing) return existing;

  const boundPort = port ?? (await pickPort());
  const logs = /** @type {string[]} */ ([]);
  const children = [];

  if (install) {
    const hasModules = await fs
      .access(path.join(appDir, "node_modules"))
      .then(() => true)
      .catch(() => false);
    if (!hasModules) {
      await new Promise((resolve, reject) => {
        const child = spawnLogged("npm", ["install"], { cwd: appDir, logs });
        child.on("exit", (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error(`npm install failed (${code}): ${logs.slice(-8).join("")}`));
        });
        child.on("error", reject);
      });
    }
  }

  const child = spawnLogged("node", ["server/index.js"], {
    cwd: appDir,
    env: { PORT: String(boundPort), HOST: "127.0.0.1" },
    logs,
  });
  children.push(child);

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await isPortOpen(boundPort)) break;
    if (child.exitCode !== null) {
      throw new Error(`Preview exited before listen: ${logs.slice(-12).join("")}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!(await isPortOpen(boundPort))) {
    children.forEach((c) => c.kill("SIGTERM"));
    throw new Error(`Preview did not bind 127.0.0.1:${boundPort}`);
  }

  const handle = {
    appDir,
    port: boundPort,
    url: `http://127.0.0.1:${boundPort}`,
    logs,
    async stop() {
      for (const proc of children) {
        proc.kill("SIGTERM");
      }
      running.delete(appDir);
    },
  };
  running.set(appDir, handle);
  return handle;
}

/**
 * @param {string} appDir
 */
export async function stopPreview(appDir) {
  const handle = running.get(appDir);
  if (handle) await handle.stop();
}

/**
 * @param {string} appDir
 */
export function getPreview(appDir) {
  return running.get(appDir) ?? null;
}

/**
 * Tools the Cursor/Copilot agent can call without a separate MCP server.
 * @param {() => string} getAppDir
 */
export function previewTools(getAppDir) {
  return {
    start_preview: {
      description: "Start the local Clay app preview on localhost and return its URL.",
      inputSchema: {
        type: "object",
        properties: {},
      },
      /**
       * @returns {Promise<{ url: string, port: number }>}
       */
      async execute() {
        const handle = await startPreview({ appDir: getAppDir() });
        return { url: handle.url, port: handle.port };
      },
    },
    stop_preview: {
      description: "Stop the local Clay app preview.",
      inputSchema: { type: "object", properties: {} },
      async execute() {
        await stopPreview(getAppDir());
        return { stopped: true };
      },
    },
    clay_check: {
      description: "List approved plans and whether /build is allowed.",
      inputSchema: { type: "object", properties: {} },
      async execute() {
        const { listPlans, latestApprovedPlan } = await import("./plan-gate.js");
        const appDir = getAppDir();
        const plans = await listPlans(appDir);
        const approved = await latestApprovedPlan(appDir);
        return {
          plans: plans.map((plan) => ({ id: plan.id, status: plan.status, title: plan.title })),
          buildAllowed: Boolean(approved),
        };
      },
    },
  };
}
