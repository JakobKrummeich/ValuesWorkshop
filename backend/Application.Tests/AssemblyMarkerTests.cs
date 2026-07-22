namespace ValuesWorkshop.Application.Tests;

public class AssemblyMarkerTests
{
    [Fact]
    public void Application_assembly_marker_exists()
    {
        typeof(AssemblyMarker).Assembly.ShouldNotBeNull();
    }
}
