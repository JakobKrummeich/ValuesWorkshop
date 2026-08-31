namespace ValuesWorkshop.Domain.Tests;

public class FinalPresentationTests
{
    [Fact]
    public void The_facilitator_reveals_the_next_winner()
    {
        var session = SessionConcluding(Phase.FinalPresentation, revealedCount: 0);

        FinalPresentation.RevealNextValue(session);

        session.Reveal.RevealedCount.ShouldBe(1);
    }

    [Fact]
    public void A_winner_is_revealed_only_during_the_final_presentation()
    {
        var session = SessionConcluding(Phase.FinalVoting, revealedCount: 0);

        Should.Throw<WrongPhaseException>(() => FinalPresentation.RevealNextValue(session));
    }

    [Fact]
    public void A_reveal_beyond_the_last_winner_is_an_invariant_violation()
    {
        var session = SessionConcluding(
            Phase.FinalPresentation,
            revealedCount: VotingRounds.RequiredWinningValueCount
        );

        Should.Throw<InvariantViolationException>(() => FinalPresentation.RevealNextValue(session));
    }

    private static Session SessionConcluding(Phase phase, int revealedCount)
    {
        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            phase,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            ),
            reveal: WinnerReveal.Restore(revealedCount)
        );
    }
}
