namespace ValuesWorkshop.Adapters.Tests;

internal static class GeneratedDiagram
{
    private const string RegenerateSwitch = "DIAGRAM_WRITE";
    private const string RegenerateHint =
        "Refresh it with: pnpm quality:report — or, for this diagram alone, "
        + "DIAGRAM_WRITE=1 dotnet test backend/Adapters.Tests.";

    internal static void ShouldMatchCheckedInFile(string mermaid, string fileName)
    {
        var diagramFile = Path.Combine(QualityDirectory(), fileName);

        if (Environment.GetEnvironmentVariable(RegenerateSwitch) == "1")
        {
            File.WriteAllText(diagramFile, mermaid);
        }

        File.Exists(diagramFile)
            .ShouldBeTrue($"docs/quality/{fileName} is missing. {RegenerateHint}");

        var checkedIn = File.ReadAllText(diagramFile).ReplaceLineEndings("\n");

        DifferingLines(checkedIn.Split('\n'), mermaid.Split('\n'))
            .ShouldBeEmpty(
                $"docs/quality/{fileName} no longer draws what the generator draws. {RegenerateHint}"
            );
    }

    private static IReadOnlyList<string> DifferingLines(string[] checkedIn, string[] generated)
    {
        return
        [
            .. Enumerable
                .Range(0, Math.Max(checkedIn.Length, generated.Length))
                .Where(index => LineAt(checkedIn, index) != LineAt(generated, index))
                .Select(index =>
                    $"line {index + 1}: the file says '{LineAt(checkedIn, index)}' "
                    + $"where the generator says '{LineAt(generated, index)}'"
                ),
        ];
    }

    private static string LineAt(string[] lines, int index)
    {
        return index < lines.Length ? lines[index] : "<end of file>";
    }

    private static string QualityDirectory()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        var quality = Path.Combine("docs", "quality");

        while (
            directory is not null && !Directory.Exists(Path.Combine(directory.FullName, quality))
        )
        {
            directory = directory.Parent;
        }

        directory.ShouldNotBeNull($"No docs/quality directory above {AppContext.BaseDirectory}.");
        return Path.Combine(directory.FullName, quality);
    }
}
