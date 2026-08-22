using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record EditActionCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    string? ActionId,
    string? Text
);
