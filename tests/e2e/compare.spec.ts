import { expect, test, type Page } from "@playwright/test";

/**
 * One college column per link in the table head. Counting `columnheader`
 * roles instead would be viewport-dependent, because the row-label column is
 * hidden on small screens.
 */
const collegeColumns = (page: Page) => page.locator("thead a");

test.describe("comparing colleges", () => {
  test("selecting colleges fills the tray and opens a comparison", async ({ page }) => {
    await page.goto("/colleges");

    const compareButtons = page.getByRole("button", { name: /^Compare / });
    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();

    const tray = page.getByRole("region", { name: "Comparison selection" });
    await expect(tray).toContainText("2 of 3 selected");

    await tray.getByRole("link", { name: "Compare" }).click();

    await expect(page).toHaveURL(/\/compare\?slugs=[^,]+,[^,]+/);
    await expect(page.getByRole("heading", { level: 1, name: "Compare colleges" })).toBeVisible();
    await expect(collegeColumns(page)).toHaveCount(2);
    await expect(page.getByRole("rowheader", { name: "Annual fees (B.Tech)" })).toBeVisible();
  });

  test("at most three colleges can be selected", async ({ page }) => {
    await page.goto("/colleges");
    const compareButtons = page.getByRole("button", { name: /^Compare / });

    for (const index of [0, 1, 2]) await compareButtons.nth(index).click();

    await expect(page.getByRole("region", { name: "Comparison selection" })).toContainText(
      "3 of 3 selected",
    );
    const fourth = compareButtons.nth(3);
    await expect(fourth).toBeDisabled();
    await expect(fourth).toHaveAttribute("title", /up to 3 colleges/);
  });

  test("the selection survives navigation and can be removed from the tray", async ({ page }) => {
    await page.goto("/colleges");
    await page
      .getByRole("button", { name: /^Compare / })
      .first()
      .click();

    await page.getByRole("link", { name: "Predictor" }).click();
    const tray = page.getByRole("region", { name: "Comparison selection" });
    await expect(tray).toContainText("1 of 3 selected");

    // Tray chips read "<short name> … Remove <college> from comparison".
    await tray.getByRole("button", { name: /Remove .+ from comparison/ }).click();
    await expect(tray).toBeHidden();
  });

  test("removing a column updates the comparison and the URL", async ({ page }) => {
    await page.goto("/colleges");
    const compareButtons = page.getByRole("button", { name: /^Compare / });
    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();
    await page
      .getByRole("region", { name: "Comparison selection" })
      .getByRole("link", { name: "Compare" })
      .click();

    await expect(collegeColumns(page)).toHaveCount(2);
    await page
      .getByRole("button", { name: /^Remove / })
      .first()
      .click();

    await expect(collegeColumns(page)).toHaveCount(1);
    await expect(page.getByText("Add a second college to compare")).toBeVisible();
  });

  test("an empty comparison explains what to do", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByText("You haven’t selected any colleges yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore colleges" })).toBeVisible();
  });

  test("a link with a deleted college still shows the rest", async ({ page }) => {
    // Take a real slug from the API rather than scraping one from the page,
    // so the test doesn't depend on click-then-read-URL timing.
    const response = await page.request.get("/api/colleges?limit=1");
    const { data } = await response.json();
    const slug: string = data[0].slug;

    await page.goto(`/compare?slugs=${slug},ghost-college-that-vanished`);

    await expect(page.getByText(/couldn’t be found and was left out/)).toBeVisible();
    await expect(collegeColumns(page)).toHaveCount(1);
  });
});
