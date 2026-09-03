import {
  FRAMES_PER_SECOND,
  frameFileName,
  GIF_FRAMES_PER_SECOND,
} from "./filmWorkspace";
import type { FilmDevice, SceneTimeline, SceneWindow } from "./sceneTimeline";
import { filmSeconds, type StageLayout, STORYBOARD } from "./storyboard";

export type StageFrame = {
  layout: StageLayout;
  eyebrow: string;
  caption: string;
  frameUrlsByDevice: Partial<Record<FilmDevice, string>>;
  panelEnter: number;
  captionEnter: number;
  filmProgress: number;
};

const DEVICES_BY_LAYOUT: Record<StageLayout, readonly FilmDevice[]> = {
  title: [],
  wallHero: ["wall"],
  wallWithPhone: ["wall", "phone"],
  wallWithLaptop: ["wall", "laptop"],
  outro: [],
};

const PANEL_ENTER_MILLISECONDS = 300;
const CAPTION_ENTER_DELAY_MILLISECONDS = 120;
const CAPTION_ENTER_MILLISECONDS = 380;

export function planFilmFrames(
  timeline: SceneTimeline,
  frameCountByDevice: Record<FilmDevice, number>,
): StageFrame[] {
  const frames: StageFrame[] = [];
  const filmFrameCount = filmSeconds() * FRAMES_PER_SECOND;
  const takenWindowCounts = new Map<string, number>();

  for (const beat of STORYBOARD) {
    const devices = DEVICES_BY_LAYOUT[beat.layout];
    let beatFrameIndex = 0;

    const pushFrame = (
      frameUrlsByDevice: Partial<Record<FilmDevice, string>>,
    ) => {
      frames.push({
        layout: beat.layout,
        eyebrow: beat.eyebrow,
        caption: beat.caption,
        frameUrlsByDevice,
        ...enterProgressAt(beatFrameIndex),
        filmProgress: frames.length / (filmFrameCount - 1),
      });
      beatFrameIndex += 1;
    };

    if (devices.length === 0) {
      for (
        let cardFrame = 0;
        cardFrame < beat.seconds * FRAMES_PER_SECOND;
        cardFrame += 1
      ) {
        pushFrame({});
      }
      continue;
    }

    for (const segment of beat.segments) {
      const occurrence = takenWindowCounts.get(segment.scene) ?? 0;
      takenWindowCounts.set(segment.scene, occurrence + 1);
      const window = windowOf(timeline, segment.scene, occurrence);

      for (
        let segmentFrame = 0;
        segmentFrame < segment.seconds * FRAMES_PER_SECOND;
        segmentFrame += 1
      ) {
        const elapsedMilliseconds = (segmentFrame / FRAMES_PER_SECOND) * 1000;
        pushFrame(
          frameUrlsOf(window, devices, elapsedMilliseconds, frameCountByDevice),
        );
      }
    }
  }

  return frames;
}

export function planGifFrameNumbers(): number[] {
  const gifFrameNumbers: number[] = [];
  let beatStart = 0;

  for (const beat of STORYBOARD) {
    const beatFrameCount = beat.seconds * FRAMES_PER_SECOND;
    const gifFrameCount = Math.round(beat.gifSeconds * GIF_FRAMES_PER_SECOND);

    for (let gifFrame = 0; gifFrame < gifFrameCount; gifFrame += 1) {
      const offset = Math.round(
        (gifFrame * FRAMES_PER_SECOND) / GIF_FRAMES_PER_SECOND,
      );
      gifFrameNumbers.push(
        beatStart + Math.min(offset, beatFrameCount - 1) + 1,
      );
    }
    beatStart += beatFrameCount;
  }

  return gifFrameNumbers;
}

function enterProgressAt(beatFrameIndex: number): {
  panelEnter: number;
  captionEnter: number;
} {
  const elapsedMilliseconds = (beatFrameIndex / FRAMES_PER_SECOND) * 1000;
  return {
    panelEnter: easeOut(elapsedMilliseconds / PANEL_ENTER_MILLISECONDS),
    captionEnter: easeOut(
      (elapsedMilliseconds - CAPTION_ENTER_DELAY_MILLISECONDS) /
        CAPTION_ENTER_MILLISECONDS,
    ),
  };
}

function easeOut(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return Number((1 - (1 - clamped) ** 3).toFixed(4));
}

function windowOf(
  timeline: SceneTimeline,
  scene: string,
  occurrence: number,
): SceneWindow {
  const window = timeline.scenes.filter(
    (candidate) => candidate.name === scene,
  )[occurrence];
  if (window === undefined) {
    throw new Error(
      `The recording holds no "${scene}" scene number ${occurrence + 1}`,
    );
  }
  return window;
}

function frameUrlsOf(
  window: SceneWindow,
  devices: readonly FilmDevice[],
  elapsedMilliseconds: number,
  frameCountByDevice: Record<FilmDevice, number>,
): Partial<Record<FilmDevice, string>> {
  const frameUrlsByDevice: Partial<Record<FilmDevice, string>> = {};

  for (const device of devices) {
    const span = window.devices[device];
    const offsetMilliseconds = Math.min(
      span.startMilliseconds + elapsedMilliseconds,
      span.endMilliseconds,
    );
    const frameNumber = Math.min(
      Math.max(
        Math.round((offsetMilliseconds / 1000) * FRAMES_PER_SECOND) + 1,
        1,
      ),
      frameCountByDevice[device],
    );
    frameUrlsByDevice[device] =
      `/frames/${device}/${frameFileName(frameNumber)}`;
  }

  return frameUrlsByDevice;
}
