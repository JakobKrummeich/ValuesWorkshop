using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

public class IntentPipelineTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    [Fact]
    public async Task An_accepted_intent_mutates_persists_and_then_broadcasts()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.Quiz));
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(KnownSession, session => { session.AdvancePhase(); return true; });

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
        broadcaster
            .Broadcasts.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
    }

    [Fact]
    public async Task An_accepted_intent_bumps_the_revision_before_it_is_persisted()
    {
        var repository = RepositoryWith(SessionFixtures.InPhase(Phase.Quiz, revision: 4));
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        await pipeline.ExecuteAsync(KnownSession, session => { session.AdvancePhase(); return true; });

        repository.Saved.ShouldHaveSingleItem().Revision.ShouldBe(5);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(5);
    }

    [Fact]
    public async Task A_rejected_intent_leaves_the_revision_untouched()
    {
        var session = SessionFixtures.InPhase(Phase.FinalPresentation, revision: 4);
        var pipeline = PipelineOver(RepositoryWith(session), new RecordingBroadcaster());

        await pipeline.ExecuteAsync(KnownSession, mutatedSession => { mutatedSession.AdvancePhase(); return true; });

        session.Revision.ShouldBe(4);
    }

    [Fact]
    public async Task An_intent_for_an_unknown_session_changes_nothing()
    {
        var repository = new FakeSessionRepository();
        var broadcaster = new RecordingBroadcaster();
        var pipeline = PipelineOver(repository, broadcaster);

        var result = await pipeline.ExecuteAsync(KnownSession, session => { session.AdvancePhase(); return true; });

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

        var result = await pipeline.ExecuteAsync(KnownSession, session => { session.AdvancePhase(); return true; });

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
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
        return new FakeSessionRepository { Stored = session };
    }

    private sealed class FakeSessionRepository : ISessionRepository
    {
        internal Session? Stored { get; set; }
        internal List<Session> Saved { get; } = [];

        public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
        {
            return Task.FromResult(Stored);
        }

        public Task SaveAsync(Session session)
        {
            Saved.Add(session);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<Session>> LoadAllAsync()
        {
            return Task.FromResult<IReadOnlyList<Session>>(Stored is null ? [] : [Stored]);
        }
    }

    private sealed class RecordingBroadcaster : IBroadcaster
    {
        internal List<Session> Broadcasts { get; } = [];

        public Task BroadcastSessionStateAsync(Session session)
        {
            Broadcasts.Add(session);
            return Task.CompletedTask;
        }
    }
}
