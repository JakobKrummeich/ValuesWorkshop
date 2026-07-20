namespace ValuesWorkshop.Domain.Tests;

public class SelectionRoundTests
{
    [Fact]
    public void Initially_nobody_submitted_and_no_top_values_exist()
    {
        var round = new SelectionRound();

        Assert.Empty(round.SubmittedBy);
        Assert.Empty(round.TopValues);
    }
}
