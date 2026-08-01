using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application;

public sealed class SessionCommandHandler(ISessionRepository repository, IBroadcaster broadcaster)
{
    private const int MaximumAttempts = 3;

    public async Task HandleAsync(SessionIdentity sessionIdentity, Func<Session, bool> mutation)
    {
        for (var attemptsLeft = MaximumAttempts; ; attemptsLeft--)
        {
            try
            {
                var persisted = await ApplyOnceAsync(sessionIdentity, mutation);

                if (persisted is not null)
                {
                    await broadcaster.BroadcastSessionStateAsync(persisted);
                }

                return;
            }
            catch (ConcurrencyConflictException) when (attemptsLeft > 1) { }
        }
    }

    private async Task<Session?> ApplyOnceAsync(
        SessionIdentity sessionIdentity,
        Func<Session, bool> mutation
    )
    {
        var session =
            await repository.LoadAsync(sessionIdentity)
            ?? throw new UnknownSessionException(sessionIdentity);

        if (!mutation(session))
        {
            return null;
        }

        var expectedRevision = session.Revision;

        session.BumpRevision();

        await repository.SaveAsync(session, expectedRevision);

        return session;
    }
}
