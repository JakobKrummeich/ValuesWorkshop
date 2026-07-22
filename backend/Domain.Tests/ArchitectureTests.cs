using ArchUnitNET.Domain;
using ArchUnitNET.Fluent;
using ArchUnitNET.Fluent.Slices;
using ArchUnitNET.Loader;
using ArchUnitNET.xUnit;
using static ArchUnitNET.Fluent.ArchRuleDefinition;

namespace ValuesWorkshop.Domain.Tests;

public class ArchitectureTests
{
    private static readonly Architecture Arch = new ArchLoader()
        .LoadAssemblies(
            typeof(ValuesWorkshop.Domain.AssemblyMarker).Assembly,
            typeof(ValuesWorkshop.Application.AssemblyMarker).Assembly,
            typeof(ValuesWorkshop.Adapters.AssemblyMarker).Assembly,
            typeof(ValuesWorkshop.Host.AssemblyMarker).Assembly
        )
        .Build();

    private static readonly IObjectProvider<IType> DomainLayer = Types()
        .That()
        .ResideInAssembly(typeof(ValuesWorkshop.Domain.AssemblyMarker).Assembly)
        .As("Domain");

    private static readonly IObjectProvider<IType> ApplicationLayer = Types()
        .That()
        .ResideInAssembly(typeof(ValuesWorkshop.Application.AssemblyMarker).Assembly)
        .As("Application");

    private static readonly IObjectProvider<IType> AdaptersLayer = Types()
        .That()
        .ResideInAssembly(typeof(ValuesWorkshop.Adapters.AssemblyMarker).Assembly)
        .As("Adapters");

    private static readonly IObjectProvider<IType> HostLayer = Types()
        .That()
        .ResideInAssembly(typeof(ValuesWorkshop.Host.AssemblyMarker).Assembly)
        .As("Host");

    [Fact]
    public void Domain_depends_on_no_other_ValuesWorkshop_layer()
    {
        Types()
            .That()
            .Are(DomainLayer)
            .Should()
            .NotDependOnAny(ApplicationLayer)
            .AndShould()
            .NotDependOnAny(AdaptersLayer)
            .AndShould()
            .NotDependOnAny(HostLayer)
            .Check(Arch);
    }

    [Fact]
    public void Application_depends_only_on_Domain()
    {
        Types()
            .That()
            .Are(ApplicationLayer)
            .Should()
            .NotDependOnAny(AdaptersLayer)
            .AndShould()
            .NotDependOnAny(HostLayer)
            .Check(Arch);
    }

    [Fact]
    public void Adapters_depends_only_on_Application_and_Domain()
    {
        Types().That().Are(AdaptersLayer).Should().NotDependOnAny(HostLayer).Check(Arch);
    }

    [Fact]
    public void No_class_has_more_than_12_public_methods()
    {
        var allClasses = Classes().That().ResideInNamespace("ValuesWorkshop").GetObjects(Arch);

        foreach (var cls in allClasses)
        {
            var publicMethodCount = cls
                .Members.OfType<ArchUnitNET.Domain.MethodMember>()
                .Count(m =>
                    m.Visibility == Visibility.Public
                    && !m.Name.StartsWith("get_", StringComparison.Ordinal)
                    && !m.Name.StartsWith("set_", StringComparison.Ordinal)
                );

            publicMethodCount.ShouldBeLessThanOrEqualTo(
                12,
                $"{cls.FullName} has {publicMethodCount} public methods (max 12)"
            );
        }
    }

    [Fact]
    public void No_cyclic_dependencies_between_assemblies()
    {
        ArchRuleAssert.CheckRule(
            Arch,
            SliceRuleDefinition.Slices().Matching("ValuesWorkshop.(*)").Should().BeFreeOfCycles()
        );
    }
}
