import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

type Violation = Awaited<
  ReturnType<AxeBuilder["analyze"]>
>["violations"][number];

export type WorkshopScreens = {
  laptop: Page;
  phone: Page;
  wall: Page;
};

const BLOCKING_IMPACTS = ["serious", "critical"];

const STANDARDS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const SETTLE_LIMIT_MILLISECONDS = 3_000;

async function settleEntranceAnimations(page: Page): Promise<void> {
  await page.evaluate(async (settleLimit) => {
    const finite = document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY,
      )
      .map((animation) => animation.finished.catch(() => undefined));
    await Promise.race([
      Promise.all(finite),
      new Promise((settle) => setTimeout(settle, settleLimit)),
    ]);
  }, SETTLE_LIMIT_MILLISECONDS);
}

function describeViolation(violation: Violation): string {
  const nodes = violation.nodes.map((node) => {
    const findings = node.any
      .concat(node.all)
      .map((check) => check.message)
      .join("; ");
    return `${node.target.join(" ")} (${findings})`;
  });
  return `${violation.impact}: ${violation.id} — ${violation.help} on ${nodes.join(", ")}`;
}

export async function expectAccessibleScreen(
  page: Page,
  screenName: string,
): Promise<void> {
  await settleEntranceAnimations(page);
  const scan = await new AxeBuilder({ page }).withTags(STANDARDS).analyze();
  const blocking = scan.violations
    .filter((violation) => BLOCKING_IMPACTS.includes(violation.impact ?? ""))
    .map(describeViolation);

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
