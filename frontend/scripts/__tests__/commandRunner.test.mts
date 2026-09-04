import {
  commandLineOf,
  redactTemporaryPaths,
  runCommand,
  runCommandExpecting,
  runCommandStreamingOutput,
} from "../quality/commandRunner.mts";

const here = { cwd: process.cwd() };

describe("commandLineOf", () => {
  it("quotes only the arguments that need it", () => {
    expect(
      commandLineOf("npx", ["eslint", "--rule", '{"complexity":["error",0]}']),
    ).toBe('npx eslint --rule "{\\"complexity\\":[\\"error\\",0]}"');
  });
});

describe("runCommand", () => {
  it("hands back what the command printed", () => {
    const result = runCommand({
      command: "node",
      args: ["-e", "process.stdout.write('measured')"],
      ...here,
    });
    expect(result).toMatchObject({ exitCode: 0, stdout: "measured" });
  });

  it("fails loudly when the command it depends on fails", () => {
    expect(() =>
      runCommand({
        command: "node",
        args: ["-e", "console.error('tool broke'); process.exit(3)"],
        ...here,
      }),
    ).toThrow(/which exited with 3[\s\S]*tool broke/);
  });

  it("fails loudly when the command cannot be started at all", () => {
    expect(() =>
      runCommand({ command: "no-such-tool-here", args: [], ...here }),
    ).toThrow("could not start `no-such-tool-here`");
  });

  it("accepts an exit code that the tool uses to report findings", () => {
    expect(
      runCommandExpecting(
        { command: "node", args: ["-e", "process.exit(1)"], ...here },
        [0, 1],
      ).exitCode,
    ).toBe(1);
  });
});

describe("runCommandStreamingOutput", () => {
  it("lets a command that succeeds print for itself", () => {
    expect(() =>
      runCommandStreamingOutput({
        command: "node",
        args: ["-e", "process.stdout.write('progress')"],
        ...here,
      }),
    ).not.toThrow();
  });

  it("fails loudly when the command fails", () => {
    expect(() =>
      runCommandStreamingOutput({
        command: "node",
        args: ["-e", "process.exit(3)"],
        ...here,
      }),
    ).toThrow("exited with 3; it printed the reason above");
  });

  it("fails loudly when the command cannot be started at all", () => {
    expect(() =>
      runCommandStreamingOutput({
        command: "no-such-tool-here",
        args: [],
        ...here,
      }),
    ).toThrow("could not be started");
  });
});

describe("redactTemporaryPaths", () => {
  it("keeps a run-to-run temporary directory out of the recorded command", () => {
    expect(
      redactTemporaryPaths(
        "pnpm test --outputFile=/tmp/quality-report-a1b2/jest-report.json",
        "/tmp/quality-report-a1b2",
      ),
    ).toBe("pnpm test --outputFile=<tmp>/jest-report.json");
  });
});
