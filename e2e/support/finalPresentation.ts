import type { Locator, Page } from "@playwright/test";

export function revealNextValueButton(facilitatorPage: Page): Locator {
  return facilitatorPage.getByRole("button", { name: "Reveal next value" });
}
