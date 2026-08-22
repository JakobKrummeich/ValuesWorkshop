using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record ReopenGroupWorkCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId
);
