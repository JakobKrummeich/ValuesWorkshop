namespace ValuesWorkshop.Domain.Tests;

public class SessionAdvancePhaseTests
{
    [Theory]
    [InlineData(Phase.Join, Phase.Quiz)]
    [InlineData(Phase.ValueSelection, Phase.SelectionResults)]
    [InlineData(Phase.SelectionResults, Phase.GroupFormation)]
    [InlineData(Phase.GroupFormation, Phase.GroupWork)]
    public void Advancing_moves_to_the_next_phase(Phase current, Phase expected)
    {
        var session = SessionInPhase(current);

        TestSessions.AdvanceToNextPhase(session);

        session.PhaseProgress.CurrentPhase.ShouldBe(expected);
    }

    [Fact]
    public void Advancing_past_the_last_phase_is_refused()
    {
        var session = SessionInPhase(Phase.FinalPresentation);

        Should.Throw<InvariantViolationException>(() => TestSessions.AdvanceToNextPhase(session));

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.FinalPresentation);
    }

    private static Session SessionInPhase(Phase phase)
    {
        return TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), phase);
    }
}
