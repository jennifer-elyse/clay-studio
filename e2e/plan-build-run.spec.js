import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// The same folder playwright.config.js passes as CLAY_APPS_DIR.
const appsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".clay-preview-apps");
const projectName = `Request tracker ${Date.now()}`;

/**
 * Removes a project this file created: its folder and its entry in the e2e profile.
 * @param {string} name
 */
async function removeProject(name) {
  const file = path.join(appsDir, "profile", "projects.json");
  const registry = JSON.parse(await fs.readFile(file, "utf8").catch(() => '{"projects":[]}'));
  const project = registry.projects.find((item) => item.name === name);
  if (!project?.folder) return;
  await fs.rm(path.join(appsDir, project.folder), { recursive: true, force: true });
  const projects = registry.projects.filter((item) => item.id !== project.id);
  const activeId = registry.activeId === project.id ? null : registry.activeId;
  await fs.writeFile(file, JSON.stringify({ ...registry, activeId, projects }, null, 2), "utf8");
}

test.afterAll(() => removeProject(projectName));

test("Plan, approve, build, and run", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What should we mold?" })).toBeVisible();

  // A new project each run: Plan and Build stay off for a project once they finish.
  await page.getByRole("combobox", { name: "Project" }).selectOption({ label: "New project…" });
  await page.getByRole("textbox", { name: "Name" }).fill(projectName);
  await page.getByRole("button", { name: "Add project" }).click();
  await expect(page.getByRole("combobox", { name: "Project" }).locator("option:checked")).toHaveText(projectName);
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await page.getByLabel("Message").press("End");
  await page.getByLabel("Message").pressSequentially("A request tracker");
  await page.getByLabel("Message").press("Enter");
  await expect(page.getByText("Needs your approval")).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved. Ready to build.")).toBeVisible();

  await page.getByRole("button", { name: "Build", exact: true }).click();
  await page.getByLabel("Message").press("Enter");
  await expect(page.getByText(/Built against/)).toBeVisible({ timeout: 15000 });

  await expect(page.getByRole("button", { name: "Chat", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTitle("App preview")).toHaveCount(0);

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByLabel("Message").press("Enter");
  // The layout switches to Preview by itself when the app is ready.
  await expect(page.getByTitle("App preview")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTitle("App preview")).toHaveAttribute("src", /127\.0\.0\.1/);
  await expect(page.getByRole("button", { name: "Preview", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("Settings opens from the header with Seat and Projects folder", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog.getByRole("tab", { name: "Seat" })).toHaveAttribute("aria-selected", "true");
  await dialog.getByRole("tab", { name: "Projects folder" }).click();
  await expect(dialog.getByRole("button", { name: "Use this folder" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Advanced seat models save, survive a reload, and reset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("radio", { name: /^Codex/ }).click();
  await dialog.getByText("Advanced options").click();
  const work = dialog.getByLabel("Plan & build model");
  await expect(work).toHaveValue("");
  await expect(work).toHaveAttribute("placeholder", "gpt-5.4");
  await work.fill("gpt-5.5");
  await dialog.getByRole("button", { name: "Save models" }).click();
  await expect(dialog.getByText("Saved. Applies to the next run.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const reopened = page.getByRole("dialog", { name: "Settings" });
  await reopened.getByRole("radio", { name: /^Codex/ }).click();
  await reopened.getByText("Advanced options").click();
  await expect(reopened.getByLabel("Plan & build model")).toHaveValue("gpt-5.5");

  await reopened.getByRole("button", { name: "Reset to defaults" }).click();
  const reset = reopened.getByLabel("Plan & build model");
  await expect(reset).toHaveValue("", { timeout: 5000 });
  await expect(reset).toHaveAttribute("placeholder", "gpt-5.4");
  await page.keyboard.press("Escape");
});

test("Blue Clay unified sculpted eye rig and persisted theme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("tab", { name: "Theme" }).click();
  await dialog.getByRole("button", { name: /Blue Clay/ }).click();
  await expect(dialog.getByRole("button", { name: /Blue Clay/ })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  const mascot = page.locator(".clay-bot-stage.is-blue").first();
  await expect(mascot.locator("img.clay-bot-clip")).toBeVisible();
  await expect(mascot.locator("img.clay-bot-clip")).toHaveAttribute("src", /assets\\/animations\\/blue/);
  await expect.poll(() => mascot.locator("img.clay-bot-clip").evaluate(img => img.naturalWidth)).toBe(320);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("clay-studio-theme"))).toBe("blue");
  await page.reload();
  await expect(page.locator(".clay-bot-stage.is-blue").first().locator("img.clay-bot-clip")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const reopened = page.getByRole("dialog", { name: "Settings" });
  await reopened.getByRole("tab", { name: "Theme" }).click();
  await reopened.getByRole("button", { name: /Purple Clay/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".clay-bot-stage.is-blue")).toHaveCount(0);
});
