import {
  analyzerProjectName,
  projectNameOf,
  renderBackendLayersDiagram,
  solutionProjectNames,
  type BackendProjectSources,
} from "../quality/backendLayersDiagram.mts";

function solution(...projectPaths: readonly string[]): string {
  return projectPaths
    .map(
      (path) =>
        `Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "${projectNameOf(path)}", "${path}", "{27D5AF10-B8B4-4B3B-9A1F-2E4E45C4F1AA}"\nEndProject`,
    )
    .join("\n");
}

const directoryBuildProperties = `<Project>
  <ItemGroup Condition="'$(MSBuildProjectName)' != 'ValuesWorkshop.Analyzers'">
    <ProjectReference
      Include="$(MSBuildThisFileDirectory)Analyzers/ValuesWorkshop.Analyzers.csproj"
      OutputItemType="Analyzer"
      ReferenceOutputAssembly="false"
    />
  </ItemGroup>
</Project>`;

function projectFile(...references: readonly string[]): string {
  return `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
${references.map((reference) => `    <ProjectReference Include="..\\${reference}\\ValuesWorkshop.${reference}.csproj" />`).join("\n")}
  </ItemGroup>
</Project>`;
}

const sources: BackendProjectSources = {
  productionSolution: solution(
    "Domain\\ValuesWorkshop.Domain.csproj",
    "Application\\ValuesWorkshop.Application.csproj",
    "Analyzers\\ValuesWorkshop.Analyzers.csproj",
  ),
  allSolution: solution(
    "Domain\\ValuesWorkshop.Domain.csproj",
    "Application\\ValuesWorkshop.Application.csproj",
    "Analyzers\\ValuesWorkshop.Analyzers.csproj",
    "Application.Tests\\ValuesWorkshop.Application.Tests.csproj",
  ),
  directoryBuildProperties,
  projectFiles: new Map([
    ["Domain/ValuesWorkshop.Domain.csproj", projectFile()],
    ["Application/ValuesWorkshop.Application.csproj", projectFile("Domain")],
    ["Analyzers/ValuesWorkshop.Analyzers.csproj", projectFile()],
    [
      "Application.Tests/ValuesWorkshop.Application.Tests.csproj",
      projectFile("Application"),
    ],
  ]),
};

describe("projectNameOf", () => {
  it("drops the shared prefix and the extension from either separator", () => {
    expect(
      projectNameOf("..\\Adapters.Web\\ValuesWorkshop.Adapters.Web.csproj"),
    ).toBe("Adapters.Web");
    expect(projectNameOf("Host/ValuesWorkshop.Host.csproj")).toBe("Host");
  });
});

describe("solutionProjectNames", () => {
  it("reads the projects a solution file lists", () => {
    expect(solutionProjectNames(sources.productionSolution)).toEqual([
      "Analyzers",
      "Application",
      "Domain",
    ]);
  });
});

describe("analyzerProjectName", () => {
  it("finds the project every other project loads as an analyzer", () => {
    expect(analyzerProjectName(directoryBuildProperties)).toBe("Analyzers");
  });

  it("refuses properties that wire in no analyzer", () => {
    expect(() => analyzerProjectName("<Project></Project>")).toThrow(
      "no longer wires an analyzer project into every project",
    );
  });
});

describe("renderBackendLayersDiagram", () => {
  const diagram = renderBackendLayersDiagram(sources);

  it("separates the production projects from the test projects", () => {
    expect(diagram).toContain(
      'subgraph productionProjects["production — backend/ValuesWorkshop.sln"]',
    );
    expect(diagram).toContain(
      'subgraph testProjects["tests — the rest of backend/ValuesWorkshop.All.sln"]',
    );
    expect(diagram).toContain('applicationTests["Application.Tests"]');
  });

  it("orders a project ahead of the projects it references", () => {
    const positionOf = (identifier: string) =>
      diagram.indexOf(`${identifier}["`);
    expect(positionOf("application")).toBeLessThan(positionOf("domain"));
  });

  it("draws one arrow per project reference", () => {
    expect(diagram).toContain("application --> domain");
    expect(diagram).toContain("applicationTests --> application");
  });

  it("keeps the analyzer out of the layers and wires it into every project", () => {
    expect(diagram).toContain(
      'analyzers["Analyzers<br/>VW1001 complexity, VW1002 file length"]',
    );
    expect(diagram).not.toContain(
      'subgraph productionProjects["production — backend/ValuesWorkshop.sln"]\n        analyzers',
    );
    expect(diagram).toContain(
      'analyzers -. "Directory.Build.props wires it into every project" .-> productionProjects',
    );
    expect(diagram).toContain("analyzers -.-> testProjects");
  });

  it("refuses a solution whose project file it was not given", () => {
    expect(() =>
      renderBackendLayersDiagram({
        ...sources,
        projectFiles: new Map([
          ["Domain/ValuesWorkshop.Domain.csproj", projectFile()],
          ["Analyzers/ValuesWorkshop.Analyzers.csproj", projectFile()],
        ]),
      }),
    ).toThrow("lists Application, whose project file was not read");
  });
});
