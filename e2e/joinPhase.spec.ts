import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import { decodeQrCode } from "./support/qrCode";

const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNT = "participant1";
const PARTICIPANT_DISPLAY_NAME = "Alice";
const SESSION_NAME = "Playwright join session";

test.describe.serial("phase 1 join", () => {
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
    await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    await participantContext.close();
    await presenterContext.close();
  });

  test("the presenter invites with a QR code and an empty lobby", async () => {
    await expect(presenterPage.getByRole("img", { name: "Scan to join" })).toBeVisible();
    await expect(presenterPage.getByText("Nobody has joined yet")).toBeVisible();
    await expect(presenterPage.getByTestId("participant-count")).toHaveText(
      "Participants: 0",
    );
  });

  test("scanning the QR code leads into the lobby of this session", async () => {
    const scanned = await decodeQrCode(presenterPage.getByRole("img", { name: "Scan to join" }));

    expect(scanned).toBe(
      `http://localhost:3000/participant?sessionIdentity=${sessionIdentity}`,
    );

    await participantPage.goto(scanned);
    await signInThroughOidcProvider(participantPage, PARTICIPANT_ACCOUNT);

    await expect(participantPage.getByTestId("own-display-name")).toHaveText(
      `You are in, ${PARTICIPANT_DISPLAY_NAME}.`,
    );
    await expect(
      participantPage.getByText("Waiting for the workshop to start"),
    ).toBeVisible();
  });

  test("the presenter shows the joined name without a reload", async () => {
    await expect(presenterPage.getByTestId("joined-names")).toHaveText(
      PARTICIPANT_DISPLAY_NAME,
    );
    await expect(presenterPage.getByTestId("participant-count")).toHaveText(
      "Participants: 1",
    );
  });

  test("the facilitator shows the same roster and can copy the join url", async () => {
    await expect(facilitatorPage.getByTestId("joined-names")).toHaveText(
      PARTICIPANT_DISPLAY_NAME,
    );
    await expect(facilitatorPage.getByTestId("participant-count")).toHaveText(
      "Participants: 1",
    );

    await facilitatorContext.grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);
    await facilitatorPage
      .getByRole("button", { name: "Copy join link" })
      .click();

    await expect(facilitatorPage.getByText("Link copied")).toBeVisible();
    expect(
      await facilitatorPage.evaluate(() => navigator.clipboard.readText()),
    ).toBe(
      `http://localhost:3000/participant?sessionIdentity=${sessionIdentity}`,
    );
  });
});
