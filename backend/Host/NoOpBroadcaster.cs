using ValuesWorkshop.Application;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Host;

internal sealed class NoOpBroadcaster : IBroadcaster
{
    public Task BroadcastSessionStateAsync(Session session)
    {
        return Task.CompletedTask;
    }
}
