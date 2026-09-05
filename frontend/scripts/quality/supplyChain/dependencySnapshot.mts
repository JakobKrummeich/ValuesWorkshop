import { z } from "zod";
import type { BillOfMaterials } from "./billsOfMaterials.mts";

export enum PackageRelationship {
  Direct = "direct",
  Indirect = "indirect",
}

export interface SnapshotJob {
  id: string;
  correlator: string;
  htmlUrl: string;
}

export interface SnapshotContext {
  sha: string;
  ref: string;
  repositoryUrl: string;
  job: SnapshotJob;
  scannedAt: Date;
}

export interface SubmittedBill {
  sourceLocation: string;
  bill: BillOfMaterials;
}

interface ResolvedPackage {
  package_url: string;
  relationship: PackageRelationship;
  scope: "runtime";
  dependencies: string[];
}

interface SnapshotManifest {
  name: string;
  file: { source_location: string };
  resolved: Record<string, ResolvedPackage>;
}

export interface DependencySnapshot {
  version: 0;
  sha: string;
  ref: string;
  job: { id: string; correlator: string; html_url: string };
  detector: { name: string; version: string; url: string };
  scanned: string;
  manifests: Record<string, SnapshotManifest>;
}

export interface SubmissionOutcome {
  accepted: boolean;
  report: string;
}

export interface Submission {
  endpoint: string;
  token: string;
  context: SnapshotContext;
}

const detectorSource =
  "frontend/scripts/quality/supplyChain/dependencySnapshot.mts";

function manifestFor({
  sourceLocation,
  bill,
}: SubmittedBill): SnapshotManifest {
  const listed = new Set(
    bill.components.map((component) => component["bom-ref"]),
  );
  const edges = new Map(
    (bill.dependencies ?? []).map((dependency) => [
      dependency.ref,
      dependency.dependsOn ?? [],
    ]),
  );
  for (const target of [...edges.values()].flat()) {
    if (!listed.has(target)) {
      throw new Error(
        `${sourceLocation} depends on ${target}, which the bill does not list as a component`,
      );
    }
  }
  const direct = new Set(edges.get(bill.metadata.component["bom-ref"]));
  return {
    name: sourceLocation,
    file: { source_location: sourceLocation },
    resolved: Object.fromEntries(
      bill.components.map((component) => [
        component["bom-ref"],
        {
          package_url: component.purl,
          relationship: direct.has(component["bom-ref"])
            ? PackageRelationship.Direct
            : PackageRelationship.Indirect,
          scope: "runtime",
          dependencies: edges.get(component["bom-ref"]) ?? [],
        },
      ]),
    ),
  };
}

export function buildDependencySnapshot(
  context: SnapshotContext,
  bills: readonly SubmittedBill[],
): DependencySnapshot {
  return {
    version: 0,
    sha: context.sha,
    ref: context.ref,
    job: {
      id: context.job.id,
      correlator: context.job.correlator,
      html_url: context.job.htmlUrl,
    },
    detector: {
      name: "values-workshop-bills-of-materials",
      version: "1",
      url: `${context.repositoryUrl}/blob/${context.sha}/${detectorSource}`,
    },
    scanned: context.scannedAt.toISOString(),
    manifests: Object.fromEntries(
      bills.map((bill) => [bill.sourceLocation, manifestFor(bill)]),
    ),
  };
}

const receiptSchema = z.object({
  result: z.enum(["SUCCESS", "ACCEPTED", "INVALID"]),
  message: z.string(),
});

function parsedJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export function describeSubmissionResponse(response: {
  status: number;
  body: string;
}): SubmissionOutcome {
  const receipt =
    response.status === 201
      ? receiptSchema.safeParse(parsedJson(response.body))
      : undefined;
  if (!receipt?.success) {
    return {
      accepted: false,
      report: `GitHub answered HTTP ${response.status}: ${response.body}`,
    };
  }
  return {
    accepted: receipt.data.result !== "INVALID",
    report: `GitHub answered ${receipt.data.result}: ${receipt.data.message}`,
  };
}

const workflowEnvironmentSchema = z.object({
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_API_URL: z.url(),
  GITHUB_SERVER_URL: z.url(),
  GITHUB_REPOSITORY: z.string().regex(/^[^/]+\/[^/]+$/),
  GITHUB_SHA: z.string().regex(/^[0-9a-f]{40}$/),
  GITHUB_REF: z.string().startsWith("refs/"),
  GITHUB_RUN_ID: z.string().min(1),
  GITHUB_WORKFLOW: z.string().min(1),
  GITHUB_JOB: z.string().min(1),
});

export function submissionFromEnvironment(
  environment: Record<string, string | undefined>,
  scannedAt: Date,
): Submission {
  const parsed = workflowEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(
      `The workflow environment does not describe a submission: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }
  const variables = parsed.data;
  const repositoryUrl = `${variables.GITHUB_SERVER_URL}/${variables.GITHUB_REPOSITORY}`;
  return {
    endpoint: `${variables.GITHUB_API_URL}/repos/${variables.GITHUB_REPOSITORY}/dependency-graph/snapshots`,
    token: variables.GITHUB_TOKEN,
    context: {
      sha: variables.GITHUB_SHA,
      ref: variables.GITHUB_REF,
      repositoryUrl,
      job: {
        id: variables.GITHUB_RUN_ID,
        correlator: `${variables.GITHUB_WORKFLOW}_${variables.GITHUB_JOB}`,
        htmlUrl: `${repositoryUrl}/actions/runs/${variables.GITHUB_RUN_ID}`,
      },
      scannedAt,
    },
  };
}
