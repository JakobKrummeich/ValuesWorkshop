import type { Browser, BrowserContext, Page } from "@playwright/test";
import { signInThroughOidcProvider } from "./oidcLogin";

const PHONE_VIEWPORT = { width: 390, height: 844 };

export type ParticipantSession = {
  context: BrowserContext;
  page: Page;
};

export async function openParticipantSession(
  browser: Browser,
  sessionIdentity: string,
  accountName: string,
): Promise<ParticipantSession> {
  const context = await browser.newContext({ viewport: PHONE_VIEWPORT });
  const page = await context.newPage();

  await page.goto(`/participant?sessionIdentity=${sessionIdentity}`);
  await signInThroughOidcProvider(page, accountName);

  return { context, page };
}
