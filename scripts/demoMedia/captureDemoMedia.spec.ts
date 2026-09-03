import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { resolve } from "node:path";
import {
  LAPTOP_VIEWPORT,
  PHONE_VIEWPORT,
  WALL_VIEWPORT,
} from "../../e2e/support/viewports";
import {
  type DemoMoment,
  driveDemoWorkshop,
  openDemoSession,
  openDemoWall,
} from "../demoWorkshop/driveDemoWorkshop";

const MEDIA_DIRECTORY = resolve(__dirname, "../../docs/media");
const SETTLED_TIMEOUT_MILLISECONDS = 10_000;

test("capture the README screenshots", async ({ browser }) => {
  test.setTimeout(900_000);

  const contexts: BrowserContext[] = [];
  const openPage = async (viewport: {
    width: number;
    height: number;
  }): Promise<Page> => {
    const context = await browser.newContext({ viewport });
    contexts.push(context);
    return context.newPage();
  };

  try {
    const facilitatorPage = await openPage(LAPTOP_VIEWPORT);
    const presenterPage = await openPage(WALL_VIEWPORT);
    const capturedParticipantPage = await openPage(PHONE_VIEWPORT);

    const sessionIdentity = await openDemoSession(facilitatorPage);
    await openDemoWall(presenterPage, sessionIdentity);

    const capture = (page: Page, fileName: string) =>
      page.screenshot({ path: resolve(MEDIA_DIRECTORY, fileName) });

    const screenshotsByMoment: Partial<
      Record<DemoMoment, () => Promise<unknown>>
    > = {
      actionsWritten: () =>
        capture(facilitatorPage, "facilitator-group-work.png"),
      votesInFlight: () =>
        capture(capturedParticipantPage, "participant-final-voting.png"),
      winnersRevealed: async () => {
        await expect(presenterPage.getByTestId("winner-actions")).toHaveCSS(
          "opacity",
          "1",
          { timeout: SETTLED_TIMEOUT_MILLISECONDS },
        );
        await capture(presenterPage, "presenter-final-presentation.png");
      },
    };

    await driveDemoWorkshop({
      browser,
      facilitatorPage,
      presenterPage,
      capturedParticipantPage,
      sessionIdentity,
      atMoment: async (moment) => {
        await screenshotsByMoment[moment]?.();
      },
    });
  } finally {
    for (const context of contexts) {
      await context.close();
    }
  }
});
