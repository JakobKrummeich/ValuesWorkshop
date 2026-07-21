namespace ValuesWorkshop.Host.Tests;

public class ArchitectureTests
{
    [Fact]
    public void Host_is_the_executable_composition_root()
    {
        // Host is the only runnable assembly; every other layer is a library.
        Assert.NotNull(typeof(AssemblyMarker).Assembly.EntryPoint);
    }
}
