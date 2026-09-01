import { expect, type Page } from "@playwright/test";

export async function eligibleValueIdsOf(page: Page): Promise<string[]> {
  const voteCards = page.getByTestId(/^vote-card-/);
  await expect(voteCards.first()).toBeVisible({ timeout: 15_000 });
  const testIds = await voteCards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-testid") ?? ""),
  );
  return testIds.map((testId) => testId.replace("vote-card-", ""));
}

export function spreadBallotOf(
  participantIndex: number,
  voteTargetsByCardOrder: readonly number[],
  eligibleValueIds: readonly string[],
  allotment: number,
): Map<string, number> {
  const voteUnits = voteTargetsByCardOrder.flatMap((voteTarget, cardIndex) =>
    Array.from({ length: voteTarget }, () => eligibleValueIds[cardIndex]),
  );
  const ownUnits = voteUnits.slice(
    participantIndex * allotment,
    (participantIndex + 1) * allotment,
  );
  const ballot = new Map<string, number>();
  for (const valueId of ownUnits) {
    ballot.set(valueId, (ballot.get(valueId) ?? 0) + 1);
  }
  return ballot;
}

export async function castBallot(
  page: Page,
  ballot: ReadonlyMap<string, number>,
  allotment: number,
): Promise<void> {
  await expect(page.getByTestId("votes-used")).toHaveText(
    `Your votes: 0/${allotment} used`,
    { timeout: 15_000 },
  );
  for (const [valueId, votes] of ballot) {
    for (let vote = 0; vote < votes; vote += 1) {
      await page.getByTestId(`add-vote-${valueId}`).click();
    }
  }
  await expect(page.getByTestId("votes-used")).toHaveText(
    `Your votes: ${allotment}/${allotment} used`,
  );
  await page.getByTestId("submit-votes-button").click();
  await expect(page.getByTestId("votes-submitted-confirmation")).toBeVisible({
    timeout: 10_000,
  });
}
