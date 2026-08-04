using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestParticipants
{
    public static Participant Named(ParticipantId participantId, string displayName)
    {
        return new Participant(participantId, ParticipantName.Of(displayName, participantId));
    }

    public static Participant Unnamed(ParticipantId participantId)
    {
        return new Participant(participantId, ParticipantName.Of(null, participantId));
    }
}
