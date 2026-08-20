using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

public class SessionCommandHandlerRetryTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    [Fact]
    public async Task A_conflicting_save_is_retried_on_a_freshly_loaded_session_and_broadcast_once()
    {
        var reloaded = SessionFixtures.InPhase(Phase.Join, revision: 5);
        var repository = RepositoryReturning(
            SessionFixtures.InPhase(Phase.Join, revision: 4),
            reloaded
        );
        repository.ConflictingSaves = 1;
        var broadcaster = new RecordingBroadcaster();

        await HandlerOver(repository, broadcaster).HandleAsync(KnownSession, AdvanceOnePhase);

        repository.Loads.ShouldBe(2);
        repository.Saved.ShouldHaveSingleItem().ShouldBeSameAs(reloaded);
        reloaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        broadcaster.Broadcasts.ShouldHaveSingleItem().ShouldBeSameAs(reloaded);
    }

    [Fact]
    public async Task An_accepted_mutation_bumps_the_revision_exactly_once_despite_a_retry()
    {
        var repository = RepositoryReturning(
            SessionFixtures.InPhase(Phase.Join, revision: 4),
            SessionFixtures.InPhase(Phase.Join, revision: 5)
        );
        repository.ConflictingSaves = 1;

        await HandlerOver(repository, new RecordingBroadcaster())
            .HandleAsync(KnownSession, AdvanceOnePhase);

        repository.ExpectedRevisions.ShouldBe([4, 5]);
        repository.Saved.ShouldHaveSingleItem().Revision.ShouldBe(6);
    }

    [Fact]
    public async Task A_conflict_on_every_one_of_the_three_attempts_is_surfaced_to_the_caller()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));
        repository.ConflictingSaves = 3;
        var broadcaster = new RecordingBroadcaster();

        await Should.ThrowAsync<ConcurrencyConflictException>(
            HandlerOver(repository, broadcaster).HandleAsync(KnownSession, AdvanceOnePhase)
        );

        repository.Loads.ShouldBe(3);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_mutation_that_changes_nothing_is_neither_persisted_nor_retried()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Join, revision: 4)
        );
        repository.ConflictingSaves = 1;
        var broadcaster = new RecordingBroadcaster();

        await HandlerOver(repository, broadcaster).HandleAsync(KnownSession, _ => false);

        repository.Loads.ShouldBe(1);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
        (await repository.LoadAsync(KnownSession)).ShouldNotBeNull().Revision.ShouldBe(4);
    }

    [Fact]
    public async Task A_session_that_vanishes_before_the_retry_is_reported_as_unknown()
    {
        var repository = RepositoryReturning(SessionFixtures.InPhase(Phase.Join), null);
        repository.ConflictingSaves = 1;

        await Should.ThrowAsync<UnknownSessionException>(
            HandlerOver(repository, new RecordingBroadcaster())
                .HandleAsync(KnownSession, AdvanceOnePhase)
        );
    }

    private static bool AdvanceOnePhase(Session session)
    {
        session.AdvancePhase();

        return true;
    }

    private static SessionCommandHandler HandlerOver(
        FakeSessionRepository repository,
        RecordingBroadcaster broadcaster
    )
    {
        return new SessionCommandHandler(repository, broadcaster);
    }

    private static FakeSessionRepository RepositoryReturning(params Session?[] sessions)
    {
        var pending = new Queue<Session?>(sessions);

        return new FakeSessionRepository(pending.Dequeue);
    }
}
