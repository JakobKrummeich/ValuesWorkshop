import { readFile } from "node:fs/promises";
import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import pdfParse from "pdf-parse";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { castBallot, eligibleValueIdsOf } from "./support/finalVoting";
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
const TOP_VALUE_COUNT = 10;
const FULL_WALL_PAGE_SIZE = 6;
const FIRST_PAGE_ANIMAL_ID = EXPECTED_GROUP_ANIMAL_IDS[0];
const SECOND_PAGE_ANIMAL_ID = EXPECTED_GROUP_ANIMAL_IDS[FULL_WALL_PAGE_SIZE];
const WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS = 15_000;
const REASSIGNED_GROUP_ANIMAL_ID = "otter";
const MAIN_ROUND_ALLOTMENT = 5;
const VOTE_TARGETS_BY_CARD_ORDER = [30, 25, 20, 17, 14, 14, 10, 8, 7, 5];
const TIED_CARD_INDEXES = [4, 5];
const TIEBREAK_WINNER_VOTES = 16;
const WINNER_COUNT = 5;
const WORST_CASE_CARD_INDEX = 2;
const MAXIMAL_ACTION_LENGTH = 200;
const CORRECTED_ACTION_TEXT = "We start every meeting with a check-in";
const REVEAL_SCREEN_PLACES = [5, 4, 3, 2];
const PDF_FILE_NAME = "workshop-record.pdf";

function maximalLengthActionTextOf(actionNumber: number): string {
  const opening = `Worst case action ${actionNumber} of the winning value `;
  const filler = "keeps every reveal screen honest about fitting the wall ";
  return (opening + filler.repeat(4)).slice(0, MAXIMAL_ACTION_LENGTH - 1) + "z";
}

const worstCaseActionTexts = Array.from({ length: 5 }, (unused, actionIndex) =>
  maximalLengthActionTextOf(actionIndex + 1),
);

const workshopParticipants = participantAccounts.slice(0, PARTICIPANT_COUNT);

function inBatches(
  accounts: readonly ParticipantAccount[],
): ParticipantAccount[][] {
  const batches: ParticipantAccount[][] = [];
  for (let start = 0; start < accounts.length; start += SIGN_IN_BATCH_SIZE) {
    batches.push(accounts.slice(start, start + SIGN_IN_BATCH_SIZE));
  }
  return batches;
}

