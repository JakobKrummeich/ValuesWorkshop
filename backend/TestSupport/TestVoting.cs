using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestVoting
{
    public static VotingRounds MainRoundOpen(IReadOnlyList<ValueId> eligibleValues)
    {
        return VotingRounds.Restore(
            [],
            new OpenVotingRound(1, VotingRounds.RequiredWinningValueCount, eligibleValues)
        );
    }

    public static VotingRounds TiebreakOpen(
        int roundNumber,
        IReadOnlyList<ValueId> tiedValues,
        int allotment
    )
    {
        var lockedValues = ValuesNamed(
            "locked",
            VotingRounds.RequiredWinningValueCount - allotment
        );

        return VotingRounds.Restore(
            [ClosedRound(roundNumber - 1, lockedValues, tiedValues)],
            new OpenVotingRound(roundNumber, allotment, tiedValues)
        );
    }

    public static VotingRounds AfterLocking(
        IReadOnlyList<ValueId> lockedValues,
        int roundNumber = 1
    )
    {
        var openPlaces = VotingRounds.RequiredWinningValueCount - lockedValues.Count;
        var tiedValues = openPlaces > 0 ? ValuesNamed("tied", openPlaces + 1) : [];

        return VotingRounds.Restore([ClosedRound(roundNumber, lockedValues, tiedValues)], null);
    }

    private static ClosedVotingRound ClosedRound(
        int roundNumber,
        IReadOnlyList<ValueId> lockedValues,
        IReadOnlyList<ValueId> tiedValues
    )
    {
        var eligibleValues = lockedValues.Concat(tiedValues).ToList();
        var tallies = eligibleValues.ToDictionary(
            value => value,
            value =>
                lockedValues.Contains(value)
                    ? 1 + lockedValues.Count - lockedValues.ToList().IndexOf(value)
                    : 1
        );

        var allotment = VotingRounds.RequiredWinningValueCount;
        var ballotCount = (tallies.Values.Sum() + allotment - 1) / allotment;

        return new ClosedVotingRound(
            roundNumber,
            allotment,
            eligibleValues,
            tallies,
            ballotCount,
            lockedValues,
            tiedValues
        );
    }

    private static IReadOnlyList<ValueId> ValuesNamed(string prefix, int count)
    {
        return Enumerable
            .Range(1, count)
            .Select(number => new ValueId($"{prefix}-{number}"))
            .ToList();
    }
}
