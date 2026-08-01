using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public sealed record SessionRoleStates(
    long Revision,
    FacilitatorWorkshopState Facilitator,
    PresenterWorkshopState Presenter,
    IReadOnlyDictionary<ParticipantId, ParticipantWorkshopState> Participants
);
