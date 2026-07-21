namespace ValuesWorkshop.Domain.Tests;

public class ArchitectureTests
{
    // Until Task 4: GetReferencedAssemblies() lists only *used* refs, so an
    // illegal ProjectReference stays invisible until first use. Task 4 replaces
    // these tests with ArchUnitNET rules; do not keep this mechanism.
    [Fact]
    public void Domain_references_no_other_ValuesWorkshop_layer()
    {
        var refs = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Where(a => a.Name!.StartsWith("ValuesWorkshop."));

        Assert.Empty(refs);
    }
}
