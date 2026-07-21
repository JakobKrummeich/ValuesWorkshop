namespace ValuesWorkshop.Domain.Tests;

public class PresentationWalkTests
{
    [Fact]
    public void Initially_nothing_is_presented()
    {
        var walk = new PresentationWalk();

        Assert.Null(walk.PresentingGroup);
        Assert.Null(walk.PresentedValue);
    }
}
