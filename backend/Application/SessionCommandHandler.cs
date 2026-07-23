using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application;

public sealed class SessionCommandHandler(ISessionRepository repository, IBroadcaster broadcaster)
{
    public async Task HandleAsync(
        SessionIdentity sessionIdentity,
        Action<Session> mutation,
        Session? session = null
    )
    {
        session ??= await repository.LoadAsync(sessionIdentity) ?? new Session();

        mutation(session);

        await repository.SaveAsync(sessionIdentity, session);

        await broadcaster.BroadcastSessionStateAsync(sessionIdentity, session);
    }
}
