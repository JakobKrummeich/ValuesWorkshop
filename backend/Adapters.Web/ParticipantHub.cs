using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class ParticipantHub(
    IntentPipeline pipeline,
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
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }
}
