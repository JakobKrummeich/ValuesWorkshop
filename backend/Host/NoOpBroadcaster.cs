using ValuesWorkshop.Application;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

internal sealed class NoOpBroadcaster : IBroadcaster
{
    public Task BroadcastSessionStateAsync(SessionIdentity sessionIdentity, Session session)
    {
        return Task.CompletedTask;
    }
}
