namespace ValuesWorkshop.Adapters.Tests;

public class ArchitectureTests
{
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
