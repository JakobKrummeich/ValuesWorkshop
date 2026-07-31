using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class SignalRBroadcaster(
    IHubContext<FacilitatorHub, IFacilitatorClient> facilitatorHub,
    IHubContext<ParticipantHub, IParticipantClient> participantHub,
    IHubContext<PresenterHub, IPresenterClient> presenterHub
) : IBroadcaster
{
    public async Task BroadcastSessionStateAsync(Session session)
    {
        await facilitatorHub
            .Clients.Group(SessionGroups.Facilitator(session.Identity))
            .ReceiveWorkshopState(FacilitatorWorkshopStateMapper.Map(session, session.Revision));

        await presenterHub
            .Clients.Group(SessionGroups.Presenter(session.Identity))
            .ReceiveWorkshopState(PresenterWorkshopStateMapper.Map(session, session.Revision));

        foreach (var participantId in session.Roster.Participants)
        {
            await participantHub
                .Clients.Group(SessionGroups.Participant(session.Identity, participantId))
                .ReceiveWorkshopState(
                    ParticipantWorkshopStateMapper.MapFor(session, participantId, session.Revision)
                );
        }
    }
}
