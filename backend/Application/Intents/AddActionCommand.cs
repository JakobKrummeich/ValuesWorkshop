using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record AddActionCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    string? ValueId,
    string? Text
);
