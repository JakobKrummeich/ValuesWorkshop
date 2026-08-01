using ValuesWorkshop.Application.State;

namespace ValuesWorkshop.Adapters.Web;

public interface IFacilitatorClient
{
    Task ReceiveWorkshopState(FacilitatorWorkshopState state);
}

public interface IParticipantClient
{
    Task ReceiveWorkshopState(ParticipantWorkshopState state);
}

public interface IPresenterClient
{
    Task ReceiveWorkshopState(PresenterWorkshopState state);
}
