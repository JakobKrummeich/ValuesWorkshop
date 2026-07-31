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
    IRandomness randomness
) : Hub<IParticipantClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Participant(sessionIdentity, participantId)
        );

        var joinResult = await pipeline.ExecuteAsync(
            sessionIdentity,
            session => session.Join(participantId, randomness)
        );

        if (!joinResult.IsAccepted)
        {
            throw new HubException(joinResult.Detail);
        }

        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        await Clients.Caller.ReceiveWorkshopState(
            ParticipantWorkshopStateMapper.MapFor(session, participantId, session.Revision)
        );
    }
}
