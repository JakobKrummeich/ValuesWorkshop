import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  summarizeBackendVulnerabilityScan,
  summarizeFrontendVulnerabilityScan,
} from "../quality/securityScans.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("summarizeFrontendVulnerabilityScan", () => {
  it("reports a clean advisory scan as no findings", () => {
    expect(
      summarizeFrontendVulnerabilityScan(
        0,
        "No known vulnerabilities of high severity or above\n",
      ),
    ).toEqual({
      exitCode: 0,
      findings: 0,
      summary: "No known vulnerabilities of high severity or above",
    });
  });

  it("counts the advisories pnpm audit reported", () => {
    expect(
      summarizeFrontendVulnerabilityScan(
        1,
        'Vulnerabilities of high severity or above found:\n{"advisories":{"1":{},"2":{}}}',
      ),
    ).toEqual({
      exitCode: 1,
      findings: 2,
      summary: "2 advisories of high severity or above",
    });
  });

  it("refuses output that is neither a clean report nor an advisory report", () => {
    expect(() => summarizeFrontendVulnerabilityScan(1, "ECONNREFUSED")).toThrow(
      "neither a clean report nor an advisory report",
    );
  });
});

describe("summarizeBackendVulnerabilityScan", () => {
  it("counts the projects dotnet scanned", () => {
    expect(
      summarizeBackendVulnerabilityScan(
        0,
        fixture("backendVulnerabilityScan.txt"),
      ),
    ).toEqual({
      exitCode: 0,
      findings: 0,
      summary: "No vulnerable packages across 11 scanned projects",
    });
  });

  it("counts a reported vulnerable package as a finding", () => {
    expect(
      summarizeBackendVulnerabilityScan(
        1,
        [
          "Project `ValuesWorkshop.Host` has the following vulnerable packages",
          "   [net10.0]: ",
          "   Top-level Package      Requested   Resolved   Severity   Advisory URL",
          "   > System.Text.Json     8.0.0       8.0.0      High       https://example.test",
        ].join("\n"),
      ),
    ).toMatchObject({
      findings: 1,
      summary: "1 vulnerable packages of Low severity or above",
    });
  });

  it("refuses output in which no project was listed at all", () => {
    expect(() => summarizeBackendVulnerabilityScan(1, "error NU1301")).toThrow(
      "listed no project at all",
    );
  });
});
