import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { resolve } from "node:path";
import { openSessionAsFacilitator } from "../../e2e/support/facilitatorSession";
import {
  castBallot,
  eligibleValueIdsOf,
  spreadBallotOf,
} from "../../e2e/support/finalVoting";
import { revealNextValueButton } from "../../e2e/support/finalPresentation";
import {
  assignedValueIdsOf,
  currentScribeNameOf,
} from "../../e2e/support/groupWork";
import { openSignedIn } from "../../e2e/support/oidcLogin";
import {
  accountNameOf,
  participantAccounts,
} from "../../e2e/support/participantAccounts";
import {
  openParticipantSession,
  withParticipant,
} from "../../e2e/support/participantSession";
import {
  advancePhaseButton,
  fastForwardQuizAsFacilitatorAlone,
} from "../../e2e/support/quizFastForward";
import { submitValueSelection } from "../../e2e/support/valueSelection";
import { LAPTOP_VIEWPORT, WALL_VIEWPORT } from "../../e2e/support/viewports";

const MEDIA_DIRECTORY = resolve(__dirname, "../../docs/media");
const FACILITATOR_ACCOUNT = "facilitator";
const SESSION_NAME = "Values workshop";
const PARTICIPANT_COUNT = 8;
const MAIN_ROUND_ALLOTMENT = 5;
const PHOTOGENIC_BALLOT_VOTES = 3;
const VOTE_TARGETS_BY_CARD_ORDER = [10, 8, 6, 5, 4, 3, 2, 1, 1, 0];
const WINNER_COUNT = 5;
const PHOTOGENIC_REVEAL_PLACE = 3;
const ACTION_TEXTS_BY_ORDER = [
  "We start every meeting with a two-minute check-in round",
  "Decisions get a written rationale before we announce them",
  "Every team member owns one experiment per quarter",
  "We share unfinished work on Fridays and ask for honest reactions",
  "Nobody is interrupted while speaking, and everyone gets asked",
  "We block Wednesday afternoons for focused work without meetings",
  "Mistakes are told as stories in the retrospective, never as blame",
  "New joiners get a buddy and a first small win in their first week",
  "We say what we will not do when we plan the quarter",
  "Praise is spoken out loud in the team channel, feedback in private",
];

const demoParticipants = participantAccounts.slice(0, PARTICIPANT_COUNT);

