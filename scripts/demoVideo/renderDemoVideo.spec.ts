import { type BrowserContext, expect, type Page, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  LAPTOP_VIEWPORT,
  PHONE_VIEWPORT,
  WALL_VIEWPORT,
} from "../../e2e/support/viewports";
import {
  driveDemoWorkshop,
  openDemoSession,
  openDemoWall,
} from "../demoWorkshop/driveDemoWorkshop";
import { composeFilmFrames } from "./composeFilmFrames";
import {
  describeVideo,
  encodeGif,
  encodeMp4,
  extractRecordedFrames,
  publishToMediaDirectory,
} from "./encodeFilm";
import {
  emptyWorkspace,
  FILM_DIRECTORY,
  FRAMES_DIRECTORY,
  FRAMES_PER_SECOND,
  GIF_BYTE_BUDGET,
  RECORDINGS_DIRECTORY,
} from "./filmWorkspace";
import { planFilmFrames, planGifFrameNumbers } from "./planFilmFrames";
import {
  FILM_DEVICES,
  type FilmDevice,
  readSceneTimeline,
  SceneTimelineRecorder,
  writeSceneTimeline,
} from "./sceneTimeline";
import { filmSeconds, holdMillisecondsFor } from "./storyboard";

const VIEWPORT_BY_DEVICE: Record<
  FilmDevice,
  { width: number; height: number }
> = {
  wall: WALL_VIEWPORT,
  phone: PHONE_VIEWPORT,
  laptop: LAPTOP_VIEWPORT,
};

const LOST_RECORDING_TOLERANCE_SECONDS = 5;

function extractedFrameCount(device: FilmDevice): number {
  return readdirSync(resolve(FRAMES_DIRECTORY, device)).length;
}

function frameCountByDevice(): Record<FilmDevice, number> {
  return {
    wall: extractedFrameCount("wall"),
    phone: extractedFrameCount("phone"),
    laptop: extractedFrameCount("laptop"),
  };
}

test.describe.serial("render the demo film", () => {
  test("records an eight-person workshop on the wall, a phone and the laptop", async ({
    browser,
  }) => {
    test.setTimeout(1_800_000);
    emptyWorkspace();

    const recorder = new SceneTimelineRecorder(holdMillisecondsFor);
    const contextByDevice = new Map<FilmDevice, BrowserContext>();
    const pageByDevice = new Map<FilmDevice, Page>();
    for (const device of FILM_DEVICES) {
      const viewport = VIEWPORT_BY_DEVICE[device];
      const context = await browser.newContext({
        viewport,
        recordVideo: {
          dir: resolve(RECORDINGS_DIRECTORY, device),
          size: viewport,
        },
      });
      contextByDevice.set(device, context);
      pageByDevice.set(device, await context.newPage());
      recorder.recordingStarted(device);
    }

    const facilitatorPage = pageByDevice.get("laptop") as Page;
    const presenterPage = pageByDevice.get("wall") as Page;
    const capturedParticipantPage = pageByDevice.get("phone") as Page;

    try {
      const sessionIdentity = await openDemoSession(facilitatorPage);
      await openDemoWall(presenterPage, sessionIdentity);
      await driveDemoWorkshop({
        browser,
        facilitatorPage,
        presenterPage,
        capturedParticipantPage,
        sessionIdentity,
        atMoment: (moment) => recorder.holdScene(moment),
      });
    } finally {
      for (const device of FILM_DEVICES) {
        const videoFileName = `${device}.webm`;
        recorder.recordingStopped(device, videoFileName);
        const video = (pageByDevice.get(device) as Page).video();
        await (contextByDevice.get(device) as BrowserContext).close();
        await video?.saveAs(resolve(RECORDINGS_DIRECTORY, videoFileName));
      }
      writeSceneTimeline(recorder.timeline());
    }
  });

  test("extracts thirty frames a second from every recording", async () => {
    test.setTimeout(1_800_000);
    const timeline = readSceneTimeline();

    for (const device of FILM_DEVICES) {
      const recording = timeline.devices[device];
      extractRecordedFrames(
        resolve(RECORDINGS_DIRECTORY, recording.videoFileName),
        resolve(FRAMES_DIRECTORY, device),
      );

      const extractedSeconds = extractedFrameCount(device) / FRAMES_PER_SECOND;
      const recordedSeconds = recording.spanMilliseconds / 1000;
      console.log(
        `${device}: extracted ${extractedSeconds.toFixed(1)}s of ${recordedSeconds.toFixed(1)}s recorded`,
      );
      expect(
        extractedSeconds,
        `the ${device} recording is far shorter than the session it covers`,
      ).toBeGreaterThan(recordedSeconds - LOST_RECORDING_TOLERANCE_SECONDS);
    }
  });

  test("composes the film frames on the stage", async ({ browser }) => {
    test.setTimeout(3_600_000);
    const frames = planFilmFrames(readSceneTimeline(), frameCountByDevice());
    expect(frames).toHaveLength(filmSeconds() * FRAMES_PER_SECOND);

    await composeFilmFrames(browser, frames);
    expect(readdirSync(FILM_DIRECTORY)).toHaveLength(frames.length);
  });

  test("encodes the mp4 and the README gif", async () => {
    test.setTimeout(1_800_000);

    const mp4File = encodeMp4();
    console.log(describeVideo(mp4File));

    const gifFile = encodeGif(planGifFrameNumbers());
    console.log(describeVideo(gifFile));
    expect(
      statSync(gifFile).size,
      "the README gif outgrew its budget",
    ).toBeLessThanOrEqual(GIF_BYTE_BUDGET);

    console.log(`published ${publishToMediaDirectory(mp4File)}`);
    console.log(`published ${publishToMediaDirectory(gifFile)}`);
  });
});
