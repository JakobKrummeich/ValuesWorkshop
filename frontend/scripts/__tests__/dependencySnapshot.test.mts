import { parseBillOfMaterials } from "../quality/supplyChain/billsOfMaterials.mts";
import {
  buildDependencySnapshot,
  describeSubmissionResponse,
  PackageRelationship,
  submissionFromEnvironment,
  type SnapshotContext,
} from "../quality/supplyChain/dependencySnapshot.mts";

const orTools = "pkg:nuget/Google.OrTools@9.15.6755";
const sqlite = "pkg:nuget/Microsoft.EntityFrameworkCore.Sqlite@10.0.10";
const relational = "pkg:nuget/Microsoft.EntityFrameworkCore.Relational@10.0.10";

function component(purl: string) {
  return { name: purl.split("/")[1].split("@")[0], "bom-ref": purl, purl };
}

const backendBill = parseBillOfMaterials(
  JSON.stringify({
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    metadata: {
      component: { name: "ValuesWorkshop", "bom-ref": "ValuesWorkshop@0.0.0" },
    },
    components: [component(orTools), component(sqlite), component(relational)],
    dependencies: [
      { ref: "ValuesWorkshop@0.0.0", dependsOn: [orTools, sqlite] },
      { ref: sqlite, dependsOn: [relational] },
      { ref: relational, dependsOn: [] },
    ],
  }),
);

const context: SnapshotContext = {
  sha: "1243b0f2f8be17cb0c2e01d4ab510bb3ec7e2994",
  ref: "refs/heads/main",
  repositoryUrl: "https://github.com/JakobKrummeich/ValuesWorkshop",
  job: {
    id: "1234567890",
    correlator: "Dependency graph_submit",
    htmlUrl:
      "https://github.com/JakobKrummeich/ValuesWorkshop/actions/runs/1234567890",
  },
  scannedAt: new Date("2026-09-06T08:15:00Z"),
};

describe("buildDependencySnapshot", () => {
  const snapshot = buildDependencySnapshot(context, [
    { sourceLocation: "backend/ValuesWorkshop.sln", bill: backendBill },
  ]);
  const manifest = snapshot.manifests["backend/ValuesWorkshop.sln"];

  it("describes the commit, the workflow run and the code that produced it", () => {
    expect(snapshot).toMatchObject({
      version: 0,
      sha: context.sha,
      ref: "refs/heads/main",
      scanned: "2026-09-06T08:15:00.000Z",
      job: {
        id: "1234567890",
        correlator: "Dependency graph_submit",
        html_url: context.job.htmlUrl,
      },
    });
    expect(snapshot.detector.url).toBe(
      `${context.repositoryUrl}/blob/${context.sha}/frontend/scripts/quality/supplyChain/dependencySnapshot.mts`,
    );
  });

  it("files every component under the manifest the bill describes", () => {
    expect(manifest.name).toBe("backend/ValuesWorkshop.sln");
    expect(manifest.file.source_location).toBe("backend/ValuesWorkshop.sln");
    expect(Object.keys(manifest.resolved)).toEqual([
      orTools,
      sqlite,
      relational,
    ]);
  });

  it("marks the packages the root depends on as direct and the rest as indirect", () => {
    expect(manifest.resolved[orTools].relationship).toBe(
      PackageRelationship.Direct,
    );
    expect(manifest.resolved[sqlite].relationship).toBe(
      PackageRelationship.Direct,
    );
    expect(manifest.resolved[relational].relationship).toBe(
      PackageRelationship.Indirect,
    );
  });

  it("carries each package's own edges and treats a package without an entry as a leaf", () => {
    expect(manifest.resolved[sqlite]).toMatchObject({
      package_url: sqlite,
      scope: "runtime",
      dependencies: [relational],
    });
    expect(manifest.resolved[orTools].dependencies).toEqual([]);
  });

  it("refuses a graph edge that points at a package the bill does not list", () => {
    const bill = {
      ...backendBill,
      dependencies: [
        ...(backendBill.dependencies ?? []),
        { ref: orTools, dependsOn: ["pkg:nuget/Missing@1.0.0"] },
      ],
    };
    expect(() =>
      buildDependencySnapshot(context, [
        { sourceLocation: "backend/ValuesWorkshop.sln", bill },
      ]),
    ).toThrow(
      "backend/ValuesWorkshop.sln depends on pkg:nuget/Missing@1.0.0, which the bill does not list as a component",
    );
  });
});

