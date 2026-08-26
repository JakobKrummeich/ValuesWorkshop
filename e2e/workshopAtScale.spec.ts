import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { assignedValueIdsOf } from "./support/groupWork";
import { openSignedIn } from "./support/oidcLogin";
import {
  participantAccounts,
  accountNameOf,
  type ParticipantAccount,
} from "./support/participantAccounts";
import { openParticipantSession } from "./support/participantSession";
import {
  advancePhaseButton,
  fastForwardQuizAsFacilitatorAlone,
} from "./support/quizFastForward";

const FACILITATOR_ACCOUNT = "facilitator";
const SESSION_NAME = "Playwright workshop at scale";
const WALL_VIEWPORT = { width: 1920, height: 1080 };

const PARTICIPANT_COUNT = 30;
const SIGN_IN_BATCH_SIZE = 6;
const VALUES_TO_PICK = 10;

const EXPECTED_GROUP_ANIMAL_IDS = [
  "otter",
  "fuchs",
  "eule",
  "igel",
  "dachs",
  "luchs",
  "biber",
];
const EXPECTED_GROUP_SIZES_LARGEST_FIRST = [5, 5, 4, 4, 4, 4, 4];
const FULL_WALL_PAGE_SIZE = 6;
const FIRST_PAGE_ANIMAL_ID = "otter";
const SECOND_PAGE_ANIMAL_ID = "biber";
const WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS = 15_000;
const REASSIGNED_GROUP_ANIMAL_ID = "otter";

const workshopParticipants = participantAccounts.slice(0, PARTICIPANT_COUNT);

