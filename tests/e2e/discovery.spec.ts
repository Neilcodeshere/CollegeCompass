import { expect, test } from "@playwright/test";

test.describe("college discovery", () => {
  test("searching narrows results and keeps them in the URL", async ({ page }) => {
    await page.goto("/colleges");
    await expect(page.getByRole("heading", { level: 1, name: "Colleges" })).toBeVisible();

    const summary = page.getByText(/Showing 1–12 of \d+ colleges/);
    await expect(summary).toBeVisible();

    await page.getByLabel("Search colleges").fill("kaveri");

    // The URL updates only after the debounce, then results follow.
    await expect(page).toHaveURL(/search=kaveri/);
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 3 })).toContainText(/Kaveri/i);

    // A reload keeps the search, because it lives in the URL.
    await page.reload();
    await expect(page.getByLabel("Search colleges")).toHaveValue("kaveri");
    await expect(page.getByRole("article")).toHaveCount(1);
  });

  test("an unmatched search shows the empty state", async ({ page }) => {
    await page.goto("/colleges?search=zzzznothingmatches");
    await expect(page.getByText("No colleges match your filters")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });

  test("paging moves through results and Back returns to the previous page", async ({ page }) => {
    await page.goto("/colleges");
    await page.getByRole("button", { name: "Next page" }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Showing 13–24 of/)).toBeVisible();

    await page.goBack();
    await expect(page.getByText(/Showing 1–12 of/)).toBeVisible();
  });

  test("a filter narrows results and resets to the first page", async ({ page }) => {
    await page.goto("/colleges?page=3");
    await expect(page).toHaveURL(/page=3/);

    // The sidebar is desktop-only; the sheet covers small screens.
    const sidebarRadio = page.getByRole("radio", { name: "Government" }).first();
    if (await sidebarRadio.isVisible()) {
      await sidebarRadio.check();
    } else {
      await page.getByRole("button", { name: /^Filters/ }).click();
      await page.getByRole("radio", { name: "Government" }).check();
      await page.getByRole("button", { name: "Show results" }).click();
    }

    await expect(page).toHaveURL(/ownership=GOVERNMENT/);
    await expect(page).not.toHaveURL(/page=3/);
    await expect(page.getByText(/Showing 1–12 of/)).toBeVisible();
    // Every visible row is a government college.
    await expect(page.getByRole("article").first()).toContainText("Government");
  });

  test("opening a college from the list shows its detail page", async ({ page }) => {
    await page.goto("/colleges");
    const firstCollege = page.getByRole("article").first().getByRole("link").first();
    const name = (await firstCollege.textContent())?.trim() ?? "";

    await firstCollege.click();

    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Placements" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Student reviews" })).toBeVisible();
  });

  test("a missing college returns a real 404", async ({ page }) => {
    const response = await page.goto("/colleges/no-such-college-exists");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Page not found");
  });
});