test.describe.serial("capture the README screenshots", () => {
  let facilitatorContext: BrowserContext;
  let presenterContext: BrowserContext;
  let facilitatorPage: Page;
  let presenterPage: Page;
  let sessionIdentity: string;
  let presentationStepCount = 0;

  test.beforeAll(async ({ browser }) => {
    facilitatorContext = await browser.newContext({
      viewport: LAPTOP_VIEWPORT,
    });
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

  async function advanceTo(phase: number): Promise<void> {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled({
      timeout: 15_000,
    });
    await advancePhaseButton(facilitatorPage).click();
    await expect(facilitatorPage.getByTestId("phase")).toHaveText(
      `Phase ${phase}`,
    );
  }

  function capture(page: Page, fileName: string): Promise<Buffer> {
    return page.screenshot({ path: resolve(MEDIA_DIRECTORY, fileName) });
  }

  test("participants join and the facilitator runs the quiz", async ({
    browser,
  }) => {
    for (const account of demoParticipants) {
      await withParticipant(
        browser,
        sessionIdentity,
        account.accountName,
        async (page) => {
          await expect(page.getByTestId("own-display-name")).toHaveText(
            `You are in, ${account.displayName}.`,
            { timeout: 15_000 },
          );
        },
      );
    }
    await expect(facilitatorPage.getByTestId("participant-count")).toHaveText(
      `Participants: ${PARTICIPANT_COUNT}`,
    );

    await advanceTo(2);
    await fastForwardQuizAsFacilitatorAlone(facilitatorPage);
  });

  test("participants pick overlapping value sets", async ({ browser }) => {
    await advanceTo(3);

    for (const [participantIndex, account] of demoParticipants.entries()) {
      await withParticipant(
        browser,
        sessionIdentity,
        account.accountName,
        (page) => submitValueSelection(page, participantIndex),
      );
    }
    await expect(facilitatorPage.getByTestId("submitted-count")).toHaveText(
      `${PARTICIPANT_COUNT} of ${PARTICIPANT_COUNT} have submitted`,
    );
  });

  test("groups form, every scribe writes the actions, and the facilitator table is captured", async ({
    browser,
  }) => {
    await advanceTo(4);
    await advanceTo(5);
    await expect(facilitatorPage.getByTestId("formation-progress")).toHaveCount(
      0,
      { timeout: 20_000 },
    );
    await advanceTo(6);

    const groupRows = facilitatorPage.locator('tr[data-testid^="group-row-"]');
    await expect(groupRows.first()).toBeVisible();
    const animalIds = (
      await groupRows.evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-testid") ?? ""),
      )
    ).map((testId) => testId.replace("group-row-", ""));
    const lastAnimalId = animalIds.at(-1);

    presentationStepCount = animalIds.length;
    let actionIndex = 0;
    for (const animalId of animalIds) {
      const scribeName = await currentScribeNameOf(facilitatorPage, animalId);

      await withParticipant(
        browser,
        sessionIdentity,
        accountNameOf(scribeName),
        async (page) => {
          await expect(page.getByTestId("add-action-button")).toBeVisible({
            timeout: 15_000,
          });
          const valueIds = await assignedValueIdsOf(page);
          presentationStepCount += valueIds.length;
          for (const valueId of valueIds) {
            await page.getByTestId(`value-tab-${valueId}`).click();
            await page.getByTestId("add-action-button").click();
            await page
              .getByTestId(/^action-input-/)
              .first()
              .fill(
                ACTION_TEXTS_BY_ORDER[
                  actionIndex % ACTION_TEXTS_BY_ORDER.length
                ],
              );
            actionIndex += 1;
          }
          await expect(
            page.getByTestId("submit-group-work-button"),
          ).toBeEnabled({ timeout: 5_000 });
          if (animalId === lastAnimalId) {
            await capture(facilitatorPage, "facilitator-group-work.png");
          }
          await page.getByTestId("submit-group-work-button").click();
          await expect(
            facilitatorPage.getByTestId(`group-status-${animalId}`),
          ).toHaveText("Submitted", { timeout: 5_000 });
        },
      );
    }
  });

  test("the facilitator walks through the presentation", async () => {
    await advanceTo(7);
    const nextValueButton = facilitatorPage.getByTestId("next-value-button");

    for (let step = 1; step < presentationStepCount; step += 1) {
      await expect(nextValueButton).toBeEnabled({ timeout: 10_000 });
      await nextValueButton.click();
    }
    await expect(nextValueButton).toBeDisabled({ timeout: 10_000 });
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
  });

  test("the final vote is captured on a phone", async ({ browser }) => {
    await advanceTo(8);

    const [photographedParticipant, ...otherParticipants] = demoParticipants;
    const { context, page } = await openParticipantSession(
      browser,
      sessionIdentity,
      photographedParticipant.accountName,
    );
    try {
      const eligibleValueIds = await eligibleValueIdsOf(page);
      const ballotOf = (participantIndex: number) =>
        spreadBallotOf(
          participantIndex,
          VOTE_TARGETS_BY_CARD_ORDER,
          eligibleValueIds,
          MAIN_ROUND_ALLOTMENT,
        );

      const photographedVoteUnits = [...ballotOf(0)].flatMap(
        ([valueId, votes]) => Array.from({ length: votes }, () => valueId),
      );
      for (const valueId of photographedVoteUnits.slice(
        0,
        PHOTOGENIC_BALLOT_VOTES,
      )) {
        await page.getByTestId(`add-vote-${valueId}`).click();
      }
      await expect(page.getByTestId("votes-used")).toHaveText(
        `Your votes: ${PHOTOGENIC_BALLOT_VOTES}/${MAIN_ROUND_ALLOTMENT} used`,
      );
      await capture(page, "participant-final-voting.png");

      for (const [otherIndex, account] of otherParticipants.entries()) {
        await withParticipant(
          browser,
          sessionIdentity,
          account.accountName,
          (otherPage) =>
            castBallot(
              otherPage,
              ballotOf(otherIndex + 1),
              MAIN_ROUND_ALLOTMENT,
            ),
        );
      }

      for (const valueId of photographedVoteUnits.slice(
        PHOTOGENIC_BALLOT_VOTES,
      )) {
        await page.getByTestId(`add-vote-${valueId}`).click();
      }
      await expect(page.getByTestId("votes-used")).toHaveText(
        `Your votes: ${MAIN_ROUND_ALLOTMENT}/${MAIN_ROUND_ALLOTMENT} used`,
      );
      await page.getByTestId("submit-votes-button").click();
      await expect(
        page.getByTestId("votes-submitted-confirmation"),
      ).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await context.close();
    }

    await expect(facilitatorPage.getByTestId("voted-count")).toHaveText(
      `Round 1 · voted: ${PARTICIPANT_COUNT}/${PARTICIPANT_COUNT}`,
    );
    await facilitatorPage.getByTestId("close-voting-button").click();
    await expect(
      facilitatorPage.getByTestId("closed-round-tallies"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("the wall is captured while revealing the winners", async () => {
    await advanceTo(9);
    await expect(presenterPage.getByTestId("reveal-anticipation")).toBeVisible({
      timeout: 10_000,
    });

    for (
      let place = WINNER_COUNT;
      place >= PHOTOGENIC_REVEAL_PLACE;
      place -= 1
    ) {
      await expect(revealNextValueButton(facilitatorPage)).toBeEnabled({
        timeout: 10_000,
      });
      await revealNextValueButton(facilitatorPage).click();
      await expect(presenterPage.getByTestId("winner-place")).toHaveText(
        `Place ${place}`,
        { timeout: 10_000 },
      );
    }
    await expect(presenterPage.getByTestId("winner-actions")).toHaveCSS(
      "opacity",
      "1",
      { timeout: 10_000 },
    );
    await capture(presenterPage, "presenter-final-presentation.png");
  });
});
