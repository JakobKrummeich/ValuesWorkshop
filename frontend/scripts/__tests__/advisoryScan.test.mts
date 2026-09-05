import {
  classifyAdvisoryScanRun,
  noKnownAdvisoriesReport,
  scanForAdvisories,
  type AdvisoryScanRunResult,
} from "../quality/supplyChain/advisoryScan.mts";

const advisoryReport = JSON.stringify({
  results: [
    {
      source: { path: "pnpm-lock.yaml", type: "lockfile" },
      packages: [
        {
          package: { name: "qs", version: "6.15.1", ecosystem: "npm" },
          groups: [{ ids: ["GHSA-4mjr-xmp4-gh2g"] }],
        },
      ],
    },
  ],
});

const databaseRefused = [
  "Scanned pnpm-lock.yaml file and found 1124 packages",
  'Error during extraction: max retries exceeded: Post "https://api.osv.dev/v1/querybatch": connection refused',
].join("\n");

function run(overrides: Partial<AdvisoryScanRunResult> = {}) {
  return { exitCode: 0, stdout: "", stderr: "", ...overrides };
}

describe("classifyAdvisoryScanRun", () => {
  it("reports a clean scan when the scanner succeeds", () => {
    expect(classifyAdvisoryScanRun(run({ stdout: '{"results":[]}' }))).toEqual({
      kind: "clean",
    });
  });

  it("reports advisories when the scanner exits with one", () => {
    expect(
      classifyAdvisoryScanRun(run({ exitCode: 1, stdout: advisoryReport })),
    ).toEqual({ kind: "advisories", report: advisoryReport });
  });

  it("reports an unreachable database when the scanner fails another way", () => {
    expect(
      classifyAdvisoryScanRun(
        run({
          exitCode: 127,
          stdout: '{"results":[]}',
          stderr: databaseRefused,
        }),
      ),
    ).toEqual({ kind: "databaseUnreachable", report: databaseRefused });
  });
});

describe("scanForAdvisories", () => {
  const wait = () => Promise.resolve();

  it("passes when no advisory is known", async () => {
    await expect(
      scanForAdvisories({
        runScan: () => Promise.resolve(run()),
        attempts: 4,
        wait,
      }),
    ).resolves.toEqual({ exitCode: 0, report: noKnownAdvisoriesReport });
  });

  it("fails with the scanner report when advisories are found", async () => {
    const outcome = await scanForAdvisories({
      runScan: () =>
        Promise.resolve(run({ exitCode: 1, stdout: advisoryReport })),
      attempts: 4,
      wait,
    });
    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toContain("Known advisories found:");
    expect(outcome.report).toContain("GHSA-4mjr-xmp4-gh2g");
  });

  it("retries a run that could not reach the database", async () => {
    const results = [
      run({ exitCode: 127, stderr: databaseRefused }),
      run({ exitCode: 0 }),
    ];
    const outcome = await scanForAdvisories({
      runScan: () => Promise.resolve(results.shift() ?? run()),
      attempts: 4,
      wait,
    });
    expect(outcome).toEqual({ exitCode: 0, report: noKnownAdvisoriesReport });
    expect(results).toHaveLength(0);
  });

  it("fails rather than passes when the database stays unreachable", async () => {
    let attempts = 0;
    const outcome = await scanForAdvisories({
      runScan: () => {
        attempts += 1;
        return Promise.resolve(
          run({
            exitCode: 127,
            stdout: '{"results":[]}',
            stderr: databaseRefused,
          }),
        );
      },
      attempts: 3,
      wait,
    });
    expect(attempts).toBe(3);
    expect(outcome.exitCode).toBe(1);
    expect(outcome.report).toContain(
      "The OSV database stayed unreachable across 3 attempts",
    );
    expect(outcome.report).toContain(databaseRefused);
  });
});
