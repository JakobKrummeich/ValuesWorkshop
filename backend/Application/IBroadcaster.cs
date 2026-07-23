using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application;

public interface IBroadcaster
{
    Task BroadcastSessionStateAsync(SessionIdentity sessionIdentity, Session session);
}
