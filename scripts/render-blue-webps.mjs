/**
 * Capture the SAME SVG mascot rig used by Clay Studio into crisp real animated
 * WebPs. No hand-traced CSS overlay and no 100px sprites stretched to 320px.
 * Usage: Vite on 127.0.0.1:5173; python3 -m pip install Pillow;
 *        node scripts/render-blue-webps.mjs
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMAND_CLIPS, AMBIENT_CLIPS } from "../packages/chat-sdk/src/animations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "apps/studio/public/assets/animations/blue");
const clips = [...new Set([...Object.values(COMMAND_CLIPS), ...AMBIENT_CLIPS])].sort();
const frameCount = 16;
const frameDurationMs = 200;
const server = process.env.BLUE_RENDER_URL || "http://127.0.0.1:5173";
const directory = await mkdtemp(path.join(tmpdir(), "clay-blue-render-"));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 320, height: 320 },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  for (const clip of clips) {
    const frames = path.join(directory, clip.slice(0, -5));
    await mkdir(frames, { recursive: true });
    await page.goto(`${server}/blue-render.html?clip=${encodeURIComponent(clip)}`, { waitUntil: "networkidle" });
    await page.locator('svg[data-blue-character="true"]').waitFor();
    const motion = await page.locator('svg[data-blue-character="true"]').getAttribute("data-motion");
    if (!motion) throw new Error(`Missing SVG motion for ${clip}`);
    const image = page.locator('svg[data-blue-character="true"]');
    const hashes = new Set();
    for (let i = 0; i < frameCount; i++) {
      await page.evaluate((time) => {
        for (const animation of document.getAnimations()) {
          animation.pause();
          animation.currentTime = time;
        }
      }, i * frameDurationMs);
      const png = await image.screenshot({ omitBackground: true, animations: "allow", scale: "css" });
      await writeFile(path.join(frames, `${String(i).padStart(3, "0")}.png`), png);
      hashes.add(png.toString("base64"));
    }
    if (hashes.size < 2) throw new Error(`Clip ${clip} has no observable movement`);
    const process = spawnSync("python3", [
      path.join(root, "scripts/encode-blue-webp.py"), frames, path.join(output, clip), String(frameDurationMs)
    ], { stdio: "inherit" });
    if (process.status !== 0) throw new Error(`Failed to encode ${clip}`);
    process.stdout?.toString();
    console.log(`Generated ${clip}: 320x320, ${frameCount} frames, motion=${motion}`);
  }
  console.log(`Generated ${clips.length} animated Blue Clay WebPs`);
} finally {
  await browser.close();
  await rm(directory, { recursive: true, force: true });
}
