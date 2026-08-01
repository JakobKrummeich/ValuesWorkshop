using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class InMemorySessionRepositoryTests
{
    [Fact]
    public async Task A_save_of_a_session_that_was_never_created_conflicts()
    {
        var repository = new InMemorySessionRepository();
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            repository.SaveAsync(session, expectedRevision: 0)
        );

        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_save_that_expects_another_revision_than_the_stored_one_conflicts()
    {
        var repository = new InMemorySessionRepository();
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));
        await repository.CreateAsync(session);

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            repository.SaveAsync(session, expectedRevision: 7)
        );

        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_save_that_expects_the_stored_revision_is_recorded()
    {
        var repository = new InMemorySessionRepository();
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));
        await repository.CreateAsync(session);

        session.BumpRevision();
        await repository.SaveAsync(session, expectedRevision: 0);

        repository.Saved.ShouldHaveSingleItem().Revision.ShouldBe(1);
        (await repository.LoadAsync(session.Identity)).ShouldNotBeNull().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task Consecutive_saves_each_expect_the_revision_left_by_the_previous_one()
    {
        var repository = new InMemorySessionRepository();
        var session = TestSessions.Open(new SessionIdentity(Guid.NewGuid()));
        await repository.CreateAsync(session);

        session.BumpRevision();
        await repository.SaveAsync(session, expectedRevision: 0);
        session.BumpRevision();
        await repository.SaveAsync(session, expectedRevision: 1);

        repository.Saved.Count.ShouldBe(2);
    }
}
