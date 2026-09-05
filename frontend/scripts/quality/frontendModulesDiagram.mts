import { z } from "zod";
import {
  identifierOf,
  indented,
  mermaidDocument,
  node,
  subgraph,
} from "./mermaidDocument.mts";

const architecturalFolders = [
  "src/domain",
  "src/domain/ports",
  "src/adapters",
  "src/config",
  "src/shared",
  "src/testing",
  "src/app",
  "src/app/facilitator",
  "src/app/participant",
  "src/app/presenter",
] as const;

const diagramTitle =
  "frontend/src — folder dependencies, as dependency-cruiser sees them";

const moduleGraphSchema = z.object({
  modules: z.array(
    z.object({
      source: z.string(),
      dependencies: z.array(z.object({ resolved: z.string() })),
    }),
  ),
});

interface FolderEdge {
  from: string;
  to: string;
}

function isProductionModule(path: string): boolean {
  return !path.includes("/__tests__/") && !/\.test\./.test(path);
}

export function folderOf(modulePath: string): string | undefined {
  if (!modulePath.startsWith("src/")) {
    return undefined;
  }
  const containing = architecturalFolders.filter((folder) =>
    modulePath.startsWith(`${folder}/`),
  );
  if (containing.length === 0) {
    throw new Error(
      `${modulePath} sits in no architectural folder; add its folder to frontend/scripts/quality/frontendModulesDiagram.mts.`,
    );
  }
  return containing.reduce((deepest, folder) =>
    folder.length > deepest.length ? folder : deepest,
  );
}

export function foldFolderEdges(reportJson: string): FolderEdge[] {
  const report = moduleGraphSchema.parse(JSON.parse(reportJson));
  const edges = new Set<string>();
  for (const sourceModule of report.modules.filter((candidate) =>
    isProductionModule(candidate.source),
  )) {
    const from = folderOf(sourceModule.source);
    for (const dependency of sourceModule.dependencies.filter((candidate) =>
      isProductionModule(candidate.resolved),
    )) {
      const to = folderOf(dependency.resolved);
      if (from !== undefined && to !== undefined && from !== to) {
        edges.add(`${from} ${to}`);
      }
    }
  }
  return [...edges].sort().map((edge) => {
    const [from, to] = edge.split(" ");
    return { from, to };
  });
}

function label(folder: string): string {
  return folder.slice("src/".length);
}

function childrenOf(folder: string): string[] {
  return architecturalFolders.filter((candidate) =>
    candidate.startsWith(`${folder}/`),
  );
}

function folderNode(folder: string): string {
  return node(identifierOf(folder), label(folder));
}

function folderNodes(): string[] {
  const nested = new Set(
    architecturalFolders.flatMap((folder) => childrenOf(folder)),
  );
  return architecturalFolders
    .filter((folder) => !nested.has(folder))
    .flatMap((folder) => {
      const children = childrenOf(folder);
      return children.length === 0
        ? [folderNode(folder)]
        : subgraph(`${identifierOf(folder)}Area`, `${label(folder)}/`, [
            folderNode(folder),
            ...children.map(folderNode),
          ]);
    });
}

export function renderFrontendModulesDiagram(reportJson: string): string {
  return mermaidDocument(diagramTitle, [
    "graph LR",
    ...indented([
      ...folderNodes(),
      "",
      ...foldFolderEdges(reportJson).map(
        (edge) => `${identifierOf(edge.from)} --> ${identifierOf(edge.to)}`,
      ),
    ]),
  ]);
}
