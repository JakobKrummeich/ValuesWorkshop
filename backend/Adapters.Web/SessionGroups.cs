using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public static class SessionGroups
{
    public static string Facilitator(SessionIdentity sessionIdentity)
    {
        return $"facilitator:{sessionIdentity.Value}";
    }

    public static string Participant(SessionIdentity sessionIdentity, ParticipantId participantId)
    {
        return $"participant:{sessionIdentity.Value}:{participantId.Value}";
    }

    public static string Presenter(SessionIdentity sessionIdentity)
    {
        return $"presenter:{sessionIdentity.Value}";
    }
}
