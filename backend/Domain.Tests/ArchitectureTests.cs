namespace ValuesWorkshop.Domain.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Domain_references_no_other_ValuesWorkshop_layer()
    {
        var refs = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Where(a => a.Name!.StartsWith("ValuesWorkshop."));

        Assert.Empty(refs);
    }
}
