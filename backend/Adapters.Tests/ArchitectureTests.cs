namespace ValuesWorkshop.Adapters.Tests;

public class ArchitectureTests
{
    // Until Task 4: GetReferencedAssemblies() lists only *used* refs, so an
    // illegal ProjectReference stays invisible until first use. Task 4 replaces
    // these tests with ArchUnitNET rules; do not keep this mechanism.
    private static readonly string[] Allowed =
        ["ValuesWorkshop.Domain", "ValuesWorkshop.Application"];

    [Fact]
    public void Adapters_references_at_most_Application_and_Domain()
    {
        var refs = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Where(a => a.Name!.StartsWith("ValuesWorkshop."))
            .Select(a => a.Name);

        Assert.All(refs, name => Assert.Contains(name, Allowed));
    }
}
