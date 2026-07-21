namespace ValuesWorkshop.Domain.Tests;

public class VotingRoundsTests
{
    [Fact]
    public void Initially_no_round_is_open_and_no_winners_exist()
    {
        var voting = new VotingRounds();

        Assert.False(voting.RoundOpen);
        Assert.Empty(voting.WinningValues);
    }
}
