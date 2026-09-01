namespace ValuesWorkshop.Domain.Tests;

public class WinnerRevealTests
{
    [Fact]
    public void Initially_no_winner_is_revealed_and_the_reveal_is_not_concluded()
    {
        var reveal = new WinnerReveal();

        reveal.RevealedCount.ShouldBe(0);
        reveal.IsConcluded.ShouldBeFalse();
    }

    [Fact]
    public void Revealing_advances_one_winner_at_a_time()
    {
        var reveal = new WinnerReveal();

        reveal.RevealNext();
        reveal.RevealNext();

        reveal.RevealedCount.ShouldBe(2);
        reveal.IsConcluded.ShouldBeFalse();
    }

    [Fact]
    public void Revealing_the_last_winner_concludes_the_workshop()
    {
        var reveal = WinnerReveal.Restore(VotingRounds.RequiredWinningValueCount - 1);

        reveal.RevealNext();

        reveal.RevealedCount.ShouldBe(VotingRounds.RequiredWinningValueCount);
        reveal.IsConcluded.ShouldBeTrue();
    }

    [Fact]
    public void A_reveal_beyond_the_last_winner_is_an_invariant_violation()
    {
        var reveal = WinnerReveal.Restore(VotingRounds.RequiredWinningValueCount);

        Should
            .Throw<InvariantViolationException>(() => reveal.RevealNext())
            .Message.ShouldBe("Every winner has been revealed; nothing is left to reveal.");
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(3, false)]
    [InlineData(5, true)]
    public void Restore_returns_to_the_persisted_reveal_position(int revealedCount, bool concluded)
    {
        var reveal = WinnerReveal.Restore(revealedCount);

        reveal.RevealedCount.ShouldBe(revealedCount);
        reveal.IsConcluded.ShouldBe(concluded);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(6)]
    [InlineData(100)]
    public void Restore_rejects_an_out_of_range_revealed_count(int revealedCount)
    {
        Should.Throw<ArgumentOutOfRangeException>(() => WinnerReveal.Restore(revealedCount));
    }
}
