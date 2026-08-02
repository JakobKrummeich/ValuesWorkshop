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

    [Fact]
    public void Advancing_as_someone_other_than_the_facilitator_is_refused()
    {
        var session = SessionInPhase(Phase.Join);

        Should.Throw<NotAuthorizedException>(() =>
            session.AdvancePhase(
                new FacilitatorSubject("someone-else"),
                WorkshopContentSizes.NotConfigured
            )
        );

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.Join);
    }

    private static Session SessionInPhase(Phase phase)
    {
        return TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), phase);
    }
}
