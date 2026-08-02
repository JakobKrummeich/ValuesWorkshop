import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  openSessionAsFacilitator,
  submitOpenSessionForm,
  waitForSessionCreationResponse,
} from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import { isPageStillMarked, markPage } from "./support/pageMarker";

const HTTP_UNAUTHORIZED = 401;
const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNT = "participant1";
const OTHER_FACILITATOR_ACCOUNT = "participant2";
const WRONG_PASSPHRASE = "not-the-facilitator-passphrase";
const SESSION_NAME = "Playwright lifecycle session";
const RECONNECT_TIMEOUT_MILLISECONDS = 90_000;
const RESTART_TEST_TIMEOUT_MILLISECONDS = 180_000;

const runCommand = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, "..");

test.describe.serial("session lifecycle and reconnect", () => {
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
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    await participantContext.close();
    await presenterContext.close();
  });

  test("a wrong facilitator passphrase opens no session and keeps the form", async () => {
    await openSignedIn(facilitatorPage, "/facilitator", FACILITATOR_ACCOUNT);

    const creationResponse = waitForSessionCreationResponse(facilitatorPage);
    await submitOpenSessionForm(facilitatorPage, SESSION_NAME, WRONG_PASSPHRASE);

    expect((await creationResponse).status()).toBe(HTTP_UNAUTHORIZED);
    await expect(
      facilitatorPage.getByText("That facilitator passphrase was not accepted."),
    ).toBeVisible();
    await expect(facilitatorPage).toHaveURL("http://localhost:3000/facilitator");
    await expect(facilitatorPage.getByLabel("Facilitator passphrase")).toBeVisible();
  });

  test("the correct passphrase opens a session and lands on the facilitator screen", async () => {
    sessionIdentity = await openSessionAsFacilitator(
      facilitatorPage,
      SESSION_NAME,
    );

    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 1");
    await expect(facilitatorPage.getByTestId("connection")).toHaveText(
      "connected",
    );
  });

  test("the participant and the presenter see the opened session", async () => {
    await openSignedIn(
      participantPage,
      participantPath(sessionIdentity),
      PARTICIPANT_ACCOUNT,
    );
    await presenterPage.goto(presenterPath(sessionIdentity));

    await expect(participantPage.getByTestId("phase")).toHaveText("Phase 1");
    await expect(presenterPage.getByTestId("phase")).toHaveText("Phase 1");
  });

  test("advancing the phase re-renders participant and presenter without a reload", async () => {
    await markPage(participantPage);
    await markPage(presenterPage);

    await facilitatorPage.getByRole("button", { name: "Advance phase" }).click();

    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 2");
    await expect(participantPage.getByTestId("phase")).toHaveText("Phase 2");
    await expect(presenterPage.getByTestId("phase")).toHaveText("Phase 2");

    expect(await isPageStillMarked(participantPage)).toBe(true);
    expect(await isPageStillMarked(presenterPage)).toBe(true);
  });

  test("all three clients reconnect after a backend restart and show the same phase", async () => {
    test.setTimeout(RESTART_TEST_TIMEOUT_MILLISECONDS);

    const pages = [facilitatorPage, participantPage, presenterPage];
    for (const page of pages) {
      await markPage(page);
    }

    const droppedConnections = pages.map((page) =>
      page.waitForFunction(
        () =>
          document.querySelector('[data-testid="connection"]')?.textContent !==
          "connected",
        undefined,
        { timeout: RECONNECT_TIMEOUT_MILLISECONDS },
      ),
    );

    await restartBackend();

    for (const droppedConnection of droppedConnections) {
      await droppedConnection;
    }

    for (const page of pages) {
      await expect(page.getByTestId("connection")).toHaveText("connected", {
        timeout: RECONNECT_TIMEOUT_MILLISECONDS,
      });
      await expect(page.getByTestId("phase")).toHaveText("Phase 2", {
        timeout: RECONNECT_TIMEOUT_MILLISECONDS,
      });
      expect(await isPageStillMarked(page)).toBe(true);
    }
  });

  test("closing and reopening the facilitator tab restores control without the passphrase", async () => {
    await facilitatorPage.close();

    facilitatorPage = await facilitatorContext.newPage();
    await facilitatorPage.goto(facilitatorPath(sessionIdentity));

    await expect(
      facilitatorPage.getByRole("button", { name: "Advance phase" }),
    ).toBeVisible();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 2");
    await expect(facilitatorPage.getByTestId("connection")).toHaveText(
      "connected",
    );
    await expect(
      facilitatorPage.getByLabel("Facilitator passphrase"),
    ).toHaveCount(0);
  });

  test("another signed-in user gets no facilitator control over the session", async ({
    browser,
  }) => {
    const intruderContext = await browser.newContext();

    try {
      const intruderPage = await intruderContext.newPage();

      await intruderPage.goto(facilitatorPath(sessionIdentity));
      await signInThroughOidcProvider(intruderPage, OTHER_FACILITATOR_ACCOUNT);

      await expect(intruderPage.getByTestId("connection")).toHaveText(
        "disconnected",
      );
      await expect(intruderPage.getByTestId("phase")).toHaveText(
        "Waiting for the workshop\u2026",
      );
    } finally {
      await intruderContext.close();
    }
  });
});

async function restartBackend(): Promise<void> {
  await runCommand(
    "docker",
    ["compose", "-f", "docker-compose.dev.yml", "restart", "backend"],
    { cwd: repositoryRoot },
  );
}

function facilitatorPath(identity: string): string {
  return `/facilitator?sessionIdentity=${identity}`;
}

function participantPath(identity: string): string {
  return `/participant?sessionIdentity=${identity}`;
}

function presenterPath(identity: string): string {
  return `/presenter?sessionIdentity=${identity}`;
}
