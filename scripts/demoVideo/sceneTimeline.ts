import { readFileSync, writeFileSync } from "node:fs";
import type { DemoMoment } from "../demoWorkshop/driveDemoWorkshop";
import { TIMELINE_FILE } from "./filmWorkspace";

export type FilmDevice = "wall" | "phone" | "laptop";

export const FILM_DEVICES: readonly FilmDevice[] = ["wall", "phone", "laptop"];

export type SceneSpan = {
  startMilliseconds: number;
  endMilliseconds: number;
};

export type SceneWindow = {
  name: DemoMoment;
  devices: Record<FilmDevice, SceneSpan>;
};

export type DeviceRecording = {
  videoFileName: string;
  spanMilliseconds: number;
};

export type SceneTimeline = {
  devices: Record<FilmDevice, DeviceRecording>;
  scenes: readonly SceneWindow[];
};

export class SceneTimelineRecorder {
  private readonly recordingStartedAt = new Map<FilmDevice, number>();
  private readonly recordings = new Map<FilmDevice, DeviceRecording>();
  private readonly scenes: SceneWindow[] = [];
  private readonly heldSceneCounts = new Map<DemoMoment, number>();

  constructor(
    private readonly holdMillisecondsOf: (
      moment: DemoMoment,
      occurrence: number,
    ) => number,
  ) {}

  recordingStarted(device: FilmDevice): void {
    this.recordingStartedAt.set(device, performance.now());
  }

  recordingStopped(device: FilmDevice, videoFileName: string): void {
    this.recordings.set(device, {
      videoFileName,
      spanMilliseconds: performance.now() - this.startOf(device),
    });
  }

  async holdScene(moment: DemoMoment): Promise<void> {
    const occurrence = this.heldSceneCounts.get(moment) ?? 0;
    this.heldSceneCounts.set(moment, occurrence + 1);

    const startedAt = performance.now();
    await new Promise((wake) =>
      setTimeout(wake, this.holdMillisecondsOf(moment, occurrence)),
    );
    this.scenes.push({
      name: moment,
      devices: this.spansOf(startedAt, performance.now()),
    });
  }

  timeline(): SceneTimeline {
    return {
      devices: byDevice((device) => {
        const recording = this.recordings.get(device);
        if (recording === undefined) {
          throw new Error(`The ${device} recording was never stopped`);
        }
        return recording;
      }),
      scenes: this.scenes,
    };
  }

  private startOf(device: FilmDevice): number {
    const startedAt = this.recordingStartedAt.get(device);
    if (startedAt === undefined) {
      throw new Error(`The ${device} recording was never started`);
    }
    return startedAt;
  }

  private spansOf(
    startedAt: number,
    endedAt: number,
  ): Record<FilmDevice, SceneSpan> {
    return byDevice((device) => ({
      startMilliseconds: startedAt - this.startOf(device),
      endMilliseconds: endedAt - this.startOf(device),
    }));
  }
}

function byDevice<Value>(
  valueOf: (device: FilmDevice) => Value,
): Record<FilmDevice, Value> {
  return {
    wall: valueOf("wall"),
    phone: valueOf("phone"),
    laptop: valueOf("laptop"),
  };
}

export function writeSceneTimeline(timeline: SceneTimeline): void {
  writeFileSync(TIMELINE_FILE, `${JSON.stringify(timeline, null, 2)}\n`);
}

export function readSceneTimeline(): SceneTimeline {
  return JSON.parse(readFileSync(TIMELINE_FILE, "utf8")) as SceneTimeline;
}
