import { expect, test } from "@playwright/test";

test.describe("college predictor", () => {
  test("invalid input is explained and never reaches the URL", async ({ page }) => {
    await page.goto("/predictor");
    await page.getByRole("button", { name: "Find colleges" }).click();

    await expect(page.getByText("Choose an entrance exam.")).toBeVisible();
    await expect(page.getByText("Enter your rank.")).toBeVisible();
    await expect(page).toHaveURL(/\/predictor$/);

    await page.getByLabel("Entrance exam").selectOption("KCET");
    await page.getByLabel("Your rank").fill("abc");
    await page.getByRole("button", { name: "Find colleges" }).click();
    await expect(page.getByText("Rank must be a number.")).toBeVisible();

    await page.getByLabel("Your rank").fill("400000");
    await page.getByRole("button", { name: "Find colleges" }).click();
    await expect(page.getByText("KCET ranks go up to 3,00,000.")).toBeVisible();
  });

  test("a rank returns banded matches and a shareable URL", async ({ page }) => {
    await page.goto("/predictor");

    await page.getByLabel("Entrance exam").selectOption("MHT_CET");
    await page.getByLabel("Your rank").fill("12450");
    await page.getByRole("button", { name: "Find colleges" }).click();

    await expect(page).toHaveURL(/exam=MHT_CET&rank=12450/);
    await expect(page.getByText(/colleges match rank 12,450 in MHT CET/)).toBeVisible();

    const likely = page.getByRole("heading", { name: /^Likely/ });
    await expect(likely).toBeVisible();

    // Each result names the branches that match and their closing rank.
    const firstCard = page.getByRole("article").first();
    await expect(firstCard).toContainText("Matching branches");
    await expect(firstCard.getByRole("link", { name: "View college" })).toBeVisible();
  });

  test("a shared prediction link renders its results", async ({ page }) => {
    await page.goto("/predictor?exam=JEE_MAIN&rank=45000&category=OBC");

    await expect(page.getByLabel("Entrance exam")).toHaveValue("JEE_MAIN");
    await expect(page.getByLabel("Your rank")).toHaveValue("45000");
    await expect(page.getByLabel("Category")).toHaveValue("OBC");
    await expect(page.getByText(/colleges match rank 45,000 in JEE Main/)).toBeVisible();
  });

  test("a rank beyond every cutoff explains that nothing matched", async ({ page }) => {
    await page.goto("/predictor?exam=MHT_CET&rank=400000");
    await expect(page.getByText("No matching colleges were found")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });

  test("a predicted college can be added to the comparison", async ({ page }) => {
    await page.goto("/predictor?exam=MHT_CET&rank=12450");

    await page
      .getByRole("article")
      .first()
      .getByRole("button", { name: /^Compare / })
      .click();

    await expect(page.getByRole("region", { name: "Comparison selection" })).toContainText(
      "1 of 3 selected",
    );
  });
});
