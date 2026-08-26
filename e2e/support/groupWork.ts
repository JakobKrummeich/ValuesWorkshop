import type { Page } from "@playwright/test";

export async function assignedValueIdsOf(page: Page): Promise<string[]> {
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
