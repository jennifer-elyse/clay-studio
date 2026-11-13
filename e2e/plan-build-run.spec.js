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