test.describe.serial("a workshop at scale with thirty participants", () => {
  let facilitatorContext: BrowserContext;
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let presenterPage: Page;
  let sessionIdentity: string;
  let eligibleValueIds: string[] = [];
  let worstCaseValueId = "";
  let winnerValueNames: string[] = [];

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext();
    presenterContext = await browser.newContext({
      viewport: WALL_VIEWPORT,
      reducedMotion: "reduce",
    });
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
    return scribeName.trim();
  }

  async function wallCardCounts(wallPage: Page) {
    const [firstPageCards, secondPageCards, totalCards] = await Promise.all([
      wallPage.getByTestId(`group-card-${FIRST_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(`group-card-${SECOND_PAGE_ANIMAL_ID}`).count(),
      wallPage.getByTestId(/^group-card-/).count(),
    ]);
    return { firstPageCards, secondPageCards, totalCards };
  }

  async function expectWallToCycleThroughBothPages(
    wallPage: Page,
  ): Promise<void> {
    await expect
      .poll(() => wallCardCounts(wallPage), {
        timeout: WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS,
      })
      .toEqual({ firstPageCards: 0, secondPageCards: 1, totalCards: 1 });
    await expect
      .poll(() => wallCardCounts(wallPage), {
        timeout: WALL_PAGE_CYCLE_TIMEOUT_MILLISECONDS,
      })
      .toEqual({
        firstPageCards: 1,
        secondPageCards: 0,
        totalCards: FULL_WALL_PAGE_SIZE,
      });
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
        nextScribeName = ((await option.textContent()) ?? "").trim();
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

    for (const actionText of worstCaseActionTexts) {
      expect(actionText).toHaveLength(MAXIMAL_ACTION_LENGTH);
    }

    const assignedValueCounts: number[] = [];
    let presentationPosition = 0;
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
          const actionTexts =
            presentationPosition === WORST_CASE_CARD_INDEX
              ? worstCaseActionTexts
              : [`Action for ${valueId}`];
          if (presentationPosition === WORST_CASE_CARD_INDEX) {
            worstCaseValueId = valueId;
          }
          presentationPosition += 1;

          await page.getByTestId(`value-tab-${valueId}`).click();
          const actionInputs = page.getByTestId(/^action-input-/);
          for (const [actionIndex, actionText] of actionTexts.entries()) {
            await page.getByTestId("add-action-button").click();
            await expect(actionInputs).toHaveCount(actionIndex + 1);
            await actionInputs.nth(actionIndex).fill(actionText);
          }
        }

        await expect(page.getByTestId("submit-group-work-button")).toBeEnabled({
          timeout: 5_000,
        });
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
      TOP_VALUE_COUNT,
    );

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled({
      timeout: 10_000,
    });
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 7");
    }
  });

  test("the facilitator walks every group block on the wall and fixes a typo live", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const nextValueButton = facilitatorPage.getByTestId("next-value-button");
    const presentedActions = presenterPage.getByTestId("presented-action");
    const correctedActionText = "We start every meeting with a check-in";

    await expect(
      presenterPage.getByTestId(`group-intro-${FIRST_PAGE_ANIMAL_ID}`),
    ).toBeVisible({ timeout: 10_000 });
    await expect(facilitatorPage.getByTestId("presenting-position")).toHaveText(
      "Up next: Otter",
    );
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();

    await withParticipant(
      browser,
      workshopParticipants[0].accountName,
      async (page) => {
        await expect(page.getByTestId("waiting-screen")).toBeVisible({
          timeout: 15_000,
        });
      },
    );

    await nextValueButton.click();
    await expect(
      presenterPage.getByTestId("presented-value-screen"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      presenterPage.getByTestId("presenter-presenting-group"),
    ).toHaveText("Otter");
    await expect(presentedActions.first()).toHaveText(/^Action for /);

    const presentedActionInput = facilitatorPage
      .getByTestId(/^presented-action-input-/)
      .first();
    await presentedActionInput.fill(correctedActionText);
    await presentedActionInput.press("Enter");
    await expect(presentedActions.first()).toHaveText(correctedActionText, {
      timeout: 5_000,
    });

    const positionCount = EXPECTED_GROUP_ANIMAL_IDS.length + TOP_VALUE_COUNT;
    for (let position = 2; position < positionCount; position++) {
      await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
      await expect(nextValueButton).toBeEnabled({ timeout: 10_000 });
      await nextValueButton.click();
    }

    await expect(nextValueButton).toBeDisabled({ timeout: 10_000 });
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 8");
    }
  });

  function mainRoundBallotOf(participantIndex: number): Map<string, number> {
    const voteUnits = VOTE_TARGETS_BY_CARD_ORDER.flatMap((target, cardIndex) =>
      Array.from({ length: target }, () => eligibleValueIds[cardIndex]),
    );
    const ownUnits = voteUnits.slice(
      participantIndex * MAIN_ROUND_ALLOTMENT,
      (participantIndex + 1) * MAIN_ROUND_ALLOTMENT,
    );
    const ballot = new Map<string, number>();
    for (const valueId of ownUnits) {
      ballot.set(valueId, (ballot.get(valueId) ?? 0) + 1);
    }
    return ballot;
  }

  test("thirty participants spend their five votes and force a fifth-place tie", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: 0/${PARTICIPANT_COUNT}`,
    );
    await expect(
      presenterPage.getByTestId("presenter-final-voting-screen"),
    ).toContainText("Voting ongoing");

    await withParticipant(
      browser,
      workshopParticipants[0].accountName,
      async (page) => {
        eligibleValueIds = await eligibleValueIdsOf(page);
        winnerValueNames = (
          await page
            .getByTestId(/^vote-card-/)
            .locator("h3")
            .allTextContents()
        ).slice(0, WINNER_COUNT);
        await expect(
          page.getByTestId(`vote-card-${eligibleValueIds[0]}`),
        ).toContainText(CORRECTED_ACTION_TEXT);
        await expect(
          page.getByTestId(`vote-card-${eligibleValueIds[1]}`),
        ).toContainText(/Action for /);
        await expect(
          page.getByTestId(`vote-card-${worstCaseValueId}`),
        ).toContainText(worstCaseActionTexts[0]);
      },
    );
    expect(eligibleValueIds).toHaveLength(TOP_VALUE_COUNT);
    expect(eligibleValueIds[WORST_CASE_CARD_INDEX]).toBe(worstCaseValueId);

    const batches = inBatches(workshopParticipants);
    for (const [batchIndex, batch] of batches.entries()) {
      await Promise.all(
        batch.map((account) =>
          withParticipant(browser, account.accountName, async (page) => {
            await castBallot(
              page,
              mainRoundBallotOf(workshopParticipants.indexOf(account)),
              MAIN_ROUND_ALLOTMENT,
            );
          }),
        ),
      );
      if (batchIndex === 0) {
        await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
          `Round 1 · voted: ${SIGN_IN_BATCH_SIZE}/${PARTICIPANT_COUNT}`,
        );
      }
    }

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: ${PARTICIPANT_COUNT}/${PARTICIPANT_COUNT}`,
    );

    await facilitatorPage.getByTestId("close-voting-button").click();

    await expect(
      facilitatorPage.getByTestId("closed-round-tallies"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      facilitatorPage.getByTestId(`tally-${eligibleValueIds[0]}`),
    ).toContainText("30 votes");
    for (const cardIndex of TIED_CARD_INDEXES) {
      await expect(
        facilitatorPage.getByTestId(`tally-${eligibleValueIds[cardIndex]}`),
      ).toContainText("14 votes");
    }
    await expect(facilitatorPage.getByTestId("tie-callout")).toContainText(
      "(14 votes)",
    );
    await expect(
      facilitatorPage.getByTestId("start-tiebreak-button"),
    ).toBeEnabled();
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
    await expect(
      presenterPage.getByTestId("presenter-final-voting-screen"),
    ).toBeVisible();
  });

  test("a tiebreak round over the tied values resolves and unlocks phase 9", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const [firstTiedValueId, secondTiedValueId] = TIED_CARD_INDEXES.map(
      (cardIndex) => eligibleValueIds[cardIndex],
    );

    await facilitatorPage.getByTestId("start-tiebreak-button").click();
    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 2 · voted: 0/${PARTICIPANT_COUNT}`,
      { timeout: 10_000 },
    );

    for (const batch of inBatches(workshopParticipants)) {
      await Promise.all(
        batch.map((account) =>
          withParticipant(browser, account.accountName, async (page) => {
            await expect(page.getByTestId(/^vote-card-/)).toHaveCount(2, {
              timeout: 15_000,
            });
            await expect(page.getByTestId("submit-votes-button")).toHaveText(
              "Submit 1 vote",
            );
            const participantIndex = workshopParticipants.indexOf(account);
            const chosenValueId =
              participantIndex < TIEBREAK_WINNER_VOTES
                ? firstTiedValueId
                : secondTiedValueId;
            await castBallot(page, new Map([[chosenValueId, 1]]), 1);
          }),
        ),
      );
    }

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 2 · voted: ${PARTICIPANT_COUNT}/${PARTICIPANT_COUNT}`,
    );

    await facilitatorPage.getByTestId("close-voting-button").click();

    await expect(
      facilitatorPage.getByTestId(`tally-${firstTiedValueId}`),
    ).toContainText("16 votes", { timeout: 10_000 });
    await expect(
      facilitatorPage.getByTestId(`tally-${secondTiedValueId}`),
    ).toContainText("14 votes");
    await expect(facilitatorPage.getByTestId("tie-callout")).toHaveCount(0);

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 9");
    }
  });

  function revealNextValueButton(): Locator {
    return facilitatorPage.getByRole("button", { name: "Reveal next value" });
  }

  function expectedActionTextsOf(cardIndex: number): string[] {
    if (cardIndex === WORST_CASE_CARD_INDEX) {
      return worstCaseActionTexts;
    }
    if (cardIndex === 0) {
      return [CORRECTED_ACTION_TEXT];
    }
    return [`Action for ${eligibleValueIds[cardIndex]}`];
  }

  async function expectWorstCaseRevealToFitTheWall(): Promise<void> {
    const actions = presenterPage.getByTestId("winner-action");
    await expect(actions).toHaveText(worstCaseActionTexts);

    for (const action of await actions.all()) {
      const box = await action.boundingBox();
      if (box === null) {
        throw new Error("A revealed action has no bounding box");
      }
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(WALL_VIEWPORT.width);
      expect(box.y + box.height).toBeLessThanOrEqual(WALL_VIEWPORT.height);
    }

    const overflow = await presenterPage.evaluate(() => ({
      horizontal:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      vertical:
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight,
    }));
    expect(overflow).toEqual({ horizontal: 0, vertical: 0 });

    const clippedHeight = await presenterPage
      .getByTestId("winner-reveal")
      .evaluate((element) => element.scrollHeight - element.clientHeight);
    expect(clippedHeight).toBe(0);
  }

  test("the facilitator reveals places five down to two on the wall", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    await expect(presenterPage.getByTestId("reveal-anticipation")).toBeVisible({
      timeout: 10_000,
    });
    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: 0 of ${WINNER_COUNT}`,
    );

    for (const [revealIndex, place] of REVEAL_SCREEN_PLACES.entries()) {
      await expect(revealNextValueButton()).toBeEnabled({ timeout: 10_000 });
      await revealNextValueButton().click();

      await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
        `Revealed: ${revealIndex + 1} of ${WINNER_COUNT}`,
        { timeout: 10_000 },
      );

      const cardIndex = place - 1;
      await expect(presenterPage.getByTestId("winner-place")).toHaveText(
        `Place ${place}`,
        { timeout: 10_000 },
      );
      await expect(presenterPage.getByTestId("winner-value")).toHaveText(
        winnerValueNames[cardIndex],
      );
      await expect(presenterPage.getByTestId("winner-vote-count")).toHaveText(
        `${VOTE_TARGETS_BY_CARD_ORDER[cardIndex]} votes`,
      );
      await expect(presenterPage.getByTestId("winner-action")).toHaveText(
        expectedActionTextsOf(cardIndex),
      );

      if (cardIndex === WORST_CASE_CARD_INDEX) {
        await expectWorstCaseRevealToFitTheWall();
      }
    }

    for (const account of [workshopParticipants[0], workshopParticipants[29]]) {
      await withParticipant(browser, account.accountName, async (page) => {
        await expect(page.getByTestId("waiting-screen")).toBeVisible({
          timeout: 15_000,
        });
      });
    }
  });

  test("the fifth reveal concludes the workshop with the winner overview", async () => {
    await expect(revealNextValueButton()).toBeEnabled({ timeout: 10_000 });
    await revealNextValueButton().click();

    await expect(presenterPage.getByTestId("winner-overview")).toBeVisible({
      timeout: 10_000,
    });
    const overviewRows = presenterPage.getByTestId(/^overview-winner-/);
    await expect(overviewRows).toHaveCount(WINNER_COUNT);
    const rowTestIds = await overviewRows.evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-testid")),
    );
    expect(rowTestIds).toEqual([
      "overview-winner-1",
      "overview-winner-2",
      "overview-winner-3",
      "overview-winner-4",
      "overview-winner-5",
    ]);
    for (const [cardIndex, valueName] of winnerValueNames.entries()) {
      await expect(
        presenterPage.getByTestId(`overview-winner-${cardIndex + 1}`),
      ).toContainText(valueName);
    }
    await expect(presenterPage.getByTestId("overview-winner-1")).toContainText(
      `${VOTE_TARGETS_BY_CARD_ORDER[0]} votes`,
    );

    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: ${WINNER_COUNT} of ${WINNER_COUNT}`,
    );
    await expect(facilitatorPage.getByTestId("concluded-note")).toBeVisible();
    await expect(revealNextValueButton()).toHaveCount(0);
  });

  test("a participant downloads the workshop record as an anonymous PDF", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    let pdfText = "";
    await withParticipant(
      browser,
      workshopParticipants[0].accountName,
      async (page) => {
        await expect(page.getByTestId("workshop-concluded")).toBeVisible({
          timeout: 15_000,
        });

        const downloadPromise = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "Download workshop record (PDF)" })
          .click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(PDF_FILE_NAME);

        const downloadPath = await download.path();
        const parsed = await pdfParse(await readFile(downloadPath));
        pdfText = parsed.text.replace(/\s+/g, " ");
      },
    );

    expect(pdfText).toContain("Workshop record");
    expect(pdfText).toContain("The winners");
    expect(pdfText).toContain("All actions");
    expect(pdfText).toContain("Votes per round");

    for (const [cardIndex, valueName] of winnerValueNames.entries()) {
      expect(pdfText).toContain(`Place ${cardIndex + 1}`);
      expect(pdfText).toContain(valueName);
    }

    expect(pdfText).toContain(
      `Round 1 — ${MAIN_ROUND_ALLOTMENT} votes per person`,
    );
    expect(pdfText).toContain("Round 2 — 1 vote per person");
    expect(pdfText).toContain(`${winnerValueNames[0]} — 30`);
    expect(pdfText).toContain(`${winnerValueNames[4]} — 14`);
    expect(pdfText).toContain(
      `${winnerValueNames[4]} — ${TIEBREAK_WINNER_VOTES}`,
    );

    expect(pdfText).toContain(CORRECTED_ACTION_TEXT);
    for (const actionText of worstCaseActionTexts) {
      expect(pdfText).toContain(actionText);
    }

    for (const account of workshopParticipants) {
      expect(pdfText).not.toMatch(new RegExp(`\\b${account.displayName}\\b`));
    }
  });
});
