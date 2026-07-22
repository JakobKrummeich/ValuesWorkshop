namespace ValuesWorkshop.Adapters.Tests;

public class AssemblyMarkerTests
{
    [Fact]
    public void Adapters_assembly_marker_exists()
    {
        typeof(AssemblyMarker).Assembly.ShouldNotBeNull();
    }
}
