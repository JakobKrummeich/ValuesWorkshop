using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class FacilitatorHub(
    ISessionRepository repository,
    IntentPipeline pipeline,
    WorkshopStateCache cache,
    SessionConnectionRegistry registry
) : Hub<IFacilitatorClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Facilitator(sessionIdentity)
        );
        registry.Add(sessionIdentity, Context.ConnectionId);

        await Clients.Caller.ReceiveWorkshopState(cache.StatesOf(session).Facilitator);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }

    public Task<IntentResult> AdvancePhase()
    {
        return pipeline.ExecuteAsync(
            HubSessionBinding.SessionIdentityOf(Context),
            session => { session.AdvancePhase(); return true; }
        );
    }
}
