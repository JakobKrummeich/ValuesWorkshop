import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export const FRAMES_PER_SECOND = 30;
export const GIF_FRAMES_PER_SECOND = 12;
export const GIF_WIDTH_PIXELS = 800;
export const GIF_BYTE_BUDGET = 12 * 1024 * 1024;

const REPOSITORY_DIRECTORY = resolve(__dirname, "../..");

export const STAGE_DIRECTORY = resolve(__dirname, "stage");
export const PRODUCT_ASSET_DIRECTORY = resolve(
  REPOSITORY_DIRECTORY,
  "frontend/src/app",
);
export const MEDIA_DIRECTORY = resolve(REPOSITORY_DIRECTORY, "docs/media");

export const WORKSPACE_DIRECTORY = "/tmp/valuesWorkshopDemoVideo";
export const RECORDINGS_DIRECTORY = resolve(WORKSPACE_DIRECTORY, "recordings");
export const FRAMES_DIRECTORY = resolve(WORKSPACE_DIRECTORY, "frames");
export const FILM_DIRECTORY = resolve(WORKSPACE_DIRECTORY, "film");
export const GIF_FRAMES_DIRECTORY = resolve(WORKSPACE_DIRECTORY, "gifFrames");
export const OUTPUT_DIRECTORY = resolve(WORKSPACE_DIRECTORY, "output");
export const TIMELINE_FILE = resolve(WORKSPACE_DIRECTORY, "timeline.json");

export function emptyWorkspace(): void {
  rmSync(WORKSPACE_DIRECTORY, { recursive: true, force: true });
  for (const directory of [
    RECORDINGS_DIRECTORY,
    FRAMES_DIRECTORY,
    FILM_DIRECTORY,
    GIF_FRAMES_DIRECTORY,
    OUTPUT_DIRECTORY,
  ]) {
    mkdirSync(directory, { recursive: true });
  }
}

export function frameFileName(frameNumber: number): string {
  return `${String(frameNumber).padStart(5, "0")}.jpg`;
}