test.describe.serial("a workshop at scale with thirty participants", () => {
  let facilitatorContext: BrowserContext;
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let presenterPage: Page;
  let sessionIdentity: string;

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext();
    presenterContext = await browser.newContext({ viewport: WALL_VIEWPORT });
    facilitatorPage = await facilitatorContext.newPage();
    presenterPage = await presenterContext.newPage();

    await openSignedIn(facilitatorPage, "/facilitator", FACILITATOR_ACCOUNT);
    sessionIdentity = await openSessionAsFacilitator(
      facilitatorPage,
      SESSION_NAME,
    );
    await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);
    await expect(presenterPage.getByTestId("participant-count")).toHaveText(
      "Participants: 0",
    );
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    await presenterContext.close();
  });

  function inBatches(
    accounts: readonly ParticipantAccount[],
  ): ParticipantAccount[][] {
    const batches: ParticipantAccount[][] = [];
    for (
      let start = 0;
      start < accounts.length;
      start += SIGN_IN_BATCH_SIZE
    ) {
      batches.push(accounts.slice(start, start + SIGN_IN_BATCH_SIZE));
    }
    return batches;
  }

  async function withParticipant(
    browser: Browser,
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

  function scribeSelect(animalId: string): Locator {
    return facilitatorPage.getByTestId(`scribe-select-${animalId}`);
  }

  async function currentScribeNameOf(animalId: string): Promise<string> {
    const scribeName = await scribeSelect(animalId)
      .locator("option:checked")
      .textContent();
    if (scribeName === null) {
      throw new Error(`The ${animalId} group shows no scribe`);
    }
    return scribeName;
  }

  async function wallShowsOnlySecondPage(wallPage: Page): Promise<boolean> {
    const [firstPageCards, secondPageCards, totalCards] = await Promise.all([
      wallPage.getByTestId(`group-card-${FIRST_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(`group-card-${SECOND_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(/^group-card-/).count(),
    ]);
    return firstPageCards === 0 && secondPageCards === 1 && totalCards === 1;
  }

  async function wallShowsFullFirstPage(wallPage: Page): Promise<boolean> {
    const [firstPageCards, secondPageCards, totalCards] = await Promise.all([
      wallPage.getByTestId(`group-card-${FIRST_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(`group-card-${SECOND_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(/^group-card-/).count(),
    ]);
    return (
      firstPageCards === 1 &&
      secondPageCards === 0 &&
      totalCards === FULL_WALL_PAGE_SIZE
    );
  }

  async function expectWallToCycleThroughBothPages(
    wallPage: Page,
  ): Promise<void> {
    await expect
      .poll(() => wallShowsOnlySecondPage(wallPage), {
        timeout: WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS,
      })
      .toBe(true);
    await expect
      .poll(() => wallShowsFullFirstPage(wallPage), {
        timeout: WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS,
      })
      .toBe(true);
  }

  test("thirty participants join and the roster keeps every one of them", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    for (const batch of inBatches(workshopParticipants)) {
      await Promise.all(
        batch.map((account) =>
          withParticipant(browser, account.accountName, async (page) => {
            await expect(page.getByTestId("own-display-name")).toHaveText(
              `You are in, ${account.displayName}.`,
              { timeout: 15_000 },
            );
          }),
        ),
      );
    }

    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("participant-count")).toHaveText(
        `Participants: ${PARTICIPANT_COUNT}`,
      );
    }
    for (const account of [workshopParticipants[0], workshopParticipants[29]]) {
      await expect(facilitatorPage.getByTestId("joined-names")).toContainText(
        account.displayName,
      );
    }
  });

  test("the facilitator fast-forwards the quiz without any participant answers", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();

    await expect(facilitatorPage.getByTestId("question-heading")).toHaveText(
      "Question 1 of 5",
    );
    await fastForwardQuizAsFacilitatorAlone(facilitatorPage);
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
  });

  test("every participant returns and submits ten values", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 3");
    await expect(facilitatorPage.getByTestId("submitted-count")).toHaveText(
      `0 of ${PARTICIPANT_COUNT} have submitted`,
    );

    for (const batch of inBatches(workshopParticipants)) {
      await Promise.all(
        batch.map((account) =>
          withParticipant(browser, account.accountName, async (page) => {
            const valueChips = page.getByTestId(/^value-chip-/);
            await expect(valueChips.first()).toBeVisible({ timeout: 15_000 });
            for (let pick = 0; pick < VALUES_TO_PICK; pick += 1) {
              await valueChips.nth(pick).click();
            }
            await expect(page.getByTestId("selected-count")).toHaveText(
              `Selected: ${VALUES_TO_PICK}/${VALUES_TO_PICK}`,
            );
            await page.getByTestId("submit-selection-button").click();
            await page.getByTestId("confirm-submit-button").click();
            await expect(
              page.getByTestId("selection-submitted-confirmation"),
            ).toBeVisible();
          }),
        ),
      );
    }

    await expect(facilitatorPage.getByTestId("submitted-count")).toHaveText(
      `${PARTICIPANT_COUNT} of ${PARTICIPANT_COUNT} have submitted`,
    );
  });

  test("the formation window deals the thirty participants into seven groups", async () => {
    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 4");
    await expect(facilitatorPage.getByTestId("results-heading")).toBeVisible();

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 5");
    await expect(
      facilitatorPage.getByTestId("formation-progress"),
    ).toBeVisible();
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();

    await expect(facilitatorPage.getByTestId("formation-progress")).toHaveCount(
      0,
      { timeout: 20_000 },
    );
    await expect(facilitatorPage.getByTestId(/^group-card-/)).toHaveCount(
      EXPECTED_GROUP_ANIMAL_IDS.length,
    );

    const memberCounts: number[] = [];
    for (const animalId of EXPECTED_GROUP_ANIMAL_IDS) {
      const groupCard = facilitatorPage.getByTestId(`group-card-${animalId}`);
      await expect(groupCard).toBeVisible();
      memberCounts.push(await groupCard.getByTestId("group-member").count());
    }
    memberCounts.sort((left, right) => right - left);
    expect(memberCounts).toEqual(EXPECTED_GROUP_SIZES_LARGEST_FIRST);
  });

  test("the presenter wall pages through the seven formed groups", async () => {
    test.setTimeout(60_000);

    await expect(presenterPage.getByTestId("phase")).toHaveText("Phase 5");
    await expect(presenterPage.getByTestId("formation-progress")).toHaveCount(
      0,
      { timeout: 20_000 },
    );

    await expectWallToCycleThroughBothPages(presenterPage);
  });

  test("advancing to phase 6 lists all seven groups as editing", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();

    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 6");
    await expect(facilitatorPage.getByTestId("group-work-table")).toBeVisible();
    await expect(
      facilitatorPage.locator('tr[data-testid^="group-row-"]'),
    ).toHaveCount(EXPECTED_GROUP_ANIMAL_IDS.length);
    for (const animalId of EXPECTED_GROUP_ANIMAL_IDS) {
      await expect(
        facilitatorPage.getByTestId(`group-status-${animalId}`),
      ).toHaveText("Editing");
      expect(await currentScribeNameOf(animalId)).not.toBe("");
    }
  });

  test("the group work wall pages through the groups with status badges", async () => {
    test.setTimeout(60_000);

    await expect(presenterPage.getByTestId("phase")).toHaveText("Phase 6");
    await expectWallToCycleThroughBothPages(presenterPage);
    await expect(
      presenterPage.getByTestId(/^presenter-group-status-/).first(),
    ).toHaveText("Editing");
  });

  test("reassigning a scribe hands the editor to the new scribe without a reload", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const reassignedSelect = scribeSelect(REASSIGNED_GROUP_ANIMAL_ID);
    const previousScribeIdentity = await reassignedSelect.inputValue();
    const previousScribeName = await currentScribeNameOf(
      REASSIGNED_GROUP_ANIMAL_ID,
    );

    let nextScribeIdentity = "";
    let nextScribeName = "";
    for (const option of await reassignedSelect.locator("option").all()) {
      const optionValue = await option.getAttribute("value");
      if (optionValue !== null && optionValue !== previousScribeIdentity) {
        nextScribeIdentity = optionValue;
        nextScribeName = (await option.textContent()) ?? "";
        break;
      }
    }
    expect(nextScribeIdentity).not.toBe("");
    expect(nextScribeName).not.toBe(previousScribeName);

    const previousScribe = await openParticipantSession(
      browser,
      sessionIdentity,
      accountNameOf(previousScribeName),
    );
    const nextScribe = await openParticipantSession(
      browser,
      sessionIdentity,
      accountNameOf(nextScribeName),
    );
    try {
      for (const page of [previousScribe.page, nextScribe.page]) {
        await expect(page.getByTestId("group-work-card")).toBeVisible({
          timeout: 15_000,
        });
      }
      await expect(
        previousScribe.page.getByTestId("add-action-button"),
      ).toBeVisible();
      await expect(
        nextScribe.page.getByTestId("add-action-button"),
      ).toHaveCount(0);

      await reassignedSelect.selectOption(nextScribeIdentity);

      await expect(
        nextScribe.page.getByTestId("add-action-button"),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        previousScribe.page.getByTestId("add-action-button"),
      ).toHaveCount(0);
      await expect(reassignedSelect).toHaveValue(nextScribeIdentity);
    } finally {
      await previousScribe.context.close();
      await nextScribe.context.close();
    }
  });

  test("the advance stays locked until the last of the seven groups submits", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const assignedValueCounts: number[] = [];
    for (const animalId of EXPECTED_GROUP_ANIMAL_IDS) {
      const scribeAccountName = accountNameOf(
        await currentScribeNameOf(animalId),
      );

      await withParticipant(browser, scribeAccountName, async (page) => {
        await expect(page.getByTestId("group-work-card")).toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByTestId("add-action-button")).toBeVisible();

        const valueIds = await assignedValueIdsOf(page);
        expect(valueIds.length).toBeGreaterThan(0);
        assignedValueCounts.push(valueIds.length);

        for (const valueId of valueIds) {
          await page.getByTestId(`value-tab-${valueId}`).click();
          await page.getByTestId("add-action-button").click();
          await expect(page.getByTestId(/^action-input-/)).toBeVisible();
          await page
            .getByTestId(/^action-input-/)
            .first()
            .fill(`Action for ${valueId}`);
        }

        await expect(page.getByTestId("submit-group-work-button")).toBeEnabled(
          { timeout: 5_000 },
        );
        await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();

        await page.getByTestId("submit-group-work-button").click();
        await expect(page.getByTestId("reopen-button")).toBeVisible({
          timeout: 5_000,
        });
        await expect(
          facilitatorPage.getByTestId(`group-status-${animalId}`),
        ).toHaveText("Submitted", { timeout: 5_000 });
      });
    }

    expect(assignedValueCounts.reduce((sum, count) => sum + count, 0)).toBe(
      10,
    );

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled({
      timeout: 10_000,
    });
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 7");
    }
  });
});
