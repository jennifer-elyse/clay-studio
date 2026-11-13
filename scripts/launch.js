import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { browserOpen, launchSteps, npmBin, STUDIO_URL } from "./launch-plan.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const studioDir = path.join(root, "apps", "studio");

/**
 * @param {string} url
 */
async function isHealthy(url) {
  try {
    const response = await fetch(`${url}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
      },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${path.basename(command)} ${args.join(" ")} failed (${code ?? "signal"})`));
    });
  });
}

/**
 * @param {string} url
 */
function openBrowser(url) {
  const opener = browserOpen(url, process.platform);
  const child = spawn(opener.command, opener.args, { stdio: "ignore", detached: true });
  child.unref();
}

/**
 * @param {string[]} steps
 */
export function describeSteps(steps) {
  const lines = ["Clay Studio"];
  if (steps.includes("install") || steps.includes("build")) {
    lines.push("First open installs Clay Studio. That can take a few minutes.");
  }
  if (steps[0] === "open") lines.push("Already running. Opening it in your browser.");
  lines.push(STUDIO_URL);
  if (steps.includes("start")) lines.push("Leave this window open. Closing it stops Clay Studio.");
  return lines.join("\n");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const healthy = await isHealthy(STUDIO_URL);
  const installed = fs.existsSync(path.join(root, "node_modules", "@cswg", "clay-studio"));
  const built = fs.existsSync(path.join(studioDir, "dist", "index.html"));
  const steps = launchSteps({ healthy, installed, built });
  process.stdout.write(`${describeSteps(steps)}\n\n`);
  if (dryRun) {
    process.stdout.write(`${steps.join(" ")}\n`);
    return;
  }

  const npm = npmBin(process.execPath, process.platform);
  if (steps.includes("install")) {
    process.stdout.write("Installing…\n");
    await run(npm, ["install"], root);
  }
  if (steps.includes("build")) {
    process.stdout.write("Preparing the app…\n");
    await run(npm, ["run", "build", "-w", "@cswg/clay-studio"], root);
  }
  if (!steps.includes("start")) {
    openBrowser(STUDIO_URL);
    return;
  }

  const server = spawn(process.execPath, ["server/index.js"], {
    cwd: studioDir,
    stdio: "inherit",
    env: {
      ...process.env,
      CLAY_SERVE_UI: "1",
      PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
  const ready = await new Promise((resolve) => {
    const giveUp = setTimeout(() => {
      clearInterval(poll);
      resolve(false);
    }, 60000);
    const poll = setInterval(async () => {
      if (server.exitCode !== null) {
        clearInterval(poll);
        clearTimeout(giveUp);
        resolve(false);
        return;
      }
      if (await isHealthy(STUDIO_URL)) {
        clearInterval(poll);
        clearTimeout(giveUp);
        resolve(true);
      }
    }, 400);
  });
  if (!ready) {
    server.kill("SIGTERM");
    throw new Error("Clay Studio did not start. Look at the messages above.");
  }
  openBrowser(STUDIO_URL);
  await new Promise((resolve) => server.on("exit", resolve));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Clay Studio did not start."}\n`);
    process.exit(1);
  });
}
