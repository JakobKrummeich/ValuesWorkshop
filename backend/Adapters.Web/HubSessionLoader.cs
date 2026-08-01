using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

internal static class HubSessionLoader
{
    internal static async Task<Session> RequiredAsync(
        ISessionRepository repository,
        SessionIdentity sessionIdentity
    )
    {
        return await repository.LoadAsync(sessionIdentity)
            ?? throw new HubException($"No session exists with identity {sessionIdentity.Value}.");
    }
}
