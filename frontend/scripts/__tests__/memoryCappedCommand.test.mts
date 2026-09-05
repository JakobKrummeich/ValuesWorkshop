import {
  memoryCappedCommandOf,
  mutationMemoryLimits,
} from "../quality/mutation/memoryCappedCommand.mts";

const specification = {
  command: "npx",
  args: ["stryker", "run"],
  cwd: "/repository/frontend",
};

describe("memoryCappedCommandOf", () => {
  it("runs a mutation tool inside a memory-capped scope that dies before the machine does", () => {
    expect(
      memoryCappedCommandOf(specification, mutationMemoryLimits, {
        transientScope: true,
        outOfMemoryScoreSetter: true,
      }),
    ).toEqual({
      command: "systemd-run",
      args: [
        "--user",
        "--scope",
        "--quiet",
        "--collect",
        "--property",
        "MemoryMax=8G",
        "--property",
        "MemorySwapMax=2G",
        "--",
        "choom",
        "-n",
        "900",
        "--",
        "npx",
        "stryker",
        "run",
      ],
      cwd: "/repository/frontend",
    });
  });

  it("still marks the run as the first thing to kill when only the score setter exists", () => {
    const capped = memoryCappedCommandOf(specification, mutationMemoryLimits, {
      transientScope: false,
      outOfMemoryScoreSetter: true,
    });

    expect(capped.command).toBe("choom");
    expect(capped.args).toEqual(["-n", "900", "--", "npx", "stryker", "run"]);
  });

  it("runs the tool unchanged where neither launcher exists", () => {
    expect(
      memoryCappedCommandOf(specification, mutationMemoryLimits, {
        transientScope: false,
        outOfMemoryScoreSetter: false,
      }),
    ).toBe(specification);
  });

  it("keeps the working directory and the environment of the wrapped command", () => {
    const capped = memoryCappedCommandOf(
      { ...specification, environment: { NODE_ENV: "test" } },
      mutationMemoryLimits,
      { transientScope: true, outOfMemoryScoreSetter: false },
    );

    expect(capped.cwd).toBe("/repository/frontend");
    expect(capped.environment).toEqual({ NODE_ENV: "test" });
  });
});
