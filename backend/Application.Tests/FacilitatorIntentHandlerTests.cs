using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorIntentHandlerTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task The_facilitator_advances_the_phase()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.Facilitator));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        broadcaster
            .Broadcasts.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
    }

    [Fact]
    public async Task Another_subject_may_not_advance_the_phase()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));

        var result = await HandlerOver(repository)
            .HandleAsync(
                new AdvancePhaseCommand(KnownSession, new FacilitatorSubject("someone-else"))
            );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
        (await repository.LoadAsync(KnownSession))
            .ShouldNotBeNull()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.Join);
    }

    [Fact]
    public async Task An_advance_blocked_by_an_exit_guard_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.GroupWork,
                formation: SessionFixtures.TwoGroups(),
                revision: 4
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.Facilitator));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();

        var stored = (await repository.LoadAsync(KnownSession)).ShouldNotBeNull();
        stored.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupWork);
        stored.Revision.ShouldBe(4);
    }

    [Fact]
    public async Task An_advance_past_the_last_phase_stays_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalPresentation)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.Facilitator));

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    private FacilitatorIntentHandler HandlerOver(FakeSessionRepository repository)
    {
        return new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            WorkshopContentSizes.Placeholder
        );
    }
}
