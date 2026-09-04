import { readdirSync } from "node:fs";
import { join } from "node:path";
import { dependencyCruiserArguments } from "./architectureReports.mts";
import {
  renderBackendLayersDiagram,
  type BackendProjectSources,
} from "./backendLayersDiagram.mts";
import {
  readRepositoryFile,
  runInFrontend,
  runInRepository,
  type RepositoryLocations,
} from "./collectionContext.mts";
import { renderFrontendModulesDiagram } from "./frontendModulesDiagram.mts";
import { renderRepoStructureDiagram } from "./repoStructureDiagram.mts";
import { parseTrackedFilePaths } from "./sizeScan.mts";

export interface GeneratedDiagram {
  path: string;
  mermaid: string;
}

export const repoStructureDiagramPath = "docs/quality/repo-structure.mmd";
export const frontendModulesDiagramPath = "docs/quality/frontend-modules.mmd";
export const backendLayersDiagramPath = "docs/quality/backend-layers.mmd";

function projectFiles(
  locations: RepositoryLocations,
): ReadonlyMap<string, string> {
  const backendDirectory = join(locations.repositoryRoot, "backend");
  const projects = readdirSync(backendDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(backendDirectory, entry.name))
        .filter((file) => file.endsWith(".csproj"))
        .map((file) => `backend/${entry.name}/${file}`),
    );
  return new Map(
    projects.map((path) => [path, readRepositoryFile(locations, path)]),
  );
}

function backendProjectSources(
  locations: RepositoryLocations,
): BackendProjectSources {
  return {
    productionSolution: readRepositoryFile(
      locations,
      "backend/ValuesWorkshop.sln",
    ),
    allSolution: readRepositoryFile(
      locations,
      "backend/ValuesWorkshop.All.sln",
    ),
    directoryBuildProperties: readRepositoryFile(
      locations,
      "backend/Directory.Build.props",
    ),
    projectFiles: projectFiles(locations),
  };
}

export function generateStructuralDiagrams(
  locations: RepositoryLocations,
): GeneratedDiagram[] {
  const trackedPaths = runInRepository(locations, "git", ["ls-files"]);
  const moduleGraph = runInFrontend(
    locations,
    "npx",
    dependencyCruiserArguments,
    [0],
  );
  return [
    {
      path: repoStructureDiagramPath,
      mermaid: renderRepoStructureDiagram(
        parseTrackedFilePaths(trackedPaths.stdout),
      ),
    },
    {
      path: frontendModulesDiagramPath,
      mermaid: renderFrontendModulesDiagram(moduleGraph.stdout),
    },
    {
      path: backendLayersDiagramPath,
      mermaid: renderBackendLayersDiagram(backendProjectSources(locations)),
    },
  ];
}
