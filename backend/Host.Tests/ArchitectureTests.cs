namespace ValuesWorkshop.Host.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Host_is_the_executable_composition_root()
    {
        typeof(AssemblyMarker).Assembly.EntryPoint.ShouldNotBeNull();
    }

    [Fact]
    public void Only_the_CpSat_adapter_references_OrTools()
    {
        var orToolsNamespace = string.Join('.', "Google", "OrTools");
        var filesReferencingOrTools = Directory
            .EnumerateFiles(BackendSourceRoot(), "*.cs", SearchOption.AllDirectories)
            .Where(path =>
                !path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
            )
            .Where(path =>
                !path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}")
            )
            .Where(path => File.ReadAllText(path).Contains(orToolsNamespace))
            .Select(Path.GetFileName)
            .ToList();

        filesReferencingOrTools.ShouldBe(["CpSatGroupSolver.cs"]);
    }

    private static string BackendSourceRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (
            directory is not null
            && !File.Exists(Path.Combine(directory.FullName, "ValuesWorkshop.sln"))
        )
        {
            directory = directory.Parent;
        }

        directory.ShouldNotBeNull();
        return directory.FullName;
    }
}
