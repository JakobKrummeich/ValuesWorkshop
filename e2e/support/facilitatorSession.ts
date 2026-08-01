import { expect, type Page } from "@playwright/test";

export const DEVELOPMENT_FACILITATOR_PASSPHRASE = "dev-facilitator-passphrase";

const SESSION_CREATION_URL = "http://localhost:5000/api/sessions";
const OPENED_SESSION_URL = /\/facilitator\?sessionIdentity=[0-9a-f-]{36}$/;
const SESSION_CREATION_TIMEOUT_MILLISECONDS = 15_000;

export async function submitOpenSessionForm(
  page: Page,
  sessionName: string,
  passphrase: string,
): Promise<void> {
  await page.getByLabel("Session name").fill(sessionName);
  await page.getByLabel("Facilitator passphrase").fill(passphrase);
  await page.getByRole("button", { name: "Open session" }).click();
}

export function waitForSessionCreationResponse(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.url() === SESSION_CREATION_URL &&
      response.request().method() === "POST",
  );
}

export async function openSessionAsFacilitator(
  page: Page,
  sessionName: string,
): Promise<string> {
  await submitOpenSessionForm(
    page,
    sessionName,
    DEVELOPMENT_FACILITATOR_PASSPHRASE,
  );

  await expect(page).toHaveURL(OPENED_SESSION_URL, {
    timeout: SESSION_CREATION_TIMEOUT_MILLISECONDS,
  });

  return sessionIdentityOf(page.url());
}

function sessionIdentityOf(pageUrl: string): string {
  const sessionIdentity = new URL(pageUrl).searchParams.get("sessionIdentity");

  if (sessionIdentity === null) {
    throw new Error(`No session identity in the facilitator URL: ${pageUrl}`);
  }

  return sessionIdentity;
}
