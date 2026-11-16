import { expect, test } from "@playwright/test";

test("Plan, approve, build, and run", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What should we mold?" })).toBeVisible();

  await page.getByRole("button", { name: "Request tracker" }).click();
  await expect(page.getByText("Needs your approval")).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved. Ready to build.")).toBeVisible();

  await page.getByRole("button", { name: "Build", exact: true }).click();
  await page.getByLabel("Message").press("Enter");
  await expect(page.getByText(/Built against/)).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.getByLabel("Message").press("Enter");
  await expect(page.getByTitle("App preview")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTitle("App preview")).toHaveAttribute("src", /127\.0\.0\.1/);
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
  await expect(work).toHaveValue("gpt-5.4");
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
  await expect(reopened.getByLabel("Plan & build model")).toHaveValue("gpt-5.4", { timeout: 5000 });
  await page.keyboard.press("Escape");
});
