namespace ValuesWorkshop.Host.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Host_assembly_is_the_composition_root()
    {
        Assert.Equal("ValuesWorkshop.Host", typeof(AssemblyMarker).Assembly.GetName().Name);
    }
}
