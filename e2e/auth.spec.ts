import { test, expect } from "@playwright/test";

test.describe("OIDC authentication", () => {
  test("facilitator page redirects to OIDC login", async ({ page }) => {
    await page.goto("/facilitator");

    await expect(page).toHaveURL(/localhost:9000/, { timeout: 10_000 });
  });

  test("participant page redirects to OIDC login", async ({ page }) => {
    await page.goto("/participant");

    await expect(page).toHaveURL(/localhost:9000/, { timeout: 10_000 });
  });

  test("presenter page loads without auth redirect", async ({ page }) => {
    await page.goto("/presenter");

    await expect(page).toHaveURL(/\/presenter/);
    await expect(page.locator("body")).not.toContainText(
      "Checking authentication",
    );
  });

  test("scripted login against dev provider reaches facilitator page", async ({
    page,
  }) => {
    await page.goto("/facilitator");

    await expect(page).toHaveURL(/localhost:9000/, { timeout: 10_000 });

    await page.locator('input[name="login"]').fill("facilitator");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/localhost:9000/, { timeout: 5_000 });
    const submitButton = page.locator(
      'button[type="submit"], button[name="confirm"]',
    );
    if (await submitButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitButton.click();
    }

    await expect(page).toHaveURL(/\/facilitator/, { timeout: 10_000 });
  });

  test("backend health endpoint accessible without auth", async ({
    request,
  }) => {
    const response = await request.get("http://localhost:5000/health");

    expect(response.status()).toBe(200);
  });

  test("backend protected endpoint rejects unauthenticated request", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/protected-test",
    );

    expect(response.status()).toBe(401);
  });
});
