using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application;

public sealed class SessionCommandHandler(ISessionRepository repository, IBroadcaster broadcaster)
{
    public async Task HandleAsync(SessionIdentity sessionIdentity, Action<Session> mutation)
    {
        var session = await repository.LoadAsync(sessionIdentity) ?? new Session(sessionIdentity);

        mutation(session);

        await repository.SaveAsync(session);

        await broadcaster.BroadcastSessionStateAsync(session);
    }
}
