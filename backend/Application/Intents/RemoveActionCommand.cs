using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record RemoveActionCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    string? ActionId
);
