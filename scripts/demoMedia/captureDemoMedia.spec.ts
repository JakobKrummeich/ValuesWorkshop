import {
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";
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

    const restingAt = (locator: Locator, property: string, resting: string) =>
      expect(locator).toHaveCSS(property, resting, {
        timeout: SETTLED_TIMEOUT_MILLISECONDS,
      });

    const screenshotsByMoment: Partial<
      Record<DemoMoment, () => Promise<unknown>>
    > = {
      actionsWritten: () =>
        capture(facilitatorPage, "facilitator-group-work.png"),
      votesInFlight: async () => {
        await restingAt(
          capturedParticipantPage
            .getByTestId("vote-pips")
            .locator("[data-filled='true']")
            .last(),
          "transform",
          "none",
        );
        await capturedParticipantPage.getByRole("main").evaluate((content) => {
          content.scrollTop = 0;
        });
        await capture(capturedParticipantPage, "participant-final-voting.png");
      },
      winnersRevealed: async () => {
        await restingAt(
          presenterPage.getByTestId("winner-value"),
          "opacity",
          "1",
        );
        await restingAt(
          presenterPage.getByTestId("winner-action").last(),
          "opacity",
          "1",
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
