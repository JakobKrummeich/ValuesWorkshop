using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

internal sealed class FakeSessionRepository(Func<Session?> load) : ISessionRepository
{
    internal List<Session> Saved { get; } = [];
    internal List<long> ExpectedRevisions { get; } = [];
    internal int Loads { get; private set; }
    internal int ConflictingSaves { get; set; }

    internal static FakeSessionRepository Holding(Session session)
    {
        return new FakeSessionRepository(() => session);
    }

    internal static FakeSessionRepository Empty()
    {
        return new FakeSessionRepository(() => null);
    }

    public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        Loads++;

        return Task.FromResult(load());
    }

    public Task SaveAsync(Session session, long expectedRevision)
    {
        ExpectedRevisions.Add(expectedRevision);

        if (ConflictingSaves > 0)
        {
            ConflictingSaves--;

            throw new ConcurrencyConflictException(
                session.Identity,
                expectedRevision,
                storedRevision: null
            );
        }

        Saved.Add(session);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        return Task.FromResult<IReadOnlyList<Session>>(load() is { } session ? [session] : []);
    }
}
