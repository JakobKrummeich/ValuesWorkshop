using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record SubmitGroupWorkCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId
);
