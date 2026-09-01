import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  RESTART_TEST_TIMEOUT_MILLISECONDS,
  restartBackendAwaitingReconnect,
} from "./support/backendRestart";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { revealNextValueButton } from "./support/finalPresentation";
import {
  castBallot,
  eligibleValueIdsOf,
  spreadBallotOf,
} from "./support/finalVoting";
import { assignedValueIdsOf } from "./support/groupWork";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import { participantAccounts } from "./support/participantAccounts";
import {
  advancePhaseButton,
  answerButton,
  clickThroughQuestionControls,
  expectQuestionHeading,
  fastForwardQuizQuestions,
  quizControlButton,
} from "./support/quizFastForward";
import { submitValueSelection } from "./support/valueSelection";

const FACILITATOR_ACCOUNT = "facilitator";
const SESSION_NAME = "Playwright restart recovery";
const PHONE_VIEWPORT = { width: 390, height: 844 };
const WALL_VIEWPORT = { width: 1920, height: 1080 };

const PARTICIPANT_COUNT = 4;
const TOP_VALUE_COUNT = 10;
const PREFILLED_ACTION_VALUE_COUNT = 3;
const MAIN_ROUND_ALLOTMENT = 5;
const WINNER_COUNT = 5;
const VOTE_TARGETS_BY_CARD_ORDER = [6, 5, 4, 3, 2];
const PLACES_BEFORE_RESTART = [5, 4];
const PLACES_AFTER_RESTART = [3, 2, 1];
const PDF_FILE_NAME = "values-workshop-record.pdf";

const workshopParticipants = participantAccounts.slice(0, PARTICIPANT_COUNT);

