using ValuesWorkshop.Application;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class SignalRBroadcaster(WorkshopStateCache cache, RoleStateDispatcher dispatcher)
    : IBroadcaster
{
    public Task BroadcastSessionStateAsync(Session session)
    {
        return dispatcher.SendAsync(session.Identity, cache.StatesOf(session));
    }
}
