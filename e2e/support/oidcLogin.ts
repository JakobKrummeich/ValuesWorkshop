import { expect, type Page } from "@playwright/test";

const OIDC_PROVIDER_URL = /localhost:9000/;
const DEVELOPMENT_PASSWORD = "any";
const PROVIDER_TIMEOUT_MILLISECONDS = 15_000;

export async function signInThroughOidcProvider(
  page: Page,
  accountName: string,
): Promise<void> {
  await expect(page).toHaveURL(OIDC_PROVIDER_URL, {
    timeout: PROVIDER_TIMEOUT_MILLISECONDS,
  });

  await page.locator('input[name="login"]').fill(accountName);
  await page.locator('input[name="password"]').fill(DEVELOPMENT_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.getByRole("button", { name: "Continue" }).click();
}

export async function openSignedIn(
  page: Page,
  path: string,
  accountName: string,
): Promise<void> {
  await page.goto(path);
  await signInThroughOidcProvider(page, accountName);

  await expect(page).toHaveURL(`http://localhost:3000${path}`, {
    timeout: PROVIDER_TIMEOUT_MILLISECONDS,
  });
}
