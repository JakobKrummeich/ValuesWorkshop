using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ValuesWorkshop.Analyzers.Tests;

public static class AnalyzerRun
{
    public const string ProductionAssemblyName = "Sample";
    public const string TestAssemblyName = "Sample.Tests";

    public static async Task<ImmutableArray<Diagnostic>> DiagnosticsOf(
        DiagnosticAnalyzer analyzer,
        string source,
        string assemblyName = ProductionAssemblyName
    )
    {
        var compilation = CSharpCompilation.Create(
            assemblyName,
            [CSharpSyntaxTree.ParseText(source, path: "Sample.cs")],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)
        );
        return await compilation.WithAnalyzers([analyzer]).GetAnalyzerDiagnosticsAsync();
    }
}
