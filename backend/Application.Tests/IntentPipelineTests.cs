using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class IntentPipelineTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    [Fact]
    public async Task An_accepted_intent_mutates_persists_and_then_broadcasts()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.Join));
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(
            KnownSession,
            session =>
            {
                TestSessions.AdvanceToNextPhase(session);
                return true;
            }
        );

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        broadcaster
            .Broadcasts.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
    }

    [Fact]
    public async Task An_accepted_intent_bumps_the_revision_before_it_is_persisted()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.Join, revision: 4));
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        await pipeline.ExecuteAsync(
            KnownSession,
            session =>
            {
                TestSessions.AdvanceToNextPhase(session);
                return true;
            }
        );

        repository.Saved.ShouldHaveSingleItem().Revision.ShouldBe(5);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(5);
    }

    [Fact]
    public async Task A_rejected_intent_leaves_the_revision_untouched()
    {
        var repository = RepositoryWith(
            SessionFixtures.InPhase(Phase.FinalPresentation, revision: 4)
        );
        var pipeline = PipelineOver(repository, new RecordingBroadcaster());

        await pipeline.ExecuteAsync(
            KnownSession,
            mutatedSession =>
            {
                TestSessions.AdvanceToNextPhase(mutatedSession);
                return true;
            }
        );

        repository.Saved.ShouldBeEmpty();
        (await repository.LoadAsync(KnownSession)).ShouldNotBeNull().Revision.ShouldBe(4);
    }

    [Fact]
    public async Task An_intent_for_an_unknown_session_changes_nothing()
    {
        var repository = FakeSessionRepository.Empty();
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(
            KnownSession,
            session =>
            {
                TestSessions.AdvanceToNextPhase(session);
                return true;
            }
        );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.UnknownSession);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_intent_refused_by_an_invariant_persists_nothing_and_broadcasts_nothing()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.FinalPresentation));
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(
            KnownSession,
            session =>
            {
                TestSessions.AdvanceToNextPhase(session);
                return true;
            }
        );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_intent_that_keeps_conflicting_is_rejected_as_a_concurrency_conflict()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.Join));
        repository.ConflictingSaves = 3;
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(
            KnownSession,
            session =>
            {
                TestSessions.AdvanceToNextPhase(session);
                return true;
            }
        );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.ConcurrencyConflict);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    private static IntentPipeline PipelineOver(
        FakeSessionRepository repository,
        RecordingBroadcaster broadcaster
    )
    {
        return new IntentPipeline(new SessionCommandHandler(repository, broadcaster));
    }

    private static FakeSessionRepository RepositoryWith(Session session)
    {
        return FakeSessionRepository.Holding(session);
    }
}
