using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ValuesWorkshop.Analyzers;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class CyclomaticComplexityAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "VW1001";
    private const int Threshold = 7;

    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "Method too complex",
        "'{0}' has cyclomatic complexity {1} (max {2})",
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
        context.RegisterSyntaxNodeAction(AnalyzeMethod, SyntaxKind.MethodDeclaration);
        context.RegisterSyntaxNodeAction(AnalyzeMethod, SyntaxKind.ConstructorDeclaration);
        context.RegisterSyntaxNodeAction(AnalyzeMethod, SyntaxKind.PropertyDeclaration);
    }

    private static void AnalyzeMethod(SyntaxNodeAnalysisContext context)
    {
        var complexity = 1;
        SyntaxNode? body;
        string name;

        switch (context.Node)
        {
            case MethodDeclarationSyntax method:
                name = method.Identifier.Text;
                body = (SyntaxNode?)method.Body ?? method.ExpressionBody;
                break;
            case ConstructorDeclarationSyntax ctor:
                name = ctor.Identifier.Text;
                body = (SyntaxNode?)ctor.Body ?? ctor.ExpressionBody;
                break;
            case PropertyDeclarationSyntax prop:
                if (prop.ExpressionBody == null && prop.AccessorList == null)
                    return;
                name = prop.Identifier.Text;
                body = (SyntaxNode?)prop.ExpressionBody ?? prop.AccessorList;
                break;
            default:
                return;
        }

        if (body == null)
            return;

        foreach (var node in body.DescendantNodesAndSelf())
        {
            switch (node.Kind())
            {
                case SyntaxKind.IfStatement:
                case SyntaxKind.CaseSwitchLabel:
                case SyntaxKind.CasePatternSwitchLabel:
                case SyntaxKind.ForStatement:
                case SyntaxKind.ForEachStatement:
                case SyntaxKind.WhileStatement:
                case SyntaxKind.DoStatement:
                case SyntaxKind.CatchClause:
                case SyntaxKind.ConditionalExpression:
                case SyntaxKind.CoalesceExpression:
                case SyntaxKind.LogicalAndExpression:
                case SyntaxKind.LogicalOrExpression:
                case SyntaxKind.SwitchExpressionArm:
                    complexity++;
                    break;
            }
        }

        if (complexity > Threshold)
        {
            var diagnostic = Diagnostic.Create(
                Rule,
                context.Node.GetLocation(),
                name,
                complexity,
                Threshold
            );
            context.ReportDiagnostic(diagnostic);
        }
    }
}
