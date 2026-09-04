import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type WorkshopScreens = {
  laptop: Page;
  phone: Page;
  wall: Page;
};

const BLOCKING_IMPACTS = ["serious", "critical"];

const STANDARDS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectAccessibleScreen(
  page: Page,
  screenName: string,
): Promise<void> {
  const scan = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  const blocking = scan.violations
    .filter((violation) => BLOCKING_IMPACTS.includes(violation.impact ?? ""))
    .map(
      (violation) =>
        `${violation.impact}: ${violation.id} — ${violation.help} on ${violation.nodes
          .map((node) => node.target.join(" "))
          .join(", ")}`,
    );

  expect(blocking, `accessibility of the ${screenName}`).toEqual([]);
}

export async function expectAccessibleWorkshop(
  screens: WorkshopScreens,
  phaseName: string,
): Promise<void> {
  for (const [role, page] of Object.entries(screens)) {
    await expectAccessibleScreen(page, `${role} in ${phaseName}`);
  }
}
