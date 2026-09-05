import { test, expect } from "@playwright/test";
import { expectAccessibleScreen } from "./support/accessibility";

const HTTP_UNAUTHORIZED = 401;
const MISSING_SESSION_TEXT = "Please scan the QR code on the wall again.";

test.describe("live workshop state", () => {
  test("presenter link without a session identity explains the missing session", async ({
    page,
  }) => {
    await page.goto("/presenter");

    await expect(page.locator("body")).toContainText(MISSING_SESSION_TEXT);
    await expectAccessibleScreen(page, "wall without a session");
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