test.describe.serial("restart recovery across the workshop", () => {
  let facilitatorContext: BrowserContext;
  let participantContexts: BrowserContext[];
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let participantPages: Page[];
  let presenterPage: Page;
  let sessionIdentity = "";
  let ownAnswerText = "";
  let groupAnimalId = "";
  let scribeDisplayName = "";
  let scribeIndex = -1;
  let assignedValueIds: string[] = [];
  let eligibleValueIds: string[] = [];
  let winnerValueNames: string[] = [];
  const prefilledActionTexts = new Map<string, string>();

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext();
    participantContexts = await Promise.all(
      workshopParticipants.map(() =>
        browser.newContext({ viewport: PHONE_VIEWPORT }),
      ),
    );
    presenterContext = await browser.newContext({
      viewport: WALL_VIEWPORT,
      reducedMotion: "reduce",
    });

    facilitatorPage = await facilitatorContext.newPage();
    participantPages = await Promise.all(
      participantContexts.map((context) => context.newPage()),
    );
    presenterPage = await presenterContext.newPage();
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    for (const context of participantContexts) {
      await context.close();
    }
    await presenterContext.close();
  });

  function everyRolePage(): Page[] {
    return [facilitatorPage, ...participantPages, presenterPage];
  }

  function facilitatorPath(): string {
    return `/facilitator?sessionIdentity=${sessionIdentity}`;
  }

  function participantPath(): string {
    return `/participant?sessionIdentity=${sessionIdentity}`;
  }

  async function reopenFacilitatorTab(): Promise<void> {
    await facilitatorPage.close();
    facilitatorPage = await facilitatorContext.newPage();
    await facilitatorPage.goto(facilitatorPath());
    await expect(facilitatorPage.getByTestId("connection")).toHaveText(
      "Connected",
      { timeout: 15_000 },
    );
    await expect(
      facilitatorPage.getByLabel("Facilitator passphrase"),
    ).toHaveCount(0);
  }

  async function reopenParticipantTab(participantIndex: number): Promise<Page> {
    await participantPages[participantIndex].close();
    const reopenedPage = await participantContexts[participantIndex].newPage();
    participantPages[participantIndex] = reopenedPage;
    await reopenedPage.goto(participantPath());
    return reopenedPage;
  }

  function scribePage(): Page {
    return participantPages[scribeIndex];
  }

  function scribeSelectedOption(): Locator {
    return facilitatorPage
      .getByTestId(`scribe-select-${groupAnimalId}`)
      .locator("option:checked");
  }

  test("the facilitator opens a session and four participants join", async () => {
    test.setTimeout(120_000);

    await openSignedIn(facilitatorPage, "/facilitator", FACILITATOR_ACCOUNT);
    sessionIdentity = await openSessionAsFacilitator(
      facilitatorPage,
      SESSION_NAME,
    );
    await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);

    for (const [index, participantPage] of participantPages.entries()) {
      await participantPage.goto(participantPath());
      await signInThroughOidcProvider(
        participantPage,
        workshopParticipants[index].accountName,
      );
      await expect(participantPage.getByTestId("own-display-name")).toHaveText(
        `You are in, ${workshopParticipants[index].displayName}.`,
        { timeout: 15_000 },
      );
    }

    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("participant-count")).toHaveText(
        `Participants: ${PARTICIPANT_COUNT}`,
      );
    }
  });

  test("one participant answers the first quiz question", async () => {
    await advancePhaseButton(facilitatorPage).click();
    await expectQuestionHeading(everyRolePage(), 1);

    await answerButton(participantPages[0], 0).click();

    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 1",
    );
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      `1 of ${PARTICIPANT_COUNT} have answered`,
    );
    await expect(
      participantPages[0].getByTestId("own-answer-text"),
    ).toBeVisible();
    ownAnswerText =
      (await participantPages[0]
        .getByTestId("own-answer-text")
        .textContent()) ?? "";
    expect(ownAnswerText).not.toBe("");
  });

  test("a mid-quiz restart preserves the posed question, the cast answer, and the tallies", async () => {
    test.setTimeout(RESTART_TEST_TIMEOUT_MILLISECONDS);

    await restartBackendAwaitingReconnect(everyRolePage());

    await expectQuestionHeading(
      [facilitatorPage, presenterPage, participantPages[1]],
      1,
    );
    await expect(participantPages[0].getByTestId("own-answer-text")).toHaveText(
      ownAnswerText,
      { timeout: 15_000 },
    );
    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 1",
    );
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      `1 of ${PARTICIPANT_COUNT} have answered`,
    );
    await expect(presenterPage.getByTestId("answer-votes-0")).toHaveText("1");
  });

  test("the facilitator and the answered participant reopen their tabs mid-quiz", async () => {
    test.setTimeout(60_000);

    await reopenFacilitatorTab();
    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Reveal answer",
      { timeout: 15_000 },
    );
    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 1",
    );

    const reopenedParticipantPage = await reopenParticipantTab(0);
    await expect(
      reopenedParticipantPage.getByTestId("own-answer-text"),
    ).toHaveText(ownAnswerText, { timeout: 15_000 });
    await expect(
      reopenedParticipantPage.getByTestId(/^answer-button-/),
    ).toHaveCount(0);
  });

  test("the reveal still works and the quiz runs to its end", async () => {
    test.setTimeout(120_000);

    await clickThroughQuestionControls(facilitatorPage, true);
    await fastForwardQuizQuestions(
      facilitatorPage,
      participantPages[0],
      everyRolePage(),
      2,
    );

    await expect(presenterPage.getByTestId("learning-text")).toBeVisible();
    await expect(presenterPage.locator('[class*="correctBar"]')).toHaveCount(1);
  });

  test("every participant submits ten values", async () => {
    test.setTimeout(180_000);

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 3");
    await expect(facilitatorPage.getByTestId("submitted-count")).toHaveText(
      `0 of ${PARTICIPANT_COUNT} have submitted`,
    );

    for (const participantPage of participantPages) {
      await submitValueSelection(participantPage);
    }

    await expect(facilitatorPage.getByTestId("submitted-count")).toHaveText(
      `${PARTICIPANT_COUNT} of ${PARTICIPANT_COUNT} have submitted`,
    );
  });

  test("the formation window deals the four participants into one group", async () => {
    test.setTimeout(60_000);

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 4");
    await expect(facilitatorPage.getByTestId("results-heading")).toBeVisible();

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 5");
    await expect(
      facilitatorPage.getByTestId("formation-progress"),
    ).toBeVisible();
    await expect(facilitatorPage.getByTestId("formation-progress")).toHaveCount(
      0,
      { timeout: 20_000 },
    );

    const groupCards = facilitatorPage.getByTestId(/^group-card-/);
    await expect(groupCards).toHaveCount(1);
    const groupCardTestId = await groupCards
      .first()
      .getAttribute("data-testid");
    groupAnimalId = (groupCardTestId ?? "").replace("group-card-", "");
    expect(groupAnimalId).not.toBe("");
    await expect(groupCards.first().getByTestId("group-member")).toHaveCount(
      PARTICIPANT_COUNT,
    );
  });

  test("the scribe drafts actions with text for three values", async () => {
    test.setTimeout(120_000);

    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 6");
    await expect(
      facilitatorPage.getByTestId(`group-status-${groupAnimalId}`),
    ).toHaveText("Editing");

    scribeDisplayName = (
      (await scribeSelectedOption().textContent()) ?? ""
    ).trim();
    scribeIndex = workshopParticipants.findIndex(
      (account) => account.displayName === scribeDisplayName,
    );
    expect(scribeIndex).toBeGreaterThanOrEqual(0);

    await expect(scribePage().getByTestId("group-work-card")).toBeVisible({
      timeout: 15_000,
    });
    await expect(scribePage().getByTestId("add-action-button")).toBeVisible();
    assignedValueIds = await assignedValueIdsOf(scribePage());
    expect(assignedValueIds).toHaveLength(TOP_VALUE_COUNT);

    for (const valueId of assignedValueIds.slice(
      0,
      PREFILLED_ACTION_VALUE_COUNT,
    )) {
      const actionText = `Restart-proof action for ${valueId}`;
      prefilledActionTexts.set(valueId, actionText);
      await scribePage().getByTestId(`value-tab-${valueId}`).click();
      await scribePage().getByTestId("add-action-button").click();
      const actionInputs = scribePage().getByTestId(/^action-input-/);
      await expect(actionInputs).toHaveCount(1);
      await actionInputs.first().fill(actionText);
    }

    await expect(
      facilitatorPage.getByTestId("group-row-action-count"),
    ).toHaveText(`${PREFILLED_ACTION_VALUE_COUNT}`);

    const witnessPage = participantPages[(scribeIndex + 1) % PARTICIPANT_COUNT];
    for (const [valueId, actionText] of prefilledActionTexts) {
      await witnessPage.getByTestId(`value-tab-${valueId}`).click();
      await expect(witnessPage.getByTestId(/^action-text-/)).toHaveText(
        actionText,
      );
    }
  });

  test("a mid-group-work restart preserves the actions, the texts, and the scribe", async () => {
    test.setTimeout(RESTART_TEST_TIMEOUT_MILLISECONDS);

    await restartBackendAwaitingReconnect(everyRolePage());

    await expect(
      facilitatorPage.getByTestId(`group-status-${groupAnimalId}`),
    ).toHaveText("Editing", { timeout: 15_000 });
    await expect(
      facilitatorPage.getByTestId("group-row-action-count"),
    ).toHaveText(`${PREFILLED_ACTION_VALUE_COUNT}`);
    await expect(scribeSelectedOption()).toHaveText(scribeDisplayName);
    await expect(
      presenterPage.getByTestId(`presenter-group-status-${groupAnimalId}`),
    ).toHaveText("Editing", { timeout: 15_000 });

    await expect(scribePage().getByTestId("add-action-button")).toBeVisible({
      timeout: 15_000,
    });
    for (const [valueId, actionText] of prefilledActionTexts) {
      await scribePage().getByTestId(`value-tab-${valueId}`).click();
      await expect(scribePage().getByTestId(/^action-input-/)).toHaveValue(
        actionText,
      );
    }
  });

  test("the facilitator and the scribe reopen their tabs mid-group-work", async () => {
    test.setTimeout(60_000);

    await reopenFacilitatorTab();
    await expect(facilitatorPage.getByTestId("group-work-table")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      facilitatorPage.getByTestId("group-row-action-count"),
    ).toHaveText(`${PREFILLED_ACTION_VALUE_COUNT}`);

    const reopenedScribePage = await reopenParticipantTab(scribeIndex);
    await expect(
      reopenedScribePage.getByTestId("add-action-button"),
    ).toBeVisible({ timeout: 15_000 });
    for (const [valueId, actionText] of prefilledActionTexts) {
      await reopenedScribePage.getByTestId(`value-tab-${valueId}`).click();
      await expect(
        reopenedScribePage.getByTestId(/^action-input-/),
      ).toHaveValue(actionText);
    }
  });

  test("the scribe completes every value and submits the group work", async () => {
    test.setTimeout(180_000);

    for (const valueId of assignedValueIds.slice(
      PREFILLED_ACTION_VALUE_COUNT,
    )) {
      await scribePage().getByTestId(`value-tab-${valueId}`).click();
      await scribePage().getByTestId("add-action-button").click();
      const actionInputs = scribePage().getByTestId(/^action-input-/);
      await expect(actionInputs).toHaveCount(1);
      await actionInputs.first().fill(`Action for ${valueId}`);
    }

    await expect(
      scribePage().getByTestId("submit-group-work-button"),
    ).toBeEnabled({ timeout: 5_000 });
    await scribePage().getByTestId("submit-group-work-button").click();
    await expect(scribePage().getByTestId("reopen-button")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      facilitatorPage.getByTestId(`group-status-${groupAnimalId}`),
    ).toHaveText("Submitted", { timeout: 5_000 });
  });

  test("the facilitator walks the presentation through to final voting", async () => {
    test.setTimeout(120_000);

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled({
      timeout: 10_000,
    });
    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText("Phase 7");
    await expect(
      facilitatorPage.getByTestId("presenting-position"),
    ).toContainText("Up next");

    const nextValueButton = facilitatorPage.getByTestId("next-value-button");
    const positionCount = 1 + TOP_VALUE_COUNT;
    for (let position = 1; position < positionCount; position += 1) {
      await expect(nextValueButton).toBeEnabled({ timeout: 10_000 });
      await nextValueButton.click();
    }
    await expect(
      presenterPage.getByTestId("presented-value-screen"),
    ).toBeVisible({ timeout: 10_000 });
    await expect(nextValueButton).toBeDisabled({ timeout: 10_000 });

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 8");
    }
  });

  function ballotOf(participantIndex: number): Map<string, number> {
    return spreadBallotOf(
      participantIndex,
      VOTE_TARGETS_BY_CARD_ORDER,
      eligibleValueIds,
      MAIN_ROUND_ALLOTMENT,
    );
  }

  test("two of the four participants cast their ballots", async () => {
    test.setTimeout(120_000);

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: 0/${PARTICIPANT_COUNT}`,
    );

    eligibleValueIds = await eligibleValueIdsOf(participantPages[0]);
    expect(eligibleValueIds).toHaveLength(TOP_VALUE_COUNT);
    winnerValueNames = (
      await participantPages[0]
        .getByTestId(/^vote-card-/)
        .locator("h3")
        .allTextContents()
    ).slice(0, WINNER_COUNT);

    await castBallot(participantPages[0], ballotOf(0), MAIN_ROUND_ALLOTMENT);
    await castBallot(participantPages[1], ballotOf(1), MAIN_ROUND_ALLOTMENT);

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: 2/${PARTICIPANT_COUNT}`,
    );
  });

  test("a mid-voting restart preserves the cast and the open ballots", async () => {
    test.setTimeout(RESTART_TEST_TIMEOUT_MILLISECONDS);

    await restartBackendAwaitingReconnect(everyRolePage());

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: 2/${PARTICIPANT_COUNT}`,
      { timeout: 15_000 },
    );
    await expect(
      participantPages[0].getByTestId("votes-submitted-confirmation"),
    ).toBeVisible({ timeout: 15_000 });
    await expect(participantPages[2].getByTestId("votes-used")).toHaveText(
      `Your votes: 0/${MAIN_ROUND_ALLOTMENT} used`,
      { timeout: 15_000 },
    );
    await expect(participantPages[2].getByTestId(/^vote-card-/)).toHaveCount(
      TOP_VALUE_COUNT,
    );
    await expect(
      presenterPage.getByTestId("presenter-final-voting-screen"),
    ).toBeVisible();
  });

  test("the facilitator and a voter reopen their tabs mid-voting", async () => {
    test.setTimeout(60_000);

    await reopenFacilitatorTab();
    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: 2/${PARTICIPANT_COUNT}`,
      { timeout: 15_000 },
    );

    const reopenedVoterPage = await reopenParticipantTab(0);
    await expect(
      reopenedVoterPage.getByTestId("votes-submitted-confirmation"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("the remaining ballots close the round with five distinct tallies", async () => {
    test.setTimeout(120_000);

    await castBallot(participantPages[2], ballotOf(2), MAIN_ROUND_ALLOTMENT);
    await castBallot(participantPages[3], ballotOf(3), MAIN_ROUND_ALLOTMENT);
    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: ${PARTICIPANT_COUNT}/${PARTICIPANT_COUNT}`,
    );

    await facilitatorPage.getByTestId("close-voting-button").click();

    await expect(
      facilitatorPage.getByTestId("closed-round-tallies"),
    ).toBeVisible({ timeout: 10_000 });
    for (const [
      cardIndex,
      voteTarget,
    ] of VOTE_TARGETS_BY_CARD_ORDER.entries()) {
      await expect(
        facilitatorPage.getByTestId(`tally-${eligibleValueIds[cardIndex]}`),
      ).toContainText(`${voteTarget} votes`);
    }
    await expect(facilitatorPage.getByTestId("tie-callout")).toHaveCount(0);

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
    await advancePhaseButton(facilitatorPage).click();
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 9");
    }
  });

  test("the facilitator reveals the fifth and the fourth places", async () => {
    test.setTimeout(90_000);

    await expect(presenterPage.getByTestId("reveal-anticipation")).toBeVisible({
      timeout: 10_000,
    });
    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: 0 of ${WINNER_COUNT}`,
    );

    for (const place of PLACES_BEFORE_RESTART) {
      await expect(revealNextValueButton(facilitatorPage)).toBeEnabled({
        timeout: 10_000,
      });
      await revealNextValueButton(facilitatorPage).click();
      await expect(presenterPage.getByTestId("winner-place")).toHaveText(
        `Place ${place}`,
        { timeout: 10_000 },
      );
      await expect(presenterPage.getByTestId("winner-value")).toHaveText(
        winnerValueNames[place - 1],
      );
      await expect(presenterPage.getByTestId("winner-vote-count")).toHaveText(
        `${VOTE_TARGETS_BY_CARD_ORDER[place - 1]} votes`,
      );
    }

    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: ${PLACES_BEFORE_RESTART.length} of ${WINNER_COUNT}`,
    );
    await expect(
      participantPages[0].getByTestId("waiting-screen"),
    ).toBeVisible();
  });

  test("a mid-reveal restart resumes at the same winner screen", async () => {
    test.setTimeout(RESTART_TEST_TIMEOUT_MILLISECONDS);

    await restartBackendAwaitingReconnect(everyRolePage());

    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: ${PLACES_BEFORE_RESTART.length} of ${WINNER_COUNT}`,
      { timeout: 15_000 },
    );
    await expect(presenterPage.getByTestId("winner-place")).toHaveText(
      "Place 4",
      { timeout: 15_000 },
    );
    await expect(presenterPage.getByTestId("winner-value")).toHaveText(
      winnerValueNames[3],
    );
    for (const participantPage of participantPages) {
      await expect(participantPage.getByTestId("waiting-screen")).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("the facilitator and a participant reopen their tabs mid-reveal", async () => {
    test.setTimeout(60_000);

    await reopenFacilitatorTab();
    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: ${PLACES_BEFORE_RESTART.length} of ${WINNER_COUNT}`,
      { timeout: 15_000 },
    );
    await expect(revealNextValueButton(facilitatorPage)).toBeEnabled();

    const reopenedParticipantPage = await reopenParticipantTab(0);
    await expect(
      reopenedParticipantPage.getByTestId("waiting-screen"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("the remaining reveals conclude the workshop", async () => {
    test.setTimeout(120_000);

    for (const place of PLACES_AFTER_RESTART) {
      await expect(revealNextValueButton(facilitatorPage)).toBeEnabled({
        timeout: 10_000,
      });
      await revealNextValueButton(facilitatorPage).click();
      await expect(presenterPage.getByTestId("winner-place")).toHaveText(
        `Place ${place}`,
        { timeout: 10_000 },
      );
    }

    await expect(facilitatorPage.getByTestId("revealed-count")).toHaveText(
      `Revealed: ${WINNER_COUNT} of ${WINNER_COUNT}`,
    );
    await expect(facilitatorPage.getByTestId("concluded-note")).toBeVisible();
    await expect(presenterPage.getByTestId("winner-overview")).toBeVisible({
      timeout: 30_000,
    });
    await expect(presenterPage.getByTestId(/^overview-winner-/)).toHaveCount(
      WINNER_COUNT,
    );
    await expect(
      participantPages[0].getByTestId("workshop-concluded"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("a participant reopens the tab after the conclusion and downloads the record", async () => {
    test.setTimeout(90_000);

    const reopenedParticipantPage = await reopenParticipantTab(1);
    await expect(
      reopenedParticipantPage.getByTestId("workshop-concluded"),
    ).toBeVisible({ timeout: 15_000 });

    const downloadPromise = reopenedParticipantPage.waitForEvent("download");
    await reopenedParticipantPage
      .getByRole("button", { name: "Download workshop record (PDF)" })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(PDF_FILE_NAME);
  });
});
