import { test, expect } from "@playwright/test";
import { openSignedIn } from "./support/oidcLogin";

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;

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
    await openSignedIn(page, "/facilitator", "facilitator");

    await expect(page.getByLabel("Facilitator passphrase")).toBeVisible();
  });

  test("backend health endpoint accessible without auth", async ({
    request,
  }) => {
    const response = await request.get("http://localhost:5000/health");

    expect(response.status()).toBe(HTTP_OK);
  });

  test("backend rejects unauthenticated request to API route", async ({
    request,
  }) => {
    const response = await request.get("http://localhost:5000/api/anything");

    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
  });
});
