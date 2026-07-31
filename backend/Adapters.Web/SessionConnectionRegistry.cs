using System.Collections.Concurrent;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class SessionConnectionRegistry
{
    private readonly ConcurrentDictionary<string, SessionIdentity> sessionByConnection = new();

    public void Add(SessionIdentity sessionIdentity, string connectionId)
    {
        sessionByConnection[connectionId] = sessionIdentity;
    }

    public void Remove(string connectionId)
    {
        sessionByConnection.TryRemove(connectionId, out _);
    }

    public IReadOnlyCollection<SessionIdentity> ConnectedSessions()
    {
        return sessionByConnection.Values.Distinct().ToList();
    }
}
