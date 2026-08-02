import type { Page } from "@playwright/test";

const MARKER_PROPERTY = "valuesWorkshopPageMarker";

export async function markPage(page: Page): Promise<void> {
  await page.evaluate((property) => {
    (window as unknown as Record<string, boolean>)[property] = true;
  }, MARKER_PROPERTY);
}

export async function isPageStillMarked(page: Page): Promise<boolean> {
  return page.evaluate(
    (property) =>
      (window as unknown as Record<string, boolean>)[property] === true,
    MARKER_PROPERTY,
  );
}
