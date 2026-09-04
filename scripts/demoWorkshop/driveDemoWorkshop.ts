import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from "@playwright/test";
import { openSessionAsFacilitator } from "../../e2e/support/facilitatorSession";
import { revealNextValueButton } from "../../e2e/support/finalPresentation";
import {
  castBallot,
  eligibleValueIdsOf,
  spreadBallotOf,
} from "../../e2e/support/finalVoting";
import {
  assignedValueIdsOf,
  currentScribeNameOf,
} from "../../e2e/support/groupWork";
import { openSignedIn } from "../../e2e/support/oidcLogin";
import {
  type ParticipantAccount,
  participantAccounts,
} from "../../e2e/support/participantAccounts";
import {
  joinParticipantOn,
  openParticipantSession,
} from "../../e2e/support/participantSession";
import {
  advancePhaseButton,
  answerButton,
  chooseAnswer,
  clickThroughQuestionControls,
  QUIZ_QUESTION_COUNT,
  quizControlButton,
} from "../../e2e/support/quizFastForward";
import {
  confirmValueSelection,
  pickValues,
} from "../../e2e/support/valueSelection";
import {
  ACTION_TEXTS_BY_ORDER,
  DEMO_FACILITATOR_ACCOUNT,
  DEMO_PARTICIPANT_COUNT,
  DEMO_SESSION_NAME,
  MAIN_ROUND_ALLOTMENT,
  QUIZ_ANSWER_INDEX_BY_PARTICIPANT_ORDER,
  VOTE_TARGETS_BY_CARD_ORDER,
  VOTES_CAST_BEFORE_THE_PHONE_IS_CAPTURED,
  WINNER_COUNT,
} from "./demoWorkshopContent";

export type DemoMoment =
  | "roomFilled"
  | "quizTally"
  | "quizLearning"
  | "valuesPicked"
  | "selectionSubmitted"
  | "selectionResults"
  | "groupsForming"
  | "groupsFormed"
  | "actionsWritten"
  | "actionsPresented"
  | "votesInFlight"
  | "ballotSubmitted"
  | "winnersRevealed";

export type DemoWorkshop = {
  browser: Browser;
  facilitatorPage: Page;
  presenterPage: Page;
  capturedParticipantPage: Page;
  sessionIdentity: string;
  atMoment: (moment: DemoMoment) => Promise<void>;
};

type DemoParticipant = {
  account: ParticipantAccount;
  page: Page;
};

const demoAccounts = participantAccounts.slice(0, DEMO_PARTICIPANT_COUNT);
const STATE_TIMEOUT_MILLISECONDS = 20_000;

export async function openDemoSession(facilitatorPage: Page): Promise<string> {
  await openSignedIn(facilitatorPage, "/facilitator", DEMO_FACILITATOR_ACCOUNT);
  return openSessionAsFacilitator(facilitatorPage, DEMO_SESSION_NAME);
}

export async function openDemoWall(
  presenterPage: Page,
  sessionIdentity: string,
): Promise<void> {
  await presenterPage.goto(`/presenter?sessionIdentity=${sessionIdentity}`);
  await expect(presenterPage.getByTestId("participant-count")).toHaveText(
    "Participants: 0",
    { timeout: STATE_TIMEOUT_MILLISECONDS },
  );
}

export async function driveDemoWorkshop(workshop: DemoWorkshop): Promise<void> {
  const openedContexts: BrowserContext[] = [];
  try {
    const participants = await fillTheRoom(workshop, openedContexts);
    await runTheQuiz(workshop, participants);
    await pickTheValues(workshop, participants);
    await showTheSelectionResults(workshop);
    await formTheGroups(workshop);
    const presentationStepCount = await writeTheActions(workshop, participants);
    await presentTheActions(workshop, presentationStepCount);
    await castTheVotes(workshop, participants);
    await revealTheWinners(workshop);
  } finally {
    for (const context of openedContexts) {
      await context.close();
    }
  }
}

