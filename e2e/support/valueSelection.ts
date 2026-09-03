import { expect, type Page } from "@playwright/test";

export const VALUES_PER_SELECTION = 10;

export async function pickValues(
  page: Page,
  firstChipIndex = 0,
): Promise<void> {
  const valueChips = page.getByTestId(/^value-chip-/);
  await expect(valueChips.first()).toBeVisible({ timeout: 15_000 });
  for (let pick = 0; pick < VALUES_PER_SELECTION; pick += 1) {
    await valueChips.nth(firstChipIndex + pick).click();
  }
  await expect(page.getByTestId("selected-count")).toHaveText(
    `Selected: ${VALUES_PER_SELECTION}/${VALUES_PER_SELECTION}`,
  );
}

export async function confirmValueSelection(page: Page): Promise<void> {
  await page.getByTestId("submit-selection-button").click();
  await page.getByTestId("confirm-submit-button").click();
  await expect(
    page.getByTestId("selection-submitted-confirmation"),
  ).toBeVisible();
}

export async function submitValueSelection(
  page: Page,
  firstChipIndex = 0,
): Promise<void> {
  await pickValues(page, firstChipIndex);
  await confirmValueSelection(page);
}
