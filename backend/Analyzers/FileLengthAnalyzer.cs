using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ValuesWorkshop.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class FileLengthAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "VW1002";
    private const int MaxLines = 200;

    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "File too long",
        "'{0}' has {1} lines (max {2})",
        "Maintainability",
        DiagnosticSeverity.Error,
        isEnabledByDefault: true
    );

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics =>
        ImmutableArray.Create(Rule);

    public override void Initialize(AnalysisContext context)
    {
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.EnableConcurrentExecution();
        context.RegisterSyntaxTreeAction(AnalyzeTree);
    }

    private static void AnalyzeTree(SyntaxTreeAnalysisContext context)
    {
        var text = context.Tree.GetText();
        var lineCount = text.Lines.Count;

        if (lineCount > MaxLines)
        {
            var fileName = System.IO.Path.GetFileName(context.Tree.FilePath);
            var diagnostic = Diagnostic.Create(
                Rule,
                Location.Create(context.Tree, text.Lines[0].Span),
                fileName,
                lineCount,
                MaxLines
            );
            context.ReportDiagnostic(diagnostic);
        }
    }
}
