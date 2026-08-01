import { test, expect } from "@playwright/test";

const HTTP_UNAUTHORIZED = 401;
const MISSING_SESSION_TEXT =
  "This link carries no workshop session. Please scan the QR code again.";

test.describe("live workshop state", () => {
  test("presenter link without a session identity explains the missing session", async ({
    page,
  }) => {
    await page.goto("/presenter");

    await expect(page.locator("body")).toContainText(MISSING_SESSION_TEXT);
  });

  test("facilitator hub rejects a connection without a token", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:5000/hub/facilitator/negotiate?negotiateVersion=1",
    );

    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
  });

  test("facilitator hub rejects a forged query-string token", async ({
    request,
  }) => {
    const response = await request.post(
      "http://localhost:5000/hub/facilitator/negotiate?negotiateVersion=1&access_token=forged",
    );

    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
  });
});
