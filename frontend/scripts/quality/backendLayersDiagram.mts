import {
  identifierOf,
  indented,
  mermaidDocument,
  node,
  subgraph,
} from "./mermaidDocument.mts";

export interface BackendProjectSources {
  productionSolution: string;
  allSolution: string;
  directoryBuildProperties: string;
  projectFiles: ReadonlyMap<string, string>;
}

interface BackendProject {
  name: string;
  references: string[];
}

const diagramTitle =
  "backend — the .NET projects and the references between them";

const solutionProjectPattern = /"([^"]+\.csproj)"/g;
const projectReferencePattern = /<ProjectReference[^>]*Include="([^"]+)"/g;
const analyzerReferencePattern =
  /<ProjectReference[^>]*Include="([^"]+)"[^>]*OutputItemType="Analyzer"/;

export function projectNameOf(projectPath: string): string {
  const fileName = projectPath.replaceAll("\\", "/").split("/").at(-1) ?? "";
  return fileName.replace(/^ValuesWorkshop\./, "").replace(/\.csproj$/, "");
}

export function solutionProjectNames(solution: string): string[] {
  return [...solution.matchAll(solutionProjectPattern)]
    .map((match) => projectNameOf(match[1]))
    .sort();
}

function referencesOf(projectFile: string): string[] {
  return [...projectFile.matchAll(projectReferencePattern)]
    .map((match) => projectNameOf(match[1]))
    .sort();
}

function projectsOf(sources: BackendProjectSources): BackendProject[] {
  const named = new Map(
    [...sources.projectFiles].map(([path, content]) => [
      projectNameOf(path),
      content,
    ]),
  );
  return solutionProjectNames(sources.allSolution).map((name) => {
    const projectFile = named.get(name);
    if (projectFile === undefined) {
      throw new Error(
        `backend/ValuesWorkshop.All.sln lists ${name}, whose project file was not read.`,
      );
    }
    return { name, references: referencesOf(projectFile) };
  });
}

export function analyzerProjectName(directoryBuildProperties: string): string {
  const match = analyzerReferencePattern.exec(directoryBuildProperties);
  if (match === null) {
    throw new Error(
      "backend/Directory.Build.props no longer wires an analyzer project into every project.",
    );
  }
  return projectNameOf(match[1]);
}

function referenceDepth(
  project: BackendProject,
  projects: readonly BackendProject[],
): number {
  const referenced = project.references.map((name) => {
    const found = projects.find((candidate) => candidate.name === name);
    return found === undefined ? 0 : 1 + referenceDepth(found, projects);
  });
  return Math.max(0, ...referenced);
}

function deepestFirst(
  projects: readonly BackendProject[],
): readonly BackendProject[] {
  return [...projects].sort(
    (first, second) =>
      referenceDepth(second, projects) - referenceDepth(first, projects) ||
      first.name.localeCompare(second.name),
  );
}

function projectSubgraph(
  identifier: string,
  label: string,
  projects: readonly BackendProject[],
): string[] {
  return subgraph(
    identifier,
    label,
    deepestFirst(projects).map((project) =>
      node(identifierOf(project.name), project.name),
    ),
  );
}

function classMembers(projects: readonly BackendProject[]): string {
  return deepestFirst(projects)
    .map((project) => identifierOf(project.name))
    .join(",");
}

function referenceEdges(projects: readonly BackendProject[]): string[] {
  return deepestFirst(projects).flatMap((project) =>
    project.references.map(
      (reference) =>
        `${identifierOf(project.name)} --> ${identifierOf(reference)}`,
    ),
  );
}

export function renderBackendLayersDiagram(
  sources: BackendProjectSources,
): string {
  const analyzer = analyzerProjectName(sources.directoryBuildProperties);
  const projects = projectsOf(sources).filter(
    (project) => project.name !== analyzer,
  );
  const production = solutionProjectNames(sources.productionSolution);
  const analyzed = projects.filter((project) =>
    production.includes(project.name),
  );
  const testing = projects.filter(
    (project) => !production.includes(project.name),
  );
  return mermaidDocument(diagramTitle, [
    "graph LR",
    ...indented([
      ...projectSubgraph(
        "productionProjects",
        "production — backend/ValuesWorkshop.sln",
        analyzed,
      ),
      ...projectSubgraph(
        "testProjects",
        "tests — the rest of backend/ValuesWorkshop.All.sln",
        testing,
      ),
      node(
        identifierOf(analyzer),
        `${analyzer}<br/>VW1001 complexity, VW1002 file length`,
      ),
      "",
      ...referenceEdges(projects),
      "",
      `${identifierOf(analyzer)} -. "Directory.Build.props wires it into every project" .-> productionProjects`,
      `${identifierOf(analyzer)} -.-> testProjects`,
      "",
      "classDef shipped stroke:#2e7d32,stroke-width:3px;",
      "classDef testing stroke-dasharray:5 4;",
      `class ${classMembers(analyzed)} shipped;`,
      `class ${classMembers(testing)} testing;`,
    ]),
  ]);
}
