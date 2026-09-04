import { runCommand } from "./commandRunner.mts";
import type { RepositoryLocations } from "./collectionContext.mts";

export const databaseDiagramPath = "docs/quality/database.mmd";

export function writeDatabaseDiagram(locations: RepositoryLocations): string {
  runCommand({
    command: "dotnet",
    args: [
      "test",
      "backend/Adapters.Tests",
      "--filter",
      "FullyQualifiedName~DatabaseDiagramTests",
    ],
    cwd: locations.repositoryRoot,
    environment: { DIAGRAM_WRITE: "1" },
  });
  return databaseDiagramPath;
}
