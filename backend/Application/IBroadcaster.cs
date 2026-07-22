using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public interface IBroadcaster
{
    Task BroadcastSessionStateAsync(string sessionIdentity, Session session);
}
