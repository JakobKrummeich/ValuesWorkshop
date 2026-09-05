import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseBillOfMaterials } from "./billsOfMaterials.mts";
import {
  buildDependencySnapshot,
  describeSubmissionResponse,
  submissionFromEnvironment,
  type DependencySnapshot,
  type SubmissionOutcome,
} from "./dependencySnapshot.mts";
import { billOfMaterialsDirectory } from "./writeBillsOfMaterials.mts";

// GitHub reads pnpm-lock.yaml itself, so the frontend bill would only file a
// second copy of every npm package; the .csproj files it reads for the backend
// name the direct packages alone, so the backend bill adds the transitive ones.
const submittedBills = [
  {
    path: `${billOfMaterialsDirectory}/backend.cdx.json`,
    sourceLocation: "backend/ValuesWorkshop.sln",
  },
];

function describeContents(snapshot: DependencySnapshot): string {
  return Object.values(snapshot.manifests)
    .map(
      (manifest) =>
        `${Object.keys(manifest.resolved).length} packages of ${manifest.name}`,
    )
    .join(", ");
}

function submit(repositoryRoot: string): Promise<SubmissionOutcome> {
  const submission = submissionFromEnvironment(process.env, new Date());
  const snapshot = buildDependencySnapshot(
    submission.context,
    submittedBills.map(({ path, sourceLocation }) => ({
      sourceLocation,
      bill: parseBillOfMaterials(
        readFileSync(resolve(repositoryRoot, path), "utf8"),
      ),
    })),
  );
  process.stdout.write(
    `Submitting ${describeContents(snapshot)} for ${snapshot.sha} on ${snapshot.ref}\n`,
  );
  return fetch(submission.endpoint, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${submission.token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify(snapshot),
  }).then((response) =>
    response
      .text()
      .then((body) =>
        describeSubmissionResponse({ status: response.status, body }),
      ),
  );
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("submitDependencySnapshot.mts") ?? false;
}

if (isInvokedAsScript()) {
  void submit(resolve(process.cwd(), "..")).then((outcome) => {
    const stream = outcome.accepted ? process.stdout : process.stderr;
    stream.write(`${outcome.report}\n`);
    process.exit(outcome.accepted ? 0 : 1);
  });
}
