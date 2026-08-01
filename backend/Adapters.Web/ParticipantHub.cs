using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class ParticipantHub(
    ISessionRepository repository,
    IntentPipeline pipeline,
    WorkshopStateCache cache,
    IRandomness randomness,
    SessionConnectionRegistry registry
) : Hub<IParticipantClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Participant(sessionIdentity, participantId)
        );
        registry.Add(sessionIdentity, Context.ConnectionId);

        var joinResult = await pipeline.ExecuteAsync(
            sessionIdentity,
            session => session.Join(participantId, randomness)
        );

        if (!joinResult.IsAccepted)
        {
            throw new HubException(joinResult.Detail);
        }

        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);
        var states = cache.StatesOf(session);
        var participantState = states.Participants.TryGetValue(participantId, out var cached)
            ? cached
            : ParticipantWorkshopStateMapper.MapFor(session, participantId, session.Revision);
        await Clients.Caller.ReceiveWorkshopState(participantState);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }
}
