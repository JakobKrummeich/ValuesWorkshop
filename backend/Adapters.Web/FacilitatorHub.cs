using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class FacilitatorHub(ISessionRepository repository, IntentPipeline pipeline)
    : Hub<IFacilitatorClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Facilitator(sessionIdentity)
        );

        await Clients.Caller.ReceiveWorkshopState(
            FacilitatorWorkshopStateMapper.Map(session, session.Revision)
        );
    }

    public Task<IntentResult> AdvancePhase()
    {
        return pipeline.ExecuteAsync(
            HubSessionBinding.SessionIdentityOf(Context),
            session => session.AdvancePhase()
        );
    }
}
