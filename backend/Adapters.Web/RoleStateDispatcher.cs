using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed class RoleStateDispatcher(
    IHubContext<FacilitatorHub, IFacilitatorClient> facilitatorHub,
    IHubContext<ParticipantHub, IParticipantClient> participantHub,
    IHubContext<PresenterHub, IPresenterClient> presenterHub
)
{
    public async Task SendAsync(SessionIdentity sessionIdentity, SessionRoleStates states)
    {
        await facilitatorHub
            .Clients.Group(SessionGroups.Facilitator(sessionIdentity))
            .ReceiveWorkshopState(states.Facilitator);

        await presenterHub
            .Clients.Group(SessionGroups.Presenter(sessionIdentity))
            .ReceiveWorkshopState(states.Presenter);

        foreach (var (participantId, participantState) in states.Participants)
        {
            await participantHub
                .Clients.Group(SessionGroups.Participant(sessionIdentity, participantId))
                .ReceiveWorkshopState(participantState);
        }
    }
}
