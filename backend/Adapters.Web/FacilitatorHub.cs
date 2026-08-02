using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class FacilitatorHub(
    ISessionRepository repository,
    FacilitatorIntentHandler intentHandler,
    WorkshopStateCache cache,
    SessionConnectionRegistry registry
) : Hub<IFacilitatorClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        RequireFacilitator(session);

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

    private FacilitatorSubject CallerFacilitator()
    {
        return new FacilitatorSubject(CallerSubject.Of(Context.User) ?? string.Empty);
    }

    private void RequireFacilitator(Session session)
    {
        var caller = CallerFacilitator();

        if (string.IsNullOrWhiteSpace(caller.Value) || !session.IsFacilitatedBy(caller))
        {
            throw new HubException("The caller is not the facilitator of this session.");
        }
    }

    public Task<IntentResult> AdvancePhase()
    {
        return intentHandler.HandleAsync(
            new AdvancePhaseCommand(
                HubSessionBinding.SessionIdentityOf(Context),
                CallerFacilitator()
            )
        );
    }
}
