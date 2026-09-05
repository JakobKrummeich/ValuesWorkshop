using System.Collections.Immutable;
using Microsoft.CodeAnalysis;

namespace ValuesWorkshop.Analyzers.Tests;

public class CyclomaticComplexityAnalyzerTests
{
    private static Task<ImmutableArray<Diagnostic>> Analyze(string source) =>
        AnalyzerRun.DiagnosticsOf(new CyclomaticComplexityAnalyzer(), source);

    private static string MethodWithBranches(int branches)
    {
        var statements = string.Join(
            "\n",
            Enumerable
                .Range(0, branches)
                .Select(index => $"        if (value == {index}) return {index};")
        );
        return $$"""
            public class Sample
            {
                public int Decide(int value)
                {
            {{statements}}
                    return -1;
                }
            }
            """;
    }

    [Fact]
    public async Task Every_method_reports_its_cyclomatic_complexity_as_a_hidden_diagnostic()
    {
        var diagnostics = await Analyze(
            """
            public class Sample
            {
                public bool Decide(int value, bool flag)
                {
                    if (value > 0 && flag)
                    {
                        return true;
                    }
                    return false;
                }
            }
            """
        );

        var measurement = diagnostics.ShouldHaveSingleItem();
        measurement.Id.ShouldBe("VW1003");
        measurement.Severity.ShouldBe(DiagnosticSeverity.Hidden);
        measurement.GetMessage().ShouldBe("'Decide' has cyclomatic complexity 3");
        measurement.Location.GetLineSpan().StartLinePosition.Line.ShouldBe(2);
    }

    [Fact]
    public void The_measurement_is_enabled_by_default_so_a_build_can_promote_it()
    {
        var measurement = new CyclomaticComplexityAnalyzer().SupportedDiagnostics.Single(
            descriptor => descriptor.Id == CyclomaticComplexityAnalyzer.MeasurementDiagnosticId
        );

        measurement.IsEnabledByDefault.ShouldBeTrue();
        measurement.DefaultSeverity.ShouldBe(DiagnosticSeverity.Hidden);
    }

    [Fact]
    public async Task A_method_at_the_cap_is_measured_but_not_reported_as_too_complex()
    {
        var diagnostics = await Analyze(MethodWithBranches(6));

        diagnostics.Select(diagnostic => diagnostic.Id).ShouldBe(["VW1003"]);
        diagnostics.Single().GetMessage().ShouldBe("'Decide' has cyclomatic complexity 7");
    }

    [Fact]
    public async Task A_method_above_the_cap_fails_the_build()
    {
        var diagnostics = await Analyze(MethodWithBranches(7));

        var tooComplex = diagnostics.Single(diagnostic => diagnostic.Id == "VW1001");
        tooComplex.Severity.ShouldBe(DiagnosticSeverity.Error);
        tooComplex.GetMessage().ShouldBe("'Decide' has cyclomatic complexity 8 (max 7)");
        diagnostics
            .Single(diagnostic => diagnostic.Id == "VW1003")
            .GetMessage()
            .ShouldBe("'Decide' has cyclomatic complexity 8");
    }

    [Fact]
    public async Task An_expression_bodied_property_is_measured()
    {
        var diagnostics = await Analyze(
            """
            public class Sample
            {
                private readonly int count;

                public string Size => count > 3 ? "large" : "small";
            }
            """
        );

        diagnostics.Single().GetMessage().ShouldBe("'Size' has cyclomatic complexity 2");
    }

    [Fact]
    public async Task A_constructor_is_measured()
    {
        var diagnostics = await Analyze(
            """
            public class Sample
            {
                private readonly string name;

                public Sample(string? name)
                {
                    this.name = name ?? "anonymous";
                }
            }
            """
        );

        diagnostics.Single().GetMessage().ShouldBe("'Sample' has cyclomatic complexity 2");
    }

    [Fact]
    public async Task An_auto_property_holds_no_code_and_is_not_measured()
    {
        var diagnostics = await Analyze(
            """
            public class Sample
            {
                public int Count { get; init; }
            }
            """
        );

        diagnostics.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_property_with_an_accessor_body_is_measured()
    {
        var diagnostics = await Analyze(
            """
            public class Sample
            {
                private int count;

                public int Count
                {
                    get => count;
                    set
                    {
                        if (value < 0) return;
                        count = value;
                    }
                }
            }
            """
        );

        diagnostics.Single().GetMessage().ShouldBe("'Count' has cyclomatic complexity 2");
    }
}
