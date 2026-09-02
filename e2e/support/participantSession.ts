import type { Browser, BrowserContext, Page } from "@playwright/test";
import { signInThroughOidcProvider } from "./oidcLogin";
import { PHONE_VIEWPORT } from "./viewports";

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

export async function withParticipant(
  browser: Browser,
  sessionIdentity: string,
  accountName: string,
  interact: (page: Page) => Promise<void>,
): Promise<void> {
  const { context, page } = await openParticipantSession(
    browser,
    sessionIdentity,
    accountName,
  );
  try {
    await interact(page);
  } finally {
    await context.close();
  }
}
