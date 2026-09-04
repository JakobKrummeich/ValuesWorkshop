import { expect, type Locator, type Page } from "@playwright/test";

export const QUIZ_QUESTION_COUNT = 5;

const FAST_FORWARD_ANSWER_INDEX = 0;

export function advancePhaseButton(facilitatorPage: Page): Locator {
  return facilitatorPage.getByTestId("advance-phase-button");
}

export function quizControlButton(facilitatorPage: Page): Locator {
  return facilitatorPage.getByTestId("quiz-control-button");
}

export function answerButton(page: Page, answerIndex: number): Locator {
  return page.getByTestId(`answer-button-${answerIndex}`);
}

export async function chooseAnswer(
  page: Page,
  answerIndex: number,
): Promise<void> {
  await answerButton(page, answerIndex).click();
  await page.getByTestId("lock-in-answer-button").click();
}

export async function expectQuestionHeading(
  pages: readonly Page[],
  questionNumber: number,
): Promise<void> {
  for (const page of pages) {
    await expect(page.getByTestId("question-heading")).toHaveText(
      `Question ${questionNumber} of ${QUIZ_QUESTION_COUNT}`,
    );
  }
}

export async function clickThroughQuestionControls(
  facilitatorPage: Page,
  hasNextQuestion: boolean,
): Promise<void> {
  await expect(quizControlButton(facilitatorPage)).toHaveText("Reveal answer");
  await quizControlButton(facilitatorPage).click();
  await expect(quizControlButton(facilitatorPage)).toHaveText(
    "Show learning text",
  );
  await quizControlButton(facilitatorPage).click();

  if (hasNextQuestion) {
    await expect(quizControlButton(facilitatorPage)).toHaveText(
      "Next question",
    );
    await quizControlButton(facilitatorPage).click();
  }
}

export async function fastForwardQuizAsFacilitatorAlone(
  facilitatorPage: Page,
): Promise<void> {
  for (
    let questionNumber = 1;
    questionNumber <= QUIZ_QUESTION_COUNT;
    questionNumber += 1
  ) {
    await clickThroughQuestionControls(
      facilitatorPage,
      questionNumber < QUIZ_QUESTION_COUNT,
    );
  }

  await expect(quizControlButton(facilitatorPage)).toHaveCount(0);
}

export async function fastForwardQuizQuestions(
  facilitatorPage: Page,
  answeringParticipantPage: Page,
  everyRolePages: readonly Page[],
  firstQuestionNumber = 1,
): Promise<void> {
  for (
    let questionNumber = firstQuestionNumber;
    questionNumber <= QUIZ_QUESTION_COUNT;
    questionNumber += 1
  ) {
    await chooseAnswer(answeringParticipantPage, FAST_FORWARD_ANSWER_INDEX);
    await expect(
      facilitatorPage.getByTestId(`answer-tally-${FAST_FORWARD_ANSWER_INDEX}`),
    ).toHaveText("Votes: 1");
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();

    await clickThroughQuestionControls(
      facilitatorPage,
      questionNumber < QUIZ_QUESTION_COUNT,
    );
    if (questionNumber < QUIZ_QUESTION_COUNT) {
      await expectQuestionHeading(everyRolePages, questionNumber + 1);
    }
  }

  await expect(quizControlButton(facilitatorPage)).toHaveCount(0);
}
