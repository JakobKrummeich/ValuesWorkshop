import { spawnSync } from "node:child_process";
import type { CommandSpecification } from "../commandRunner.mts";

export interface MemoryLimits {
  memoryMaximum: string;
  swapMaximum: string;
  outOfMemoryScore: number;
}

export interface AvailableLaunchers {
  transientScope: boolean;
  outOfMemoryScoreSetter: boolean;
}

export const mutationMemoryLimits: MemoryLimits = {
  memoryMaximum: "8G",
  swapMaximum: "2G",
  outOfMemoryScore: 900,
};

export function memoryCappedCommandOf(
  specification: CommandSpecification,
  limits: MemoryLimits,
  launchers: AvailableLaunchers,
): CommandSpecification {
  const sacrificial = launchers.outOfMemoryScoreSetter
    ? ["choom", "-n", String(limits.outOfMemoryScore), "--"]
    : [];
  const capped = launchers.transientScope
    ? [
        "systemd-run",
        "--user",
        "--scope",
        "--quiet",
        "--collect",
        "--property",
        `MemoryMax=${limits.memoryMaximum}`,
        "--property",
        `MemorySwapMax=${limits.swapMaximum}`,
        "--",
      ]
    : [];
  const wrapper = [...capped, ...sacrificial];
  if (wrapper.length === 0) {
    return specification;
  }
  const [command, ...args] = [
    ...wrapper,
    specification.command,
    ...specification.args,
  ];
  return { ...specification, command: command as string, args };
}

function launcherWorks(command: string, args: readonly string[]): boolean {
  const finished = spawnSync(command, [...args], { stdio: "ignore" });
  return !finished.error && finished.status === 0;
}

export function availableLaunchersOf(limits: MemoryLimits): AvailableLaunchers {
  return {
    transientScope: launcherWorks("systemd-run", [
      "--user",
      "--scope",
      "--quiet",
      "--collect",
      "--property",
      `MemoryMax=${limits.memoryMaximum}`,
      "--property",
      `MemorySwapMax=${limits.swapMaximum}`,
      "--",
      "true",
    ]),
    outOfMemoryScoreSetter: launcherWorks("choom", [
      "-n",
      String(limits.outOfMemoryScore),
      "--",
      "true",
    ]),
  };
}
