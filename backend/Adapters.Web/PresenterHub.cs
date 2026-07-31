using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[AllowAnonymous]
public sealed class PresenterHub(
    ISessionRepository repository,
    WorkshopStateCache cache,
    SessionConnectionRegistry registry
) : Hub<IPresenterClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Presenter(sessionIdentity)
        );
        registry.Add(sessionIdentity, Context.ConnectionId);

        await Clients.Caller.ReceiveWorkshopState(cache.StatesOf(session).Presenter);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }
}
