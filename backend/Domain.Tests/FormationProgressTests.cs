namespace ValuesWorkshop.Domain.Tests;

public class FormationProgressTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(0.5)]
    [InlineData(1)]
    public void A_fraction_of_the_window_is_progress(double value)
    {
        new FormationProgress(value).Value.ShouldBe(value);
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(1.01)]
    [InlineData(double.NaN)]
    public void A_value_outside_the_bar_is_refused(double value)
    {
        Should.Throw<InvalidOperationException>(() => new FormationProgress(value));
    }

    [Fact]
    public void A_formation_nobody_has_started_stands_at_no_progress()
    {
        FormationProgress.NotStarted.Value.ShouldBe(0);
    }

    [Fact]
    public void A_full_bar_means_the_window_is_over()
    {
        new FormationProgress(1).IsWindowOver.ShouldBeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(0.999)]
    public void The_window_is_not_over_while_the_bar_is_still_moving(double value)
    {
        new FormationProgress(value).IsWindowOver.ShouldBeFalse();
    }
}
