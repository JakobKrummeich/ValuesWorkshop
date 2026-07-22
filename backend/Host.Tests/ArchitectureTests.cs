namespace ValuesWorkshop.Host.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Host_is_the_executable_composition_root()
    {
        typeof(AssemblyMarker).Assembly.EntryPoint.ShouldNotBeNull();
    }
}
