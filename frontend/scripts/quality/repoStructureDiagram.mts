import {
  identifierOf,
  indented,
  mermaidDocument,
  node,
  subgraph,
} from "./mermaidDocument.mts";

export const DirectoryKind = {
  ProductCode: "product code",
  Tests: "tests",
  Documentation: "documentation",
  Tooling: "tooling",
} as const;

export type DirectoryKind = (typeof DirectoryKind)[keyof typeof DirectoryKind];

export interface TopLevelDirectory {
  directory: string;
  kind: DirectoryKind;
  purpose: string;
  checkedByTheGates: boolean;
}

export const topLevelDirectories: readonly TopLevelDirectory[] = [
  {
    directory: "frontend",
    kind: DirectoryKind.ProductCode,
    purpose: "Next.js app — the facilitator, participant and presenter screens",
    checkedByTheGates: true,
  },
  {
    directory: "backend",
    kind: DirectoryKind.ProductCode,
    purpose: "ASP.NET Core — Domain, Application, Adapters, Host",
    checkedByTheGates: true,
  },
  {
    directory: "config",
    kind: DirectoryKind.ProductCode,
    purpose: "Workshop content the backend serves — values, quiz, animals",
    checkedByTheGates: true,
  },
  {
    directory: "contract",
    kind: DirectoryKind.Tests,
    purpose: "Wire fixtures both sides assert against",
    checkedByTheGates: true,
  },
  {
    directory: "e2e",
    kind: DirectoryKind.Tests,
    purpose: "Playwright journeys through a real browser",
    checkedByTheGates: true,
  },
  {
    directory: "scripts",
    kind: DirectoryKind.Tooling,
    purpose: "The gate scripts CI and developers run alike, plus demo capture",
    checkedByTheGates: true,
  },
  {
    directory: "devtools",
    kind: DirectoryKind.Tooling,
    purpose: "Local OIDC provider for development and the e2e stack",
    checkedByTheGates: true,
  },
  {
    directory: "patches",
    kind: DirectoryKind.Tooling,
    purpose: "Dependency patches pnpm applies on install",
    checkedByTheGates: true,
  },
  {
    directory: ".github",
    kind: DirectoryKind.Tooling,
    purpose: "The workflow that runs the gate scripts on every push",
    checkedByTheGates: true,
  },
  {
    directory: ".pi",
    kind: DirectoryKind.Tooling,
    purpose: "Agent skills the workflow in AGENTS.md follows",
    checkedByTheGates: false,
  },
  {
    directory: "design",
    kind: DirectoryKind.Documentation,
    purpose: "Protocol, state machine, persistence, domain model, screens",
    checkedByTheGates: false,
  },
  {
    directory: "docs",
    kind: DirectoryKind.Documentation,
    purpose: "Architecture reviews, README media, the measured quality report",
    checkedByTheGates: false,
  },
  {
    directory: "tasks",
    kind: DirectoryKind.Documentation,
    purpose: "The plan, the backlog and the per-task mini-specs",
    checkedByTheGates: false,
  },
] as const;

const diagramTitle =
  "The repository, top level — what each directory holds and what checks it";

const describedIn =
  "Describe it in frontend/scripts/quality/repoStructureDiagram.mts.";

export function trackedTopLevelDirectories(
  trackedPaths: readonly string[],
): string[] {
  const directories = trackedPaths
    .filter((path) => path.includes("/"))
    .map((path) => path.slice(0, path.indexOf("/")));
  return [...new Set(directories)].sort();
}

function describedDirectories(tracked: readonly string[]): TopLevelDirectory[] {
  const undescribed = tracked.filter(
    (directory) =>
      !topLevelDirectories.some((entry) => entry.directory === directory),
  );
  if (undescribed.length > 0) {
    throw new Error(
      `git tracks ${undescribed.join(", ")}, which the repository map does not describe. ${describedIn}`,
    );
  }
  const vanished = topLevelDirectories.filter(
    (entry) => !tracked.includes(entry.directory),
  );
  if (vanished.length > 0) {
    throw new Error(
      `The repository map describes ${vanished.map((entry) => entry.directory).join(", ")}, which git no longer tracks. ${describedIn}`,
    );
  }
  return [...topLevelDirectories];
}

function directoryNode(entry: TopLevelDirectory): string {
  return node(
    identifierOf(entry.directory),
    `${entry.directory}/<br/>${entry.purpose}`,
  );
}

function kindSubgraph(
  kind: DirectoryKind,
  described: readonly TopLevelDirectory[],
): string[] {
  const entries = described.filter((entry) => entry.kind === kind);
  return subgraph(identifierOf(kind), kind, entries.map(directoryNode));
}

function membersOf(
  described: readonly TopLevelDirectory[],
  checkedByTheGates: boolean,
): string {
  return described
    .filter((entry) => entry.checkedByTheGates === checkedByTheGates)
    .map((entry) => identifierOf(entry.directory))
    .join(",");
}

export function renderRepoStructureDiagram(
  trackedPaths: readonly string[],
): string {
  const described = describedDirectories(
    trackedTopLevelDirectories(trackedPaths),
  );
  return mermaidDocument(diagramTitle, [
    "graph TD",
    ...indented([
      ...Object.values(DirectoryKind).flatMap((kind) =>
        kindSubgraph(kind, described),
      ),
      ...subgraph("legend", "legend", [
        node("legendChecked", "a build gate fails when this is wrong"),
        node("legendUnchecked", "prose — people review it, gates do not"),
      ]),
      "",
      "classDef checked stroke:#2e7d32,stroke-width:3px;",
      "classDef unchecked stroke-dasharray:5 4;",
      `class ${membersOf(described, true)},legendChecked checked;`,
      `class ${membersOf(described, false)},legendUnchecked unchecked;`,
    ]),
  ]);
}
