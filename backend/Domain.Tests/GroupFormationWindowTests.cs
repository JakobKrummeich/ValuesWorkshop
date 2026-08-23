namespace ValuesWorkshop.Domain.Tests;

public class GroupFormationWindowTests
{
    private static readonly GroupFormationWindow Window = new(TimeSpan.FromSeconds(3));

    [Fact]
    public void A_window_that_lasts_no_time_is_refused()
    {
        Should.Throw<InvalidOperationException>(() => new GroupFormationWindow(TimeSpan.Zero));
    }

    [Fact]
    public void A_window_that_has_just_opened_stands_at_no_progress()
    {
        Window.ProgressAfter(TimeSpan.Zero).Value.ShouldBe(0);
    }

    [Fact]
    public void Half_the_window_elapsed_is_half_the_progress()
    {
        Window.ProgressAfter(TimeSpan.FromSeconds(1.5)).Value.ShouldBe(0.5);
    }

    [Fact]
    public void Progress_stops_at_a_full_bar_once_the_window_is_past()
    {
        Window.ProgressAfter(TimeSpan.FromSeconds(4)).Value.ShouldBe(1);
    }

    [Fact]
    public void Time_running_backwards_still_reads_as_no_progress()
    {
        Window.ProgressAfter(TimeSpan.FromSeconds(-1)).Value.ShouldBe(0);
    }
}
