namespace ValuesWorkshop.Domain;

public sealed record ClosedVotingRound(
    int RoundNumber,
    int Allotment,
    IReadOnlyList<ValueId> EligibleValues,
    IReadOnlyDictionary<ValueId, int> Tallies,
    int VotedCount,
    IReadOnlyList<ValueId> LockedValues,
    IReadOnlyList<ValueId> TiedValues
);
