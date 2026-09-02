import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";

const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNT = "participant1";
const SESSION_NAME = "Playwright locale flip session";

async function expectDocumentLanguage(
  page: Page,
  languageTag: string,
): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("lang", languageTag);
}

test.describe.serial("locale flip", () => {
  let facilitatorContext: BrowserContext;
  let participantContext: BrowserContext;
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let participantPage: Page;
  let presenterPage: Page;
  let sessionIdentity: string;

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext();
    participantContext = await browser.newContext();
    presenterContext = await browser.newContext();

    facilitatorPage = await facilitatorContext.newPage();
    participantPage = await participantContext.newPage();
    presenterPage = await presenterContext.newPage();

    await openSignedIn(facilitatorPage, "/facilitator", FACILITATOR_ACCOUNT);
    sessionIdentity = await openSessionAsFacilitator(
      facilitatorPage,
      SESSION_NAME,
    );
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    await participantContext.close();
    await presenterContext.close();
  });

  test("the facilitator page flips to German and back", async () => {
    await expectDocumentLanguage(facilitatorPage, "en");
    await expect(
      facilitatorPage.getByRole("heading", { name: "Facilitator" }),
    ).toBeVisible();

    await facilitatorPage.getByRole("button", { name: "German" }).click();

    await expectDocumentLanguage(facilitatorPage, "de");
    await expect(
      facilitatorPage.getByRole("heading", { name: "Moderation" }),
    ).toBeVisible();

    await facilitatorPage.getByRole("button", { name: "Englisch" }).click();

    await expectDocumentLanguage(facilitatorPage, "en");
    await expect(
      facilitatorPage.getByRole("heading", { name: "Facilitator" }),
    ).toBeVisible();
  });

  test("the presenter wall flips to German and back", async () => {
    await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);

    await expectDocumentLanguage(presenterPage, "en");
    await expect(
      presenterPage.getByRole("img", { name: "Scan to join" }),
    ).toBeVisible();

    await presenterPage.getByRole("button", { name: "German" }).click();

    await expectDocumentLanguage(presenterPage, "de");
    await expect(
      presenterPage.getByRole("img", { name: "Zum Mitmachen scannen" }),
    ).toBeVisible();

    await presenterPage.getByRole("button", { name: "Englisch" }).click();

    await expectDocumentLanguage(presenterPage, "en");
    await expect(
      presenterPage.getByRole("img", { name: "Scan to join" }),
    ).toBeVisible();
  });

  test("the participant page flips to German and back", async () => {
    await participantPage.goto(
      `/participant?sessionIdentity=${sessionIdentity}`,
    );
    await signInThroughOidcProvider(participantPage, PARTICIPANT_ACCOUNT);

    await expectDocumentLanguage(participantPage, "en");
    await expect(
      participantPage.getByRole("heading", { name: "Participant" }),
    ).toBeVisible();

    await participantPage.getByRole("button", { name: "German" }).click();

    await expectDocumentLanguage(participantPage, "de");
    await expect(
      participantPage.getByRole("heading", { name: "Teilnahme" }),
    ).toBeVisible();

    await participantPage.getByRole("button", { name: "Englisch" }).click();

    await expectDocumentLanguage(participantPage, "en");
    await expect(
      participantPage.getByRole("heading", { name: "Participant" }),
    ).toBeVisible();
  });
});
