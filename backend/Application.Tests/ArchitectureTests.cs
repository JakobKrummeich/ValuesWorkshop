namespace ValuesWorkshop.Application.Tests;

public class ArchitectureTests
{
    // Until Task 4: GetReferencedAssemblies() lists only *used* refs, so an
    // illegal ProjectReference stays invisible until first use. Task 4 replaces
    // these tests with ArchUnitNET rules; do not keep this mechanism.
    [Fact]
    public void Application_references_at_most_Domain()
    {
        var refs = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Where(a => a.Name!.StartsWith("ValuesWorkshop."))
            .Select(a => a.Name);

        Assert.All(refs, name => Assert.Equal("ValuesWorkshop.Domain", name));
    }
}
