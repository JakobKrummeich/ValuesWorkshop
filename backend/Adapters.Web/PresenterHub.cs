using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[AllowAnonymous]
public sealed class PresenterHub(ISessionRepository repository) : Hub<IPresenterClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Presenter(sessionIdentity)
        );

        await Clients.Caller.ReceiveWorkshopState(
            PresenterWorkshopStateMapper.Map(session, session.Revision)
        );
    }
}
