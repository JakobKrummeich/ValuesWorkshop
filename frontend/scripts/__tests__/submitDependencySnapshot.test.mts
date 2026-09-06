import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  DependencySnapshot,
  Submission,
} from "../quality/supplyChain/dependencySnapshot.mts";
import {
  submitDependencySnapshot,
  type SubmissionResponse,
} from "../quality/supplyChain/submitDependencySnapshot.mts";

const orTools = "pkg:nuget/Google.OrTools@9.15.6755";
const protobuf = "pkg:nuget/Google.Protobuf@3.33.0";

const backendBill = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  metadata: {
    component: { name: "ValuesWorkshop", "bom-ref": "ValuesWorkshop@0.0.0" },
  },
  components: [
    { name: "Google.OrTools", "bom-ref": orTools, purl: orTools },
    { name: "Google.Protobuf", "bom-ref": protobuf, purl: protobuf },
  ],
  dependencies: [
    { ref: "ValuesWorkshop@0.0.0", dependsOn: [orTools] },
    { ref: orTools, dependsOn: [protobuf] },
  ],
};

const environment = {
  GITHUB_TOKEN: "ghs_token",
  GITHUB_API_URL: "https://api.github.com",
  GITHUB_SERVER_URL: "https://github.com",
  GITHUB_REPOSITORY: "JakobKrummeich/ValuesWorkshop",
  GITHUB_SHA: "1243b0f2f8be17cb0c2e01d4ab510bb3ec7e2994",
  GITHUB_REF: "refs/heads/main",
  GITHUB_RUN_ID: "1234567890",
  GITHUB_WORKFLOW: "Dependency graph",
  GITHUB_JOB: "submit",
};

function receipt(result: string, message: string): SubmissionResponse {
  return {
    status: 201,
    body: JSON.stringify({ id: 7, created_at: "now", result, message }),
  };
}

describe("submitDependencySnapshot", () => {
  let repositoryRoot: string;

  beforeEach(() => {
    repositoryRoot = mkdtempSync(join(tmpdir(), "dependency-snapshot-test-"));
    mkdirSync(join(repositoryRoot, "docs/quality/sbom"), { recursive: true });
    writeFileSync(
      join(repositoryRoot, "docs/quality/sbom/backend.cdx.json"),
      JSON.stringify(backendBill),
    );
  });

  afterEach(() => {
    rmSync(repositoryRoot, { recursive: true, force: true });
  });

  it("posts the backend bill as one manifest of the solution to the repository's snapshot endpoint", async () => {
    const posted: { submission: Submission; snapshot: DependencySnapshot }[] =
      [];
    const outcome = await submitDependencySnapshot(
      repositoryRoot,
      environment,
      (submission, snapshot) => {
        posted.push({ submission, snapshot });
        return Promise.resolve(receipt("SUCCESS", "Updated."));
      },
      new Date("2026-09-06T08:15:00Z"),
    );

    expect(posted).toHaveLength(1);
    expect(posted[0].submission.endpoint).toBe(
      "https://api.github.com/repos/JakobKrummeich/ValuesWorkshop/dependency-graph/snapshots",
    );
    expect(posted[0].submission.token).toBe("ghs_token");
    expect(Object.keys(posted[0].snapshot.manifests)).toEqual([
      "backend/ValuesWorkshop.sln",
    ]);
    expect(
      posted[0].snapshot.manifests["backend/ValuesWorkshop.sln"].resolved,
    ).toEqual({
      [orTools]: {
        package_url: orTools,
        relationship: "direct",
        scope: "runtime",
        dependencies: [protobuf],
      },
      [protobuf]: {
        package_url: protobuf,
        relationship: "indirect",
        scope: "runtime",
        dependencies: [],
      },
    });
    expect(outcome).toEqual({
      accepted: true,
      report: [
        "Submitted 2 packages of backend/ValuesWorkshop.sln for 1243b0f2f8be17cb0c2e01d4ab510bb3ec7e2994 on refs/heads/main",
        "GitHub answered SUCCESS: Updated.",
      ].join("\n"),
    });
  });

  it("reports a refused submission as not accepted", async () => {
    const outcome = await submitDependencySnapshot(
      repositoryRoot,
      environment,
      () => Promise.resolve({ status: 403, body: "Forbidden" }),
      new Date(),
    );

    expect(outcome.accepted).toBe(false);
    expect(outcome.report).toContain("GitHub answered HTTP 403: Forbidden");
  });
});
