import { spawnSync } from "node:child_process";
import { WORKSPACE_DIRECTORY } from "./filmWorkspace";

const FFMPEG_IMAGE = "linuxserver/ffmpeg";
const CONTAINER_WORKSPACE = "/work";
const FFMPEG_BINARY = "/usr/local/bin/ffmpeg";
const FFPROBE_BINARY = "/usr/local/bin/ffprobe";

// The image's own entrypoint is an s6 wrapper that rewrites /etc/passwd before
// it execs ffmpeg, which fails under --user; without --user the container
// writes root-owned files into the workspace that this host cannot delete. So
// both tools are invoked directly, as the calling user.
const RUN_AS_CALLING_USER = `${process.getuid?.() ?? 0}:${process.getgid?.() ?? 0}`;

export function containerPath(hostPath: string): string {
  return hostPath.replace(WORKSPACE_DIRECTORY, CONTAINER_WORKSPACE);
}

export function runFfmpeg(args: readonly string[]): void {
  const finished = spawnSync(
    "docker",
    [
      ...dockerArguments(FFMPEG_BINARY),
      "-hide_banner",
      "-loglevel",
      "warning",
      ...args,
    ],
    { stdio: "inherit" },
  );
  if (finished.error) {
    throw new Error(`ffmpeg failed to start: ${finished.error.message}`);
  }
  if (finished.status !== 0) {
    throw new Error(`ffmpeg failed with status ${finished.status}`);
  }
}

export function probeVideo(hostPath: string, showEntries: string): string[] {
  const finished = spawnSync(
    "docker",
    [
      ...dockerArguments(FFPROBE_BINARY),
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      showEntries,
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      containerPath(hostPath),
    ],
    { encoding: "utf8" },
  );
  if (finished.error) {
    throw new Error(`ffprobe failed to start: ${finished.error.message}`);
  }
  if (finished.status !== 0) {
    throw new Error(`ffprobe failed: ${finished.stderr}`);
  }
  return finished.stdout.trim().split("\n");
}

function dockerArguments(binary: string): string[] {
  return [
    "run",
    "--rm",
    "--user",
    RUN_AS_CALLING_USER,
    "--entrypoint",
    binary,
    "--volume",
    `${WORKSPACE_DIRECTORY}:${CONTAINER_WORKSPACE}`,
    "--workdir",
    CONTAINER_WORKSPACE,
    FFMPEG_IMAGE,
  ];
}
