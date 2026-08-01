using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application;

public sealed class SessionCommandHandler(ISessionRepository repository, IBroadcaster broadcaster)
{
    public async Task HandleAsync(SessionIdentity sessionIdentity, Func<Session, bool> mutation)
    {
        var session =
            await repository.LoadAsync(sessionIdentity)
            ?? throw new UnknownSessionException(sessionIdentity);

        if (!mutation(session))
        {
            return;
        }

        session.BumpRevision();

        await repository.SaveAsync(session);

        await broadcaster.BroadcastSessionStateAsync(session);
    }
}
