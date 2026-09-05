using Microsoft.CodeAnalysis;

namespace ValuesWorkshop.Analyzers.Tests;

public class FileLengthAnalyzerTests
{
    private static string FileOfLines(int lines) =>
        string.Join("\n", Enumerable.Range(1, lines).Select(line => $"// line {line}"));

    [Fact]
    public async Task A_production_file_beyond_300_lines_fails_the_build()
    {
        var diagnostics = await AnalyzerRun.DiagnosticsOf(
            new FileLengthAnalyzer(),
            FileOfLines(301)
        );

        var tooLong = diagnostics.ShouldHaveSingleItem();
        tooLong.Id.ShouldBe("VW1002");
        tooLong.Severity.ShouldBe(DiagnosticSeverity.Error);
        tooLong.GetMessage().ShouldBe("'Sample.cs' has 301 lines (max 300)");
    }

    [Fact]
    public async Task A_production_file_of_300_lines_passes()
    {
        var diagnostics = await AnalyzerRun.DiagnosticsOf(
            new FileLengthAnalyzer(),
            FileOfLines(300)
        );

        diagnostics.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_test_file_may_run_to_600_lines()
    {
        var diagnostics = await AnalyzerRun.DiagnosticsOf(
            new FileLengthAnalyzer(),
            FileOfLines(600),
            AnalyzerRun.TestAssemblyName
        );

        diagnostics.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_test_file_beyond_600_lines_fails_the_build()
    {
        var diagnostics = await AnalyzerRun.DiagnosticsOf(
            new FileLengthAnalyzer(),
            FileOfLines(601),
            AnalyzerRun.TestAssemblyName
        );

        diagnostics.Single().GetMessage().ShouldBe("'Sample.cs' has 601 lines (max 600)");
    }
}
