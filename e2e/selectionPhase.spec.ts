import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { openSessionAsFacilitator } from "./support/facilitatorSession";
import { openSignedIn, signInThroughOidcProvider } from "./support/oidcLogin";
import {
  advancePhaseButton,
  expectQuestionHeading,
  fastForwardQuizQuestions,
} from "./support/quizFastForward";

const FACILITATOR_ACCOUNT = "facilitator";
const PARTICIPANT_ACCOUNTS = ["participant1", "participant2", "participant3"];
const SESSION_NAME = "Playwright selection session";
const PHONE_VIEWPORT = { width: 390, height: 844 };
const WALL_VIEWPORT = { width: 1920, height: 1080 };

const CATALOG_SIZE = 50;
const FIRST_NINE_VALUE_IDS = [
  "freiheit",
  "autonomie",
  "kreativitaet",
  "neugier",
  "authentizitaet",
  "offenheit",
  "mut",
  "anpassungsfaehigkeit",
  "lernen",
];
const TRUST_VALUE_ID = "vertrauen";
const SWAP_OUT_VALUE_ID = "freiheit";
const SWAP_IN_VALUE_ID = "leistung";
const BOB_VALUE_IDS = [
  "vertrauen",
  "autonomie",
  "kreativitaet",
  "neugier",
  "freiheit",
  "exzellenz",
  "kompetenz",
  "ehrgeiz",
  "entschlossenheit",
  "ausdauer",
];
const CHARLIE_VALUE_IDS = [
  "vertrauen",
  "authentizitaet",
  "offenheit",
  "mut",
  "freiheit",
  "exzellenz",
  "kompetenz",
  "disziplin",
  "freude",
  "humor",
];
const EXPECTED_TOP_VALUE_IDS = [
  "vertrauen",
  "freiheit",
  "autonomie",
  "kreativitaet",
  "neugier",
  "authentizitaet",
  "offenheit",
  "mut",
  "exzellenz",
  "kompetenz",
];
const EXPECTED_DISTINCT_SELECTED_COUNT = 19;

