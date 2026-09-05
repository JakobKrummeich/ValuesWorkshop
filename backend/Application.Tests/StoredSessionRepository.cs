using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

internal sealed class StoredSessionRepository(Session session) : ISessionRepository
{
    internal Session Stored { get; private set; } = session;

    public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
    {
        return Task.FromResult<Session?>(SessionSnapshots.Of(Stored));
    }

    public Task<IReadOnlyList<Session>> LoadAllAsync()
    {
        return Task.FromResult<IReadOnlyList<Session>>([SessionSnapshots.Of(Stored)]);
    }

    public Task CreateAsync(Session createdSession)
    {
        throw new ConcurrencyConflictException(
            createdSession.Identity,
            expectedRevision: 0,
            Stored.Revision
        );
    }

    public Task SaveAsync(Session savedSession, long expectedRevision)
    {
        if (expectedRevision != Stored.Revision)
        {
            throw new ConcurrencyConflictException(
                savedSession.Identity,
                expectedRevision,
                Stored.Revision
            );
        }

        Stored = savedSession;

        return Task.CompletedTask;
    }
}
