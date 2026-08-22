using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record ReassignScribeCommand(
    SessionIdentity SessionIdentity,
    CallerSubject Caller,
    string? ParticipantId
);
