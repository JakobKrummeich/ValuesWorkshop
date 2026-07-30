namespace ValuesWorkshop.Application.Intents;

public enum IntentRejectionCode
{
    WrongPhase = 1,
    NotAuthorized = 2,
    UnknownSession = 3,
    InvariantViolated = 4,
    MalformedPayload = 5,
    UnknownParticipant = 6,
}
