namespace ValuesWorkshop.Domain.Tests;

public class SessionAdvancePhaseTests
{
    [Theory]
    [InlineData(Phase.Join, Phase.Quiz)]
    [InlineData(Phase.Quiz, Phase.ValueSelection)]
    [InlineData(Phase.ValueSelection, Phase.SelectionResults)]
    [InlineData(Phase.SelectionResults, Phase.GroupFormation)]
    [InlineData(Phase.GroupFormation, Phase.GroupWork)]
    [InlineData(Phase.GroupWork, Phase.ValuePresentation)]
    [InlineData(Phase.ValuePresentation, Phase.FinalVoting)]
    [InlineData(Phase.FinalVoting, Phase.FinalPresentation)]
    public void Advancing_moves_to_the_next_phase(Phase current, Phase expected)
    {
        var session = SessionInPhase(current);

        session.AdvancePhase();

        session.PhaseProgress.CurrentPhase.ShouldBe(expected);
    }

    [Fact]
    public void Advancing_past_the_last_phase_is_refused()
    {
        var session = SessionInPhase(Phase.FinalPresentation);

        Should.Throw<InvariantViolationException>(session.AdvancePhase);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalPresentation);
    }

    private static Session SessionInPhase(Phase phase)
    {
        return Session.Restore(
            new SessionIdentity(Guid.NewGuid()),
            Roster.Restore([]),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
    }
}
