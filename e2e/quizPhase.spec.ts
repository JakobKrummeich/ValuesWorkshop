import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import { isPageStillMarked, markPage } from "./support/pageMarker";
import {
  advancePhaseButton,
  answerButton,
  chooseAnswer,
  expectQuestionHeading,
  fastForwardQuizQuestions,
  quizControlButton,
} from "./support/quizFastForward";

const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNTS = ["participant1", "participant2", "participant3"];
const SESSION_NAME = "Playwright quiz session";
const CORRECT_ANSWER_INDEX = 0;
const WRONG_ANSWER_INDEX = 1;
const CORRECT_ANSWER_TEXT =
  "They give orientation for decisions when no rule applies.";
const WRONG_ANSWER_TEXT =
  "They replace employment contracts and process descriptions.";
const FIRST_LEARNING_TEXT =
  "Values work where rules end: they help teams decide consistently in everyday situations.";
const PHONE_VIEWPORT = { width: 390, height: 844 };
const WALL_VIEWPORT = { width: 1920, height: 1080 };

test.describe.serial("phase 2 quiz", () => {
  let facilitatorContext: BrowserContext;
  let participantContexts: BrowserContext[];
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let alicePage: Page;
  let bobPage: Page;
  let charliePage: Page;
  let presenterPage: Page;

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext();
    participantContexts = await Promise.all(
      PARTICIPANT_ACCOUNTS.map(() =>
        browser.newContext({ viewport: PHONE_VIEWPORT }),
      ),
    );
    presenterContext = await browser.newContext({ viewport: WALL_VIEWPORT });

    facilitatorPage = await facilitatorContext.newPage();
    [alicePage, bobPage, charliePage] = await Promise.all(
      participantContexts.map((context) => context.newPage()),
    );
    presenterPage = await presenterContext.newPage();

    await openSignedIn(facilitatorPage, "/facilitator", FACILITATOR_ACCOUNT);
    const sessionIdentity = await openSessionAsFacilitator(
      facilitatorPage,
      SESSION_NAME,
    );

    for (const [index, participantPage] of participantPages().entries()) {
      await participantPage.goto(
        `/participant?sessionIdentity=${sessionIdentity}`,
      );
      await signInThroughOidcProvider(
        participantPage,
        PARTICIPANT_ACCOUNTS[index],
      );
      await expect(participantPage.getByTestId("own-display-name")).toBeVisible(
        { timeout: 15_000 },
      );
    }

    await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);
    await expect(presenterPage.getByTestId("participant-count")).toHaveText(
      `Participants: ${PARTICIPANT_ACCOUNTS.length}`,
    );
  });

  test.afterAll(async () => {
    await facilitatorContext.close();
    for (const context of participantContexts) {
      await context.close();
    }
    await presenterContext.close();
  });

  function participantPages(): Page[] {
    return [alicePage, bobPage, charliePage];
  }

  function everyRolePage(): Page[] {
    return [facilitatorPage, ...participantPages(), presenterPage];
  }

  async function barWidth(answerIndex: number): Promise<number> {
    const box = await presenterPage
      .getByTestId(`answer-bar-${answerIndex}`)
      .boundingBox();
    return box?.width ?? 0;
  }

  test("advancing from the join phase shows question 1 to every role", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();

    await advancePhaseButton(facilitatorPage).click();

    await expectQuestionHeading(everyRolePage(), 1);
    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Reveal answer",
    );
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
  });

  test("votes raise the facilitator tallies and presenter bars without a reload", async () => {
    await markPage(facilitatorPage);
    await markPage(presenterPage);

    await chooseAnswer(alicePage, CORRECT_ANSWER_INDEX);

    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 1",
    );
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      "1 of 3 have answered",
    );
    await expect(presenterPage.getByTestId("answer-votes-0")).toHaveText("1");

    await chooseAnswer(bobPage, WRONG_ANSWER_INDEX);
    await chooseAnswer(charliePage, CORRECT_ANSWER_INDEX);

    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 2",
    );
    await expect(facilitatorPage.getByTestId("answer-tally-1")).toHaveText(
      "Votes: 1",
    );
    await expect(facilitatorPage.getByTestId("answer-tally-2")).toHaveText(
      "Votes: 0",
    );
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      "3 of 3 have answered",
    );
    await expect(presenterPage.getByTestId("answer-votes-0")).toHaveText("2");
    await expect(presenterPage.getByTestId("answer-votes-1")).toHaveText("1");
    await expect(presenterPage.getByTestId("answer-votes-2")).toHaveText("0");

    await expect
      .poll(async () => (await barWidth(0)) > (await barWidth(1)))
      .toBe(true);
    await expect.poll(async () => (await barWidth(1)) > 0).toBe(true);
    await expect.poll(() => barWidth(2)).toBe(0);

    expect(await isPageStillMarked(facilitatorPage)).toBe(true);
    expect(await isPageStillMarked(presenterPage)).toBe(true);
  });

  test("a participant who voted sees the own-answer confirmation instead of the buttons", async () => {
    await expect(
      alicePage.getByTestId("own-answer-confirmation"),
    ).toBeVisible();
    await expect(alicePage.getByTestId("own-answer-text")).toHaveText(
      CORRECT_ANSWER_TEXT,
    );
    await expect(alicePage.getByTestId(/^answer-button-/)).toHaveCount(0);
    await expect(bobPage.getByTestId("own-answer-text")).toHaveText(
      WRONG_ANSWER_TEXT,
    );
    await expect(bobPage.getByTestId(/^answer-button-/)).toHaveCount(0);
  });

  test("a reload restores the own-answer confirmation", async () => {
    await alicePage.reload();

    await expect(alicePage.getByTestId("own-answer-text")).toHaveText(
      CORRECT_ANSWER_TEXT,
      { timeout: 15_000 },
    );
    await expect(alicePage.getByTestId(/^answer-button-/)).toHaveCount(0);
  });

  test("the reveal highlights the correct answer on the wall while phones keep the confirmation", async () => {
    await quizControlButton(facilitatorPage).click();

    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Show learning text",
    );
    await expect(presenterPage.getByTestId("answer-bar-0")).toHaveClass(
      /correctBar/,
    );
    await expect(presenterPage.getByTestId("answer-bar-1")).toHaveClass(
      /dimmedBar/,
    );
    for (const page of participantPages()) {
      await expect(page.getByTestId("own-answer-confirmation")).toBeVisible();
      await expect(page.getByTestId(/^answer-button-/)).toHaveCount(0);
      await expect(page.getByTestId("learning-text")).toHaveCount(0);
    }
    await expect(presenterPage.getByTestId("learning-text")).toHaveCount(0);
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
  });

  test("the learning text appears on the wall while phones keep the confirmation", async () => {
    await quizControlButton(facilitatorPage).click();

    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Next question",
    );
    await expect(presenterPage.getByTestId("learning-text")).toContainText(
      FIRST_LEARNING_TEXT,
    );
    await expect(facilitatorPage.getByTestId("learning-text")).toContainText(
      FIRST_LEARNING_TEXT,
    );
    await expect(alicePage.getByTestId("learning-text")).toHaveCount(0);
    await expect(
      alicePage.getByTestId("own-answer-confirmation"),
    ).toBeVisible();
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
  });

  test("the next question resets the answering state with cleared marks", async () => {
    await quizControlButton(facilitatorPage).click();

    await expectQuestionHeading(everyRolePage(), 2);
    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Reveal answer",
    );
    await expect(alicePage.getByTestId("own-answer-confirmation")).toHaveCount(
      0,
    );
    for (let answerIndex = 0; answerIndex < 3; answerIndex += 1) {
      await expect(answerButton(alicePage, answerIndex)).toBeEnabled();
      await expect(
        facilitatorPage.getByTestId(`answer-tally-${answerIndex}`),
      ).toHaveText("Votes: 0");
      await expect(
        presenterPage.getByTestId(`answer-votes-${answerIndex}`),
      ).toHaveText("0");
    }
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      "0 of 3 have answered",
    );
    await expect(alicePage.getByTestId("learning-text")).toHaveCount(0);
    await expect(presenterPage.getByTestId("learning-text")).toHaveCount(0);
    await expect.poll(() => barWidth(0)).toBe(0);
  });

  test("a participant who never answered sees the waiting screen after the reveal", async () => {
    await chooseAnswer(alicePage, CORRECT_ANSWER_INDEX);
    await chooseAnswer(bobPage, WRONG_ANSWER_INDEX);
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      "2 of 3 have answered",
    );

    await quizControlButton(facilitatorPage).click();

    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Show learning text",
    );
    await expect(charliePage.getByTestId("waiting-screen")).toBeVisible();
    await expect(charliePage.getByTestId("question-heading")).toHaveCount(0);
    await expect(charliePage.getByTestId(/^answer-button-/)).toHaveCount(0);
    await expect(
      charliePage.getByTestId("own-answer-confirmation"),
    ).toHaveCount(0);
    await expect(
      alicePage.getByTestId("own-answer-confirmation"),
    ).toBeVisible();
  });

  test("the next question brings the silent participant back to the answers", async () => {
    await quizControlButton(facilitatorPage).click();

    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Next question",
    );
    await expect(charliePage.getByTestId("waiting-screen")).toBeVisible();

    await quizControlButton(facilitatorPage).click();

    await expectQuestionHeading(everyRolePage(), 3);
    await expect(charliePage.getByTestId("waiting-screen")).toHaveCount(0);
    await expect(answerButton(charliePage, 0)).toBeEnabled();
  });

  test("the advance stays disabled until the last learning text is shown", async () => {
    await fastForwardQuizQuestions(
      facilitatorPage,
      alicePage,
      everyRolePage(),
      3,
    );
  });

  test("after the last learning text the advance moves to phase 3", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();

    await advancePhaseButton(facilitatorPage).click();

    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 3");
    }
  });
});
