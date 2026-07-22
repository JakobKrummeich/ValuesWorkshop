namespace ValuesWorkshop.Application.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Application_assembly_marker_exists()
    {
        typeof(AssemblyMarker).Assembly.ShouldNotBeNull();
    }
}
