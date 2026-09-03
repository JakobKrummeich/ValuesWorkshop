import {
  FRAMES_PER_SECOND,
  frameFileName,
  GIF_FRAMES_PER_SECOND,
} from "./filmWorkspace";
import type {
  DeviceRecording,
  FilmDevice,
  SceneTimeline,
  SceneWindow,
} from "./sceneTimeline";
import { filmSeconds, type StageLayout, STORYBOARD } from "./storyboard";

export type StageFrame = {
  layout: StageLayout;
  eyebrow: string;
  caption: string;
  frameUrlsByDevice: Partial<Record<FilmDevice, string>>;
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

// Beats cut, they do not cross-fade: fading a panel in from nothing would
// leave the first frames of every beat empty.
const CAPTION_ENTER_DELAY_MILLISECONDS = 120;
const CAPTION_ENTER_MILLISECONDS = 380;

// A scene window opens the instant the drive finished its click, so its first
// frames catch the product's own enter and reveal animations half-played. The
// cut starts a beat later, which the hold margin around every window pays for.
const SCENE_LEAD_IN_MILLISECONDS = 500;

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
        captionEnter: captionEnterAt(beatFrameIndex),
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
          frameUrlsOf(
            window,
            devices,
            elapsedMilliseconds,
            timeline,
            frameCountByDevice,
          ),
        );
      }
    }
  }

  return frames;
}

export function planGifFrameNumbers(): number[] {
  const filmFrameCount = filmSeconds() * FRAMES_PER_SECOND;
  const gifFrameCount = Math.round(filmSeconds() * GIF_FRAMES_PER_SECOND);

  return Array.from({ length: gifFrameCount }, (_, gifFrame) =>
    Math.min(
      Math.round((gifFrame * FRAMES_PER_SECOND) / GIF_FRAMES_PER_SECOND) + 1,
      filmFrameCount,
    ),
  );
}

function captionEnterAt(beatFrameIndex: number): number {
  const elapsedMilliseconds = (beatFrameIndex / FRAMES_PER_SECOND) * 1000;
  return easeOut(
    (elapsedMilliseconds - CAPTION_ENTER_DELAY_MILLISECONDS) /
      CAPTION_ENTER_MILLISECONDS,
  );
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
  timeline: SceneTimeline,
  frameCountByDevice: Record<FilmDevice, number>,
): Partial<Record<FilmDevice, string>> {
  const frameUrlsByDevice: Partial<Record<FilmDevice, string>> = {};

  for (const device of devices) {
    const span = window.devices[device];
    const offsetMilliseconds = Math.min(
      span.startMilliseconds + SCENE_LEAD_IN_MILLISECONDS + elapsedMilliseconds,
      span.endMilliseconds,
    );
    const frameNumber = frameNumberAt(
      offsetMilliseconds,
      timeline.devices[device],
      frameCountByDevice[device],
    );
    frameUrlsByDevice[device] =
      `/frames/${device}/${frameFileName(frameNumber)}`;
  }

  return frameUrlsByDevice;
}

// The browser's recorder drops frames when a busy machine cannot keep up, so a
// recording can hold slightly fewer frames than the wall-clock span it covers.
// Reading a moment by proportion instead of by a constant 30 frames a second
// keeps the cut on the intended screen even when that happens.
function frameNumberAt(
  offsetMilliseconds: number,
  recording: DeviceRecording,
  frameCount: number,
): number {
  const proportion = offsetMilliseconds / recording.spanMilliseconds;
  const frameNumber = Math.round(proportion * (frameCount - 1)) + 1;
  return Math.min(Math.max(frameNumber, 1), frameCount);
}
