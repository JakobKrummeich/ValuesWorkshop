import { copyFileSync, linkSync, mkdirSync, rmSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { containerPath, probeVideo, runFfmpeg } from "./dockerFfmpeg";
import {
  FILM_DIRECTORY,
  frameFileName,
  FRAMES_PER_SECOND,
  GIF_FRAMES_DIRECTORY,
  GIF_FRAMES_PER_SECOND,
  GIF_WIDTH_PIXELS,
  MEDIA_DIRECTORY,
  OUTPUT_DIRECTORY,
} from "./filmWorkspace";

const MP4_FILE_NAME = "demo.mp4";
const GIF_FILE_NAME = "demo.gif";
const PALETTE_FILE_NAME = "palette.png";

export function extractRecordedFrames(
  videoFile: string,
  frameDirectory: string,
): void {
  mkdirSync(frameDirectory, { recursive: true });
  runFfmpeg([
    "-y",
    "-i",
    containerPath(videoFile),
    "-vf",
    `fps=${FRAMES_PER_SECOND}`,
    "-q:v",
    "3",
    `${containerPath(frameDirectory)}/%05d.jpg`,
  ]);
}

export function encodeMp4(): string {
  const mp4File = resolve(OUTPUT_DIRECTORY, MP4_FILE_NAME);
  runFfmpeg([
    "-y",
    "-framerate",
    `${FRAMES_PER_SECOND}`,
    "-i",
    `${containerPath(FILM_DIRECTORY)}/%05d.jpg`,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    containerPath(mp4File),
  ]);
  return mp4File;
}

export function encodeGif(gifFrameNumbers: readonly number[]): string {
  rmSync(GIF_FRAMES_DIRECTORY, { recursive: true, force: true });
  mkdirSync(GIF_FRAMES_DIRECTORY, { recursive: true });
  for (const [index, frameNumber] of gifFrameNumbers.entries()) {
    linkSync(
      resolve(FILM_DIRECTORY, frameFileName(frameNumber)),
      resolve(GIF_FRAMES_DIRECTORY, frameFileName(index + 1)),
    );
  }

  const paletteFile = resolve(OUTPUT_DIRECTORY, PALETTE_FILE_NAME);
  const gifFile = resolve(OUTPUT_DIRECTORY, GIF_FILE_NAME);
  const scale = `scale=${GIF_WIDTH_PIXELS}:-2:flags=lanczos`;
  const gifFrames = `${containerPath(GIF_FRAMES_DIRECTORY)}/%05d.jpg`;

  runFfmpeg([
    "-y",
    "-framerate",
    `${GIF_FRAMES_PER_SECOND}`,
    "-i",
    gifFrames,
    "-vf",
    `${scale},palettegen=stats_mode=diff:max_colors=128`,
    containerPath(paletteFile),
  ]);
  runFfmpeg([
    "-y",
    "-framerate",
    `${GIF_FRAMES_PER_SECOND}`,
    "-i",
    gifFrames,
    "-i",
    containerPath(paletteFile),
    "-lavfi",
    `${scale} [scaled]; [scaled][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    "-loop",
    "0",
    containerPath(gifFile),
  ]);
  return gifFile;
}

export function publishToMediaDirectory(sourceFile: string): string {
  const publishedFile = resolve(MEDIA_DIRECTORY, basename(sourceFile));
  copyFileSync(sourceFile, publishedFile);
  return publishedFile;
}

export function describeVideo(videoFile: string): string {
  const [width, height] = probeVideo(videoFile, "stream=width,height");
  const [duration] = probeVideo(videoFile, "format=duration");
  const megabytes = statSync(videoFile).size / 1024 / 1024;
  return `${videoFile}: ${width}×${height}, ${Number(duration).toFixed(2)}s, ${megabytes.toFixed(2)} MB`;
}