// Every filmed moment starts right after a drive step, so a step only counts
// as done once the wall has caught up as well: the wall is the camera's
// subject, and it renders a phase change a few frames behind the facilitator.
async function advanceTo(workshop: DemoWorkshop, phase: number): Promise<void> {
  await expect(advancePhaseButton(workshop.facilitatorPage)).toBeEnabled({
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
  await advancePhaseButton(workshop.facilitatorPage).click();
  for (const page of [workshop.facilitatorPage, workshop.presenterPage]) {
    await expect(page.getByTestId("phase")).toHaveText(`Phase ${phase}`, {
      timeout: STATE_TIMEOUT_MILLISECONDS,
    });
  }
}

async function expectJoined(
  page: Page,
  account: ParticipantAccount,
): Promise<void> {
  await expect(page.getByTestId("own-display-name")).toHaveText(
    `You are in, ${account.displayName}.`,
    { timeout: STATE_TIMEOUT_MILLISECONDS },
  );
}

async function fillTheRoom(
  workshop: DemoWorkshop,
  openedContexts: BrowserContext[],
): Promise<DemoParticipant[]> {
  const [capturedAccount, ...joiningAccounts] = demoAccounts;
  await joinParticipantOn(
    workshop.capturedParticipantPage,
    workshop.sessionIdentity,
    capturedAccount.accountName,
  );
  await expectJoined(workshop.capturedParticipantPage, capturedAccount);
  const participants: DemoParticipant[] = [
    { account: capturedAccount, page: workshop.capturedParticipantPage },
  ];

  const halfTheRoom = Math.ceil(DEMO_PARTICIPANT_COUNT / 2);
  for (const account of joiningAccounts) {
    const { context, page } = await openParticipantSession(
      workshop.browser,
      workshop.sessionIdentity,
      account.accountName,
    );
    openedContexts.push(context);
    await expectJoined(page, account);
    participants.push({ account, page });

    if (participants.length === halfTheRoom) {
      await workshop.atMoment("roomFilled");
    }
  }

  await expect(
    workshop.facilitatorPage.getByTestId("participant-count"),
  ).toHaveText(`Participants: ${DEMO_PARTICIPANT_COUNT}`, {
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
  await workshop.atMoment("roomFilled");

  return participants;
}

async function pressQuizControl(
  facilitatorPage: Page,
  label: string,
): Promise<void> {
  await expect(quizControlButton(facilitatorPage)).toHaveText(label, {
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
  await quizControlButton(facilitatorPage).click();
}

async function runTheQuiz(
  workshop: DemoWorkshop,
  participants: readonly DemoParticipant[],
): Promise<void> {
  await advanceTo(workshop, 2);

  await expect(answerButton(workshop.capturedParticipantPage, 0)).toBeVisible({
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
  const answerCount = await workshop.capturedParticipantPage
    .getByTestId(/^answer-button-/)
    .count();
  for (const [order, participant] of participants.entries()) {
    const spreadIndex =
      QUIZ_ANSWER_INDEX_BY_PARTICIPANT_ORDER[
        order % QUIZ_ANSWER_INDEX_BY_PARTICIPANT_ORDER.length
      ];
    await chooseAnswer(participant.page, spreadIndex % answerCount);
  }

  await pressQuizControl(workshop.facilitatorPage, "Reveal answer");
  await workshop.atMoment("quizTally");
  await pressQuizControl(workshop.facilitatorPage, "Show learning text");
  await expect(workshop.presenterPage.getByTestId("learning-text")).toBeVisible(
    { timeout: STATE_TIMEOUT_MILLISECONDS },
  );
  await workshop.atMoment("quizLearning");
  await pressQuizControl(workshop.facilitatorPage, "Next question");

  for (
    let questionNumber = 2;
    questionNumber <= QUIZ_QUESTION_COUNT;
    questionNumber += 1
  ) {
    await chooseAnswer(workshop.capturedParticipantPage, 0);
    await clickThroughQuestionControls(
      workshop.facilitatorPage,
      questionNumber < QUIZ_QUESTION_COUNT,
    );
  }
  await expect(quizControlButton(workshop.facilitatorPage)).toHaveCount(0);
}

async function pickTheValues(
  workshop: DemoWorkshop,
  participants: readonly DemoParticipant[],
): Promise<void> {
  await advanceTo(workshop, 3);

  const [capturedParticipant, ...otherParticipants] = participants;
  for (const [order, participant] of otherParticipants.entries()) {
    await pickValues(participant.page, order + 1);
    await confirmValueSelection(participant.page);
  }

  await pickValues(capturedParticipant.page, 0);
  await workshop.atMoment("valuesPicked");
  await confirmValueSelection(capturedParticipant.page);
  await expect(
    workshop.facilitatorPage.getByTestId("submitted-count"),
  ).toHaveText(
    `${DEMO_PARTICIPANT_COUNT} of ${DEMO_PARTICIPANT_COUNT} have submitted`,
    { timeout: STATE_TIMEOUT_MILLISECONDS },
  );
  await workshop.atMoment("selectionSubmitted");
}

async function showTheSelectionResults(workshop: DemoWorkshop): Promise<void> {
  await advanceTo(workshop, 4);
  await workshop.atMoment("selectionResults");
}

async function formTheGroups(workshop: DemoWorkshop): Promise<void> {
  await advanceTo(workshop, 5);
  await workshop.atMoment("groupsForming");
  await expect(
    workshop.facilitatorPage.getByTestId("formation-progress"),
  ).toHaveCount(0, { timeout: STATE_TIMEOUT_MILLISECONDS });
  await workshop.atMoment("groupsFormed");
}

async function animalIdsOf(facilitatorPage: Page): Promise<string[]> {
  const groupRows = facilitatorPage.locator('tr[data-testid^="group-row-"]');
  await expect(groupRows.first()).toBeVisible({
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
  const testIds = await groupRows.evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-testid") ?? ""),
  );
  return testIds.map((testId) => testId.replace("group-row-", ""));
}

async function writeTheActions(
  workshop: DemoWorkshop,
  participants: readonly DemoParticipant[],
): Promise<number> {
  await advanceTo(workshop, 6);
  const animalIds = await animalIdsOf(workshop.facilitatorPage);
  const pageByDisplayName = new Map(
    participants.map((participant) => [
      participant.account.displayName,
      participant.page,
    ]),
  );

  let presentationStepCount = animalIds.length;
  let actionIndex = 0;
  for (const [order, animalId] of animalIds.entries()) {
    const scribeName = await currentScribeNameOf(
      workshop.facilitatorPage,
      animalId,
    );
    const scribePage = pageByDisplayName.get(scribeName);
    if (scribePage === undefined) {
      throw new Error(`The scribe "${scribeName}" has no open phone`);
    }

    await expect(scribePage.getByTestId("add-action-button")).toBeVisible({
      timeout: STATE_TIMEOUT_MILLISECONDS,
    });
    const valueIds = await assignedValueIdsOf(scribePage);
    presentationStepCount += valueIds.length;
    for (const valueId of valueIds) {
      await scribePage.getByTestId(`value-tab-${valueId}`).click();
      await scribePage.getByTestId("add-action-button").click();
      await scribePage
        .getByTestId(/^action-input-/)
        .first()
        .fill(
          ACTION_TEXTS_BY_ORDER[actionIndex % ACTION_TEXTS_BY_ORDER.length],
        );
      actionIndex += 1;
    }

    await expect(
      scribePage.getByTestId("submit-group-work-button"),
    ).toBeEnabled({ timeout: STATE_TIMEOUT_MILLISECONDS });
    if (order === 0 || order === animalIds.length - 1) {
      await workshop.atMoment("actionsWritten");
    }
    await scribePage.getByTestId("submit-group-work-button").click();
    await expect(
      workshop.facilitatorPage.getByTestId(`group-status-${animalId}`),
    ).toHaveText("Submitted", { timeout: STATE_TIMEOUT_MILLISECONDS });
  }

  return presentationStepCount;
}

async function presentTheActions(
  workshop: DemoWorkshop,
  presentationStepCount: number,
): Promise<void> {
  await advanceTo(workshop, 7);
  const nextValueButton =
    workshop.facilitatorPage.getByTestId("next-value-button");
  const filmedSteps = new Set([
    1,
    Math.ceil(presentationStepCount / 2),
    presentationStepCount,
  ]);

  for (let step = 1; step <= presentationStepCount; step += 1) {
    if (filmedSteps.has(step)) {
      await workshop.atMoment("actionsPresented");
    }
    if (step < presentationStepCount) {
      await expect(nextValueButton).toBeEnabled({
        timeout: STATE_TIMEOUT_MILLISECONDS,
      });
      await nextValueButton.click();
    }
  }
  await expect(nextValueButton).toBeDisabled({
    timeout: STATE_TIMEOUT_MILLISECONDS,
  });
}

async function castTheVotes(
  workshop: DemoWorkshop,
  participants: readonly DemoParticipant[],
): Promise<void> {
  await advanceTo(workshop, 8);

  const [capturedParticipant, ...otherParticipants] = participants;
  const eligibleValueIds = await eligibleValueIdsOf(capturedParticipant.page);
  const ballotOf = (order: number) =>
    spreadBallotOf(
      order,
      VOTE_TARGETS_BY_CARD_ORDER,
      eligibleValueIds,
      MAIN_ROUND_ALLOTMENT,
    );
  const capturedVoteUnits = [...ballotOf(0)].flatMap(([valueId, votes]) =>
    Array.from({ length: votes }, () => valueId),
  );

  for (const valueId of capturedVoteUnits.slice(
    0,
    VOTES_CAST_BEFORE_THE_PHONE_IS_CAPTURED,
  )) {
    await capturedParticipant.page.getByTestId(`add-vote-${valueId}`).click();
  }
  await expect(capturedParticipant.page.getByTestId("votes-used")).toHaveText(
    `Your votes: ${VOTES_CAST_BEFORE_THE_PHONE_IS_CAPTURED}/${MAIN_ROUND_ALLOTMENT} used`,
  );
  await workshop.atMoment("votesInFlight");

  for (const [order, participant] of otherParticipants.entries()) {
    await castBallot(
      participant.page,
      ballotOf(order + 1),
      MAIN_ROUND_ALLOTMENT,
    );
  }
  for (const valueId of capturedVoteUnits.slice(
    VOTES_CAST_BEFORE_THE_PHONE_IS_CAPTURED,
  )) {
    await capturedParticipant.page.getByTestId(`add-vote-${valueId}`).click();
  }
  await capturedParticipant.page.getByTestId("submit-votes-button").click();
  await expect(
    capturedParticipant.page.getByTestId("votes-submitted-confirmation"),
  ).toBeVisible({ timeout: STATE_TIMEOUT_MILLISECONDS });
  await workshop.atMoment("ballotSubmitted");

  await expect(workshop.facilitatorPage.getByTestId("voted-count")).toHaveText(
    `Round 1 · voted: ${DEMO_PARTICIPANT_COUNT}/${DEMO_PARTICIPANT_COUNT}`,
    { timeout: STATE_TIMEOUT_MILLISECONDS },
  );
  await workshop.facilitatorPage.getByTestId("close-voting-button").click();
  await expect(
    workshop.facilitatorPage.getByTestId("closed-round-tallies"),
  ).toBeVisible({ timeout: STATE_TIMEOUT_MILLISECONDS });
}

async function revealTheWinners(workshop: DemoWorkshop): Promise<void> {
  await advanceTo(workshop, 9);
  await expect(
    workshop.presenterPage.getByTestId("reveal-anticipation"),
  ).toBeVisible({ timeout: STATE_TIMEOUT_MILLISECONDS });

  for (let place = WINNER_COUNT; place >= 1; place -= 1) {
    await expect(revealNextValueButton(workshop.facilitatorPage)).toBeEnabled({
      timeout: STATE_TIMEOUT_MILLISECONDS,
    });
    await revealNextValueButton(workshop.facilitatorPage).click();
    await expect(workshop.presenterPage.getByTestId("winner-place")).toHaveText(
      `Place ${place}`,
      { timeout: STATE_TIMEOUT_MILLISECONDS },
    );
    await workshop.atMoment("winnersRevealed");
  }
}
