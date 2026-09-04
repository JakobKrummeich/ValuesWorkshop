import {
  auditDependencies,
  classifyAuditRun,
  type AuditRunResult,
} from "../auditDependencies.mts";

const vulnerabilityReport = JSON.stringify({
  advisories: {
    "1234": { module_name: "left-pad", severity: "high" },
  },
  metadata: { vulnerabilities: { high: 1 } },
});

const registryTimeout = [
  "[WARN] POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk error (23).",
  "TimeoutError: The operation was aborted due to timeout",
].join("\n");

const registryTimeoutReport = JSON.stringify({
  error: { code: 23, message: "The operation was aborted due to timeout" },
});

function run(overrides: Partial<AuditRunResult> = {}): AuditRunResult {
  return { exitCode: 0, stdout: "", stderr: "", ...overrides };
}

describe("classifyAuditRun", () => {
  it("reports a clean audit when the command succeeds", () => {
    expect(classifyAuditRun(run({ stdout: "{}" }))).toEqual({ kind: "clean" });
  });

  it("reports vulnerabilities when the command fails with an advisory report", () => {
    expect(
      classifyAuditRun(run({ exitCode: 1, stdout: vulnerabilityReport })),
    ).toEqual({ kind: "vulnerabilities", report: vulnerabilityReport });
  });

  it("reports an unreachable registry when the command fails without a report", () => {
    expect(
      classifyAuditRun(run({ exitCode: 1, stderr: registryTimeout })),
    ).toEqual({ kind: "registryUnreachable", report: registryTimeout });
  });

  it("reports an unreachable registry when the report is a transport error rather than advisories", () => {
    expect(
      classifyAuditRun(run({ exitCode: 1, stdout: registryTimeoutReport })),
    ).toEqual({ kind: "registryUnreachable", report: registryTimeoutReport });
  });
});

describe("auditDependencies", () => {
  const noWait = jest.fn(async () => {});

  beforeEach(() => {
    noWait.mockClear();
  });

  it("passes on a clean audit without retrying", async () => {
    const runAudit = jest.fn(async () => run({ stdout: "{}" }));

    await expect(
      auditDependencies({ runAudit, attempts: 3, wait: noWait }),
    ).resolves.toEqual({
      exitCode: 0,
      report: "No known vulnerabilities of high severity or above",
    });
    expect(runAudit).toHaveBeenCalledTimes(1);
  });

  it("fails on vulnerabilities without retrying", async () => {
    const runAudit = jest.fn(async () =>
      run({ exitCode: 1, stdout: vulnerabilityReport }),
    );

    const outcome = await auditDependencies({
      runAudit,
      attempts: 3,
      wait: noWait,
    });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toContain(vulnerabilityReport);
    expect(runAudit).toHaveBeenCalledTimes(1);
  });

  it("retries an unreachable registry until the audit answers", async () => {
    const runAudit = jest
      .fn<Promise<AuditRunResult>, []>()
      .mockResolvedValueOnce(run({ exitCode: 1, stderr: registryTimeout }))
      .mockResolvedValueOnce(run({ stdout: "{}" }));

    await expect(
      auditDependencies({ runAudit, attempts: 3, wait: noWait }),
    ).resolves.toMatchObject({ exitCode: 0 });
    expect(runAudit).toHaveBeenCalledTimes(2);
    expect(noWait).toHaveBeenCalledWith(1);
  });

  it("fails when the registry stays unreachable, never passing an unchecked tree", async () => {
    const runAudit = jest.fn(async () =>
      run({ exitCode: 1, stderr: registryTimeout }),
    );

    const outcome = await auditDependencies({
      runAudit,
      attempts: 3,
      wait: noWait,
    });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toContain("unreachable");
    expect(outcome.report).toContain(registryTimeout);
    expect(runAudit).toHaveBeenCalledTimes(3);
    expect(noWait).toHaveBeenNthCalledWith(2, 2);
  });
});
