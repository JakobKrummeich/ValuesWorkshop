using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record SubmitGroupWorkAction(string? ActionId, string? Text);

public sealed record SubmitGroupWorkCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    IReadOnlyList<SubmitGroupWorkAction>? Actions = null
);
