using ValuesWorkshop.Application.Formation;

namespace ValuesWorkshop.Application.Tests;

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
}
