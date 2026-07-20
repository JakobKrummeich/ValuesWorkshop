namespace ValuesWorkshop.Application.Tests;

public class ArchitectureTests
{
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
