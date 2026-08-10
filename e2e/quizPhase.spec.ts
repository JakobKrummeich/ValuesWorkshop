import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import { isPageStillMarked, markPage } from "./support/pageMarker";

const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNTS = ["participant1", "participant2", "participant3"];
const SESSION_NAME = "Playwright quiz session";
const QUESTION_COUNT = 5;
const CORRECT_ANSWER_INDEX = 0;
const WRONG_ANSWER_INDEX = 1;
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

  function advanceButton(): Locator {
    return facilitatorPage.getByRole("button", { name: "Advance phase" });
  }

  function quizControlButton(): Locator {
    return facilitatorPage.getByTestId("quiz-control-button");
  }

  function answerButton(page: Page, answerIndex: number): Locator {
    return page.getByTestId(`answer-button-${answerIndex}`);
  }

  async function barWidth(answerIndex: number): Promise<number> {
    const box = await presenterPage
      .getByTestId(`answer-bar-${answerIndex}`)
      .boundingBox();
    return box?.width ?? 0;
  }

  async function expectQuestionHeadingEverywhere(
    questionNumber: number,
  ): Promise<void> {
    for (const page of everyRolePage()) {
      await expect(page.getByTestId("question-heading")).toHaveText(
        `Question ${questionNumber} of ${QUESTION_COUNT}`,
      );
    }
  }

  test("advancing from the join phase shows question 1 to every role", async () => {
    await expect(advanceButton()).toBeEnabled();

    await advanceButton().click();

    await expectQuestionHeadingEverywhere(1);
    await expect(quizControlButton()).toHaveText("Reveal answer");
    await expect(advanceButton()).toBeDisabled();
  });

  test("votes raise the facilitator tallies and presenter bars without a reload", async () => {
    await markPage(facilitatorPage);
    await markPage(presenterPage);

    await answerButton(alicePage, CORRECT_ANSWER_INDEX).click();

    await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
      "Votes: 1",
    );
    await expect(facilitatorPage.getByTestId("answered-count")).toHaveText(
      "1 of 3 have answered",
    );
    await expect(presenterPage.getByTestId("answer-votes-0")).toHaveText("1");

    await answerButton(bobPage, WRONG_ANSWER_INDEX).click();
    await answerButton(charliePage, CORRECT_ANSWER_INDEX).click();

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

  test("a participant who voted is locked out of voting again", async () => {
    await expect(answerButton(alicePage, CORRECT_ANSWER_INDEX)).toHaveAttribute(
      "data-answer-status",
      "own",
    );
    for (let answerIndex = 0; answerIndex < 3; answerIndex += 1) {
      await expect(answerButton(alicePage, answerIndex)).toBeDisabled();
      await expect(answerButton(bobPage, answerIndex)).toBeDisabled();
    }
    await expect(answerButton(bobPage, WRONG_ANSWER_INDEX)).toHaveAttribute(
      "data-answer-status",
      "own",
    );
  });

  test("the reveal highlights the correct answer for every role", async () => {
    await quizControlButton().click();

    await expect(quizControlButton()).toHaveText("Show learning text");
    await expect(answerButton(alicePage, CORRECT_ANSWER_INDEX)).toHaveAttribute(
      "data-answer-status",
      "correct",
    );
    await expect(answerButton(bobPage, CORRECT_ANSWER_INDEX)).toHaveAttribute(
      "data-answer-status",
      "correct",
    );
    await expect(answerButton(bobPage, WRONG_ANSWER_INDEX)).toHaveAttribute(
      "data-answer-status",
      "ownIncorrect",
    );
    await expect(presenterPage.getByTestId("answer-bar-0")).toHaveClass(
      /correctBar/,
    );
    await expect(presenterPage.getByTestId("answer-bar-1")).toHaveClass(
      /dimmedBar/,
    );
    await expect(alicePage.getByTestId("learning-text")).toHaveCount(0);
    await expect(presenterPage.getByTestId("learning-text")).toHaveCount(0);
    await expect(advanceButton()).toBeDisabled();
  });

  test("the learning text appears for every role on the facilitator's command", async () => {
    await quizControlButton().click();

    await expect(quizControlButton()).toHaveText("Next question");
    await expect(alicePage.getByTestId("learning-text")).toContainText(
      FIRST_LEARNING_TEXT,
    );
    await expect(presenterPage.getByTestId("learning-text")).toContainText(
      FIRST_LEARNING_TEXT,
    );
    await expect(facilitatorPage.getByTestId("learning-text")).toContainText(
      FIRST_LEARNING_TEXT,
    );
    await expect(advanceButton()).toBeDisabled();
  });

  test("the next question resets the answering state with cleared marks", async () => {
    await quizControlButton().click();

    await expectQuestionHeadingEverywhere(2);
    await expect(quizControlButton()).toHaveText("Reveal answer");
    for (let answerIndex = 0; answerIndex < 3; answerIndex += 1) {
      await expect(answerButton(alicePage, answerIndex)).toBeEnabled();
      await expect(answerButton(alicePage, answerIndex)).toHaveAttribute(
        "data-answer-status",
        "neutral",
      );
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

  test("the advance stays disabled until the last learning text is shown", async () => {
    for (
      let questionNumber = 2;
      questionNumber <= QUESTION_COUNT;
      questionNumber += 1
    ) {
      await answerButton(alicePage, CORRECT_ANSWER_INDEX).click();
      await expect(facilitatorPage.getByTestId("answer-tally-0")).toHaveText(
        "Votes: 1",
      );
      await expect(advanceButton()).toBeDisabled();

      await expect(quizControlButton()).toHaveText("Reveal answer");
      await quizControlButton().click();
      await expect(quizControlButton()).toHaveText("Show learning text");
      await quizControlButton().click();

      if (questionNumber < QUESTION_COUNT) {
        await expect(quizControlButton()).toHaveText("Next question");
        await quizControlButton().click();
        await expectQuestionHeadingEverywhere(questionNumber + 1);
      }
    }

    await expect(quizControlButton()).toHaveCount(0);
  });

  test("after the last learning text the advance moves to phase 3", async () => {
    await expect(advanceButton()).toBeEnabled();

    await advanceButton().click();

    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 3");
    }
  });
});
