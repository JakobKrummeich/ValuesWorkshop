using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed record SubmitFinalVote(string? ValueId, int? VoteCount);

public sealed record SubmitFinalVotesCommand(
    SessionIdentity SessionIdentity,
    ParticipantId ParticipantId,
    IReadOnlyList<SubmitFinalVote>? Votes = null
);