test.describe.serial("value selection through group formation", () => {
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

  function valueChip(page: Page, valueId: string): Locator {
    return page.getByTestId(`value-chip-${valueId}`);
  }

  function selectedCount(page: Page): Locator {
    return page.getByTestId("selected-count");
  }

  function submittedCount(page: Page): Locator {
    return page.getByTestId("submitted-count");
  }

  function submittedConfirmation(page: Page): Locator {
    return page.getByTestId("selection-submitted-confirmation");
  }

  async function formationPercent(page: Page): Promise<number> {
    return Number(
      await page.getByRole("progressbar").getAttribute("aria-valuenow"),
    );
  }

  async function submitThroughConfirmationDialog(page: Page): Promise<void> {
    await page.getByTestId("submit-selection-button").click();
    await page.getByTestId("confirm-submit-button").click();
    await expect(submittedConfirmation(page)).toBeVisible();
  }

  test("the quiz fast-forwards from the join phase to its last learning text", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();

    await advancePhaseButton(facilitatorPage).click();

    await expectQuestionHeading(everyRolePage(), 1);
    await fastForwardQuizQuestions(facilitatorPage, alicePage, everyRolePage());
  });

  test("advancing after the quiz shows the value selection to every role", async () => {
    await advancePhaseButton(facilitatorPage).click();

    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 3");
    }
    await expect(alicePage.getByText("Pick exactly 10 values")).toBeVisible();
    await expect(selectedCount(alicePage)).toHaveText("Selected: 0/10");
    await expect(alicePage.getByTestId(/^value-chip-/)).toHaveCount(
      CATALOG_SIZE,
    );
    await expect(valueChip(alicePage, TRUST_VALUE_ID)).toHaveText("Trust");
    await expect(alicePage.getByTestId("submit-selection-button")).toHaveText(
      "Submit selection",
    );
    await expect(alicePage.getByTestId("submit-selection-button")).toBeDisabled();
    await expect(presenterPage.getByText("Pick your 10 values")).toBeVisible();
    await expect(submittedCount(facilitatorPage)).toHaveText(
      "0 of 3 have submitted",
    );
    await expect(submittedCount(presenterPage)).toHaveText(
      "0 of 3 have submitted",
    );
  });

  test("the counter follows the selection and the tenth pick disables the rest", async () => {
    for (const valueId of FIRST_NINE_VALUE_IDS.slice(0, 7)) {
      await valueChip(alicePage, valueId).click();
    }
    await expect(selectedCount(alicePage)).toHaveText("Selected: 7/10");

    for (const valueId of FIRST_NINE_VALUE_IDS.slice(7)) {
      await valueChip(alicePage, valueId).click();
    }
    await expect(selectedCount(alicePage)).toHaveText("Selected: 9/10");
    await expect(valueChip(alicePage, SWAP_IN_VALUE_ID)).toBeEnabled();

    await valueChip(alicePage, TRUST_VALUE_ID).click();

    await expect(selectedCount(alicePage)).toHaveText("Selected: 10/10");
    await expect(valueChip(alicePage, SWAP_IN_VALUE_ID)).toBeDisabled();
    await expect(valueChip(alicePage, TRUST_VALUE_ID)).toBeEnabled();
    await expect(valueChip(alicePage, TRUST_VALUE_ID)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(alicePage.getByTestId("submit-selection-button")).toBeEnabled();
  });

  test("a full selection swaps a value by deselecting one first", async () => {
    await valueChip(alicePage, SWAP_OUT_VALUE_ID).click();

    await expect(selectedCount(alicePage)).toHaveText("Selected: 9/10");
    await expect(valueChip(alicePage, SWAP_IN_VALUE_ID)).toBeEnabled();
    await expect(alicePage.getByTestId("submit-selection-button")).toBeDisabled();

    await valueChip(alicePage, SWAP_IN_VALUE_ID).click();

    await expect(selectedCount(alicePage)).toHaveText("Selected: 10/10");
    await expect(valueChip(alicePage, SWAP_OUT_VALUE_ID)).toBeDisabled();
    await expect(valueChip(alicePage, SWAP_OUT_VALUE_ID)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("the confirmed submit replaces the grid with the confirmation and raises the progress", async () => {
    await alicePage.getByTestId("submit-selection-button").click();

    const dialog = alicePage.getByRole("dialog");
    await expect(
      dialog.getByText("Submit your selection for good?"),
    ).toBeVisible();
    await expect(
      dialog.getByText("Your selection cannot be changed afterwards."),
    ).toBeVisible();
    await expect(alicePage.getByTestId("confirm-submit-button")).toHaveText(
      "Submit",
    );

    await alicePage.getByTestId("confirm-submit-button").click();

    await expect(submittedConfirmation(alicePage)).toContainText(
      "Submission successful",
    );
    await expect(submittedConfirmation(alicePage)).toContainText(
      "Your selection has been submitted.",
    );
    await expect(alicePage.getByTestId("submit-selection-button")).toHaveCount(
      0,
    );
    await expect(alicePage.getByTestId(/^value-chip-/)).toHaveCount(0);
    await expect(alicePage.getByTestId("selected-count")).toHaveCount(0);
    await expect(submittedCount(facilitatorPage)).toHaveText(
      "1 of 3 have submitted",
    );
    await expect(submittedCount(presenterPage)).toHaveText(
      "1 of 3 have submitted",
    );
  });

  test("the remaining participants submit and complete the progress", async () => {
    const remainingSelections: Array<[Page, string[]]> = [
      [bobPage, BOB_VALUE_IDS],
      [charliePage, CHARLIE_VALUE_IDS],
    ];
    for (const [participantPage, valueIds] of remainingSelections) {
      for (const valueId of valueIds) {
        await valueChip(participantPage, valueId).click();
      }
      await submitThroughConfirmationDialog(participantPage);
    }

    await expect(submittedCount(facilitatorPage)).toHaveText(
      "3 of 3 have submitted",
    );
    await expect(submittedCount(presenterPage)).toHaveText(
      "3 of 3 have submitted",
    );
  });

  test("a reload restores the submission confirmation", async () => {
    await alicePage.reload();

    await expect(submittedConfirmation(alicePage)).toBeVisible({
      timeout: 15_000,
    });
    await expect(alicePage.getByTestId(/^value-chip-/)).toHaveCount(0);
    await expect(alicePage.getByTestId("submit-selection-button")).toHaveCount(
      0,
    );
  });

  test("the advance into phase 4 shows the chart on the wall and a waiting screen on phones", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();

    await advancePhaseButton(facilitatorPage).click();

    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 4");
      await expect(page.getByTestId("connection")).toHaveText("Connected");
    }
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("results-heading")).toHaveText(
        "Your top values",
      );
    }
    for (const page of participantPages()) {
      await expect(page.getByTestId("waiting-screen")).toBeVisible();
      await expect(page.getByTestId("results-heading")).toHaveCount(0);
    }
    await expect(submittedConfirmation(alicePage)).toHaveCount(0);
    await expect(submittedCount(facilitatorPage)).toHaveCount(0);
    await expect(submittedCount(presenterPage)).toHaveCount(0);
  });

  test("the facilitator and the presenter see the shared tallies with the top ten highlighted", async () => {
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("result-count-vertrauen")).toHaveText("3");
      await expect(page.getByTestId("result-count-freiheit")).toHaveText("2");
      await expect(page.getByTestId("result-count-humor")).toHaveText("1");
      await expect(page.getByTestId(/^result-row-/)).toHaveCount(
        EXPECTED_DISTINCT_SELECTED_COUNT,
      );
      await expect(page.locator('[data-top-value="true"]')).toHaveCount(
        EXPECTED_TOP_VALUE_IDS.length,
      );
      await expect(page.getByTestId("hidden-values-hint")).toHaveCount(0);
      await expect(page.getByTestId("results-empty-note")).toHaveCount(0);
    }
    for (const page of participantPages()) {
      await expect(page.getByTestId(/^result-row-/)).toHaveCount(0);
      await expect(page.getByTestId(/^result-count-/)).toHaveCount(0);
    }
  });

  test("the presenter ranks trust first and keeps the facilitator advancing", async () => {
    await expect(
      presenterPage.getByTestId(/^result-row-/).first(),
    ).toHaveAttribute("data-testid", "result-row-vertrauen");
    for (const valueId of EXPECTED_TOP_VALUE_IDS) {
      await expect(
        presenterPage.getByTestId(`result-row-${valueId}`),
      ).toHaveAttribute("data-top-value", "true");
    }
    await expect(
      presenterPage.getByTestId("result-row-anpassungsfaehigkeit"),
    ).toHaveAttribute("data-top-value", "false");

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
  });

  test("the advance into phase 5 runs the progress bar on every screen", async () => {
    await advancePhaseButton(facilitatorPage).click();

    await Promise.all(
      everyRolePage().map((page) =>
        expect(page.getByTestId("formation-progress")).toBeVisible(),
      ),
    );
    await expect(advancePhaseButton(facilitatorPage)).toBeDisabled();
    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 5");
      await expect(page.getByTestId(/^group-card-/)).toHaveCount(0);
    }
  });

  test("the bar follows the progress the server keeps sending", async () => {
    for (const page of [presenterPage, alicePage]) {
      const shownFirst = await formationPercent(page);

      await expect
        .poll(() => formationPercent(page))
        .toBeGreaterThan(shownFirst);
    }
  });

  test("a client that reloads during the window rejoins the running bar", async () => {
    await Promise.all([presenterPage.reload(), alicePage.reload()]);

    for (const page of [presenterPage, alicePage]) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 5", {
        timeout: 15_000,
      });
      await expect(page.getByTestId("formation-progress")).toBeVisible();
      await expect(page.getByTestId(/^group-card-/)).toHaveCount(0);
      expect(await formationPercent(page)).toBeGreaterThan(0);
    }
    await expect(alicePage.getByTestId("own-group-card")).toHaveCount(0);
  });

  test("the finished progress bar deals every participant into the otter group", async () => {
    for (const page of participantPages()) {
      await expect(page.getByTestId("formation-progress")).toHaveCount(0, {
        timeout: 20_000,
      });
      const ownGroupCard = page.getByTestId("own-group-card");
      await expect(ownGroupCard.getByTestId("group-name")).toHaveText("Otter");
      await expect(ownGroupCard.getByTestId("group-member")).toHaveText([
        "Alice",
        "Bob",
        "Charlie",
      ]);
      await expect(ownGroupCard.getByTestId(/^group-value-/)).toHaveCount(
        EXPECTED_TOP_VALUE_IDS.length,
      );
      await expect(
        ownGroupCard.getByTestId("group-value-vertrauen"),
      ).toHaveText("Trust");
      await expect(
        ownGroupCard.getByTestId("group-value-freiheit"),
      ).toHaveText("Freedom");
      await expect(
        ownGroupCard.getByTestId("group-value-kompetenz"),
      ).toHaveText("Competence");
    }
  });

  test("the facilitator and the presenter show the single group card", async () => {
    for (const page of [facilitatorPage, presenterPage]) {
      await expect(page.getByTestId("formation-progress")).toHaveCount(0, {
        timeout: 20_000,
      });
      await expect(page.getByTestId(/^group-card-/)).toHaveCount(1);
      const groupCard = page.getByTestId("group-card-otter");
      await expect(groupCard.getByTestId("group-name")).toHaveText("Otter");
      await expect(groupCard.getByTestId("group-member")).toHaveText([
        "Alice",
        "Bob",
        "Charlie",
      ]);
      await expect(groupCard.getByTestId(/^group-value-/)).toHaveCount(
        EXPECTED_TOP_VALUE_IDS.length,
      );
      await expect(groupCard.getByTestId("group-value-vertrauen")).toHaveText(
        "Trust",
      );
      await expect(page.getByTestId("results-heading")).toHaveCount(0);
    }

    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled();
  });

  test("a reload after the window shows the groups without the progress bar", async () => {
    for (const page of [alicePage, presenterPage]) {
      await page.reload();
      await expect(page.getByTestId("phase")).toHaveText("Phase 5", {
        timeout: 15_000,
      });
      await expect(page.getByTestId("formation-progress")).toHaveCount(0, {
        timeout: 1_000,
      });
    }
    await expect(alicePage.getByTestId("own-group-card")).toBeVisible({
      timeout: 1_000,
    });
    await expect(presenterPage.getByTestId("group-card-otter")).toBeVisible({
      timeout: 1_000,
    });
  });

  test("advancing to phase 6 shows the group work screen on every role", async () => {
    await advancePhaseButton(facilitatorPage).click();

    for (const page of everyRolePage()) {
      await expect(page.getByTestId("phase")).toHaveText("Phase 6", {
        timeout: 15_000,
      });
    }

    await expect(
      facilitatorPage.getByTestId("facilitator-group-work-screen"),
    ).toBeVisible();
    await expect(
      facilitatorPage.getByTestId("group-work-table"),
    ).toBeVisible();
    await expect(
      facilitatorPage.getByTestId("group-status-otter"),
    ).toHaveTextContent("Editing");
  });

  test("the scribe sees the group work card with editable actions", async () => {
    const scribePage = await findScribePage();

    await expect(scribePage.getByTestId("group-work-card")).toBeVisible();
    await expect(scribePage.getByTestId("group-work-name")).toHaveText("Otter");
    await expect(scribePage.getByTestId("add-action-button")).toBeVisible();
    await expect(
      scribePage.getByTestId("submit-group-work-button"),
    ).toBeDisabled();
  });

  test("the scribe adds actions for each value and the member sees them", async () => {
    const scribePage = await findScribePage();
    const memberPage = await findMemberPage();

    const valueIds = await getAssignedValueIds(scribePage);
    for (const valueId of valueIds) {
      await scribePage.getByTestId(`value-tab-${valueId}`).click();
      await scribePage.getByTestId("add-action-button").click();
      await expect(scribePage.getByTestId(/^action-input-/)).toBeVisible({
        timeout: 5_000,
      });
      const input = scribePage.getByTestId(/^action-input-/).first();
      await input.fill(`Action for ${valueId}`);
    }

    await expect(
      scribePage.getByTestId("submit-group-work-button"),
    ).toBeEnabled({ timeout: 5_000 });

    for (const valueId of valueIds) {
      await memberPage.getByTestId(`value-tab-${valueId}`).click();
      await expect(
        memberPage.getByTestId(/^action-text-/).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("the scribe submits the group work", async () => {
    const scribePage = await findScribePage();

    await scribePage.getByTestId("submit-group-work-button").click();

    await expect(scribePage.getByTestId("reopen-button")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      scribePage.getByTestId("group-work-status"),
    ).toHaveTextContent("Submitted");

    await expect(
      facilitatorPage.getByTestId("group-status-otter"),
    ).toHaveTextContent("Submitted", { timeout: 5_000 });
  });

  test("the facilitator can advance after all groups are submitted", async () => {
    await expect(advancePhaseButton(facilitatorPage)).toBeEnabled({
      timeout: 5_000,
    });
  });

  async function findScribePage(): Promise<Page> {
    for (const page of participantPages()) {
      const addButton = page.getByTestId("add-action-button");
      if ((await addButton.count()) > 0) {
        return page;
      }
    }
    throw new Error("No scribe page found among participants");
  }

  async function findMemberPage(): Promise<Page> {
    for (const page of participantPages()) {
      const addButton = page.getByTestId("add-action-button");
      if ((await addButton.count()) === 0) {
        const card = page.getByTestId("group-work-card");
        if ((await card.count()) > 0) {
          return page;
        }
      }
    }
    throw new Error("No member page found among participants");
  }

  async function getAssignedValueIds(page: Page): Promise<string[]> {
    const tabs = page.locator('[data-testid^="value-tab-"]');
    const count = await tabs.count();
    const ids: string[] = [];
    for (let index = 0; index < count; index++) {
      const testId = await tabs.nth(index).getAttribute("data-testid");
      if (testId !== null) {
        ids.push(testId.replace("value-tab-", ""));
      }
    }
    return ids;
  }
});
