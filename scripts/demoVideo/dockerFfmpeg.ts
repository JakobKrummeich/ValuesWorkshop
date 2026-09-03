import { spawnSync } from "node:child_process";
import { WORKSPACE_DIRECTORY } from "./filmWorkspace";

const FFMPEG_IMAGE = "linuxserver/ffmpeg";
const CONTAINER_WORKSPACE = "/work";

export function containerPath(hostPath: string): string {
  return hostPath.replace(WORKSPACE_DIRECTORY, CONTAINER_WORKSPACE);
}

export function runFfmpeg(args: readonly string[]): void {
  const finished = spawnSync(
    "docker",
    [...dockerArguments([]), "-hide_banner", "-loglevel", "warning", ...args],
    { stdio: "inherit" },
  );
  if (finished.status !== 0) {
    throw new Error(`ffmpeg failed with status ${finished.status}`);
  }
}

export function probeVideo(hostPath: string, showEntries: string): string[] {
  const finished = spawnSync(
    "docker",
    [
      ...dockerArguments(["--entrypoint", "ffprobe"]),
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
  if (finished.status !== 0) {
    throw new Error(`ffprobe failed: ${finished.stderr}`);
  }
  return finished.stdout.trim().split("\n");
}

function dockerArguments(beforeImage: readonly string[]): string[] {
  return [
    "run",
    "--rm",
    "--user",
    `${process.getuid?.() ?? 0}:${process.getgid?.() ?? 0}`,
    "--volume",
    `${WORKSPACE_DIRECTORY}:${CONTAINER_WORKSPACE}`,
    "--workdir",
    CONTAINER_WORKSPACE,
    ...beforeImage,
    FFMPEG_IMAGE,
  ];
}
