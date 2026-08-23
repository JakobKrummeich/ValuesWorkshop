namespace ValuesWorkshop.Domain.Tests;

public class GroupFormationWindowTests
{
    [Fact]
    public void A_window_that_lasts_no_time_is_refused()
    {
        Should.Throw<InvalidOperationException>(() => new GroupFormationWindow(TimeSpan.Zero));
    }
}
