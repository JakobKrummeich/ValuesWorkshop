using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record SubmitValueSelectionCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    IReadOnlyList<string>? ValueIds
);