describe("describeSubmissionResponse", () => {
  function created(result: string, message: string) {
    return {
      status: 201,
      body: JSON.stringify({
        id: 42,
        created_at: "2026-09-06T08:15:01Z",
        result,
        message,
      }),
    };
  }

  it("accepts a snapshot GitHub processed", () => {
    expect(
      describeSubmissionResponse(
        created(
          "SUCCESS",
          "Dependency results for the repo have been successfully updated.",
        ),
      ),
    ).toEqual({
      accepted: true,
      report:
        "GitHub answered SUCCESS: Dependency results for the repo have been successfully updated.",
    });
  });

  it("accepts a snapshot GitHub queued", () => {
    expect(
      describeSubmissionResponse(created("ACCEPTED", "Snapshot queued.")),
    ).toEqual({
      accepted: true,
      report: "GitHub answered ACCEPTED: Snapshot queued.",
    });
  });

  it("rejects a snapshot GitHub found invalid", () => {
    expect(
      describeSubmissionResponse(created("INVALID", "Manifest name is empty.")),
    ).toEqual({
      accepted: false,
      report: "GitHub answered INVALID: Manifest name is empty.",
    });
  });

  it("rejects any other answer with the status and body GitHub sent", () => {
    expect(
      describeSubmissionResponse({
        status: 403,
        body: '{"message":"Resource not accessible by integration"}',
      }),
    ).toEqual({
      accepted: false,
      report:
        'GitHub answered HTTP 403: {"message":"Resource not accessible by integration"}',
    });
  });

  it("rejects a created answer whose body is not a snapshot receipt", () => {
    expect(
      describeSubmissionResponse({
        status: 201,
        body: "<html>maintenance</html>",
      }),
    ).toEqual({
      accepted: false,
      report: "GitHub answered HTTP 201: <html>maintenance</html>",
    });
  });
});

describe("submissionFromEnvironment", () => {
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
  const scannedAt = new Date("2026-09-06T08:15:00Z");

  it("reads the commit, the run and the endpoint from the workflow environment", () => {
    expect(submissionFromEnvironment(environment, scannedAt)).toEqual({
      endpoint:
        "https://api.github.com/repos/JakobKrummeich/ValuesWorkshop/dependency-graph/snapshots",
      token: "ghs_token",
      context: {
        sha: "1243b0f2f8be17cb0c2e01d4ab510bb3ec7e2994",
        ref: "refs/heads/main",
        repositoryUrl: "https://github.com/JakobKrummeich/ValuesWorkshop",
        job: {
          id: "1234567890",
          correlator: "Dependency graph_submit",
          htmlUrl:
            "https://github.com/JakobKrummeich/ValuesWorkshop/actions/runs/1234567890",
        },
        scannedAt,
      },
    });
  });

  it("names the variable the workflow forgot to pass", () => {
    expect(() =>
      submissionFromEnvironment(
        { ...environment, GITHUB_TOKEN: undefined },
        scannedAt,
      ),
    ).toThrow("GITHUB_TOKEN");
  });

  it("refuses a ref GitHub would not attach a snapshot to", () => {
    expect(() =>
      submissionFromEnvironment(
        { ...environment, GITHUB_REF: "main" },
        scannedAt,
      ),
    ).toThrow("GITHUB_REF");
  });
});
