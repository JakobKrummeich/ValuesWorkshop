namespace ValuesWorkshop.Domain;

public sealed class VotingRounds
{
    public const int RequiredWinningValueCount = 5;

    private static readonly IReadOnlyDictionary<ValueId, int> NoTallies =
        new Dictionary<ValueId, int>();
    private static readonly IReadOnlySet<ParticipantId> NoVoters = new HashSet<ParticipantId>();

    private readonly List<ClosedVotingRound> closedRounds = [];
    private OpenVotingRound? openRound;

    public bool RoundOpen => openRound is not null;
    public int RoundNumber => openRound?.RoundNumber ?? LastClosedRound?.RoundNumber ?? 0;
    public int Allotment => openRound?.Allotment ?? LastClosedRound?.Allotment ?? 0;

    public IReadOnlyList<ValueId> EligibleValues =>
        openRound?.EligibleValues ?? LastClosedRound?.EligibleValues ?? [];

    public int VotedCount => openRound?.VotedParticipants.Count ?? LastClosedRound?.VotedCount ?? 0;
    public IReadOnlyList<ClosedVotingRound> ClosedRounds => closedRounds;
    public ClosedVotingRound? LastClosedRound => closedRounds.Count == 0 ? null : closedRounds[^1];

    public IReadOnlyList<ValueId> WinningValues =>
        closedRounds.SelectMany(round => round.LockedValues).ToList();

    public bool WinnersStand => WinningValues.Count == RequiredWinningValueCount;

    public IReadOnlyList<RankedWinner> RankedWinners(IReadOnlyList<ValueId> catalogOrder)
    {
        if (closedRounds.Count == 0)
        {
            return [];
        }

        var catalogPositions = catalogOrder
            .Select((value, position) => (value, position))
            .ToDictionary(entry => entry.value, entry => entry.position);
        var firstRoundTallies = closedRounds[0].Tallies;

        return closedRounds
            .SelectMany(round => LockedInRankOrder(round, catalogPositions))
            .Select((value, index) => new RankedWinner(index + 1, value, firstRoundTallies[value]))
            .ToList();
    }

    private static IEnumerable<ValueId> LockedInRankOrder(
        ClosedVotingRound round,
        IReadOnlyDictionary<ValueId, int> catalogPositions
    )
    {
        return round
            .LockedValues.OrderByDescending(value => round.Tallies[value])
            .ThenBy(value => catalogPositions[value]);
    }

    public bool TiebreakPending => !RoundOpen && LastClosedRound is { TiedValues.Count: > 0 };

    internal IReadOnlyDictionary<ValueId, int> OpenRoundTallies => openRound?.Tallies ?? NoTallies;
    internal IReadOnlySet<ParticipantId> OpenRoundVotedParticipants =>
        openRound?.VotedParticipants ?? NoVoters;

    public bool HasVoted(ParticipantId participant)
    {
        return openRound?.VotedParticipants.Contains(participant) ?? false;
    }

    internal void OpenRound(int allotment, IReadOnlyList<ValueId> eligibleValues)
    {
        if (RoundNumber > 0 || eligibleValues.Count == 0)
        {
            return;
        }

        openRound = new OpenVotingRound(1, allotment, eligibleValues);
    }

    internal void RecordBallot(ParticipantId participant, IReadOnlyDictionary<ValueId, int> votes)
    {
        if (openRound is null)
        {
            throw new InvariantViolationException(
                "Final votes are cast while a voting round is open."
            );
        }

        if (openRound.VotedParticipants.Contains(participant))
        {
            throw new InvariantViolationException(
                "Each participant casts final votes at most once per round."
            );
        }

        foreach (var (value, voteCount) in votes)
        {
            if (!openRound.Tallies.ContainsKey(value))
            {
                throw new InvariantViolationException(
                    $"The value '{value.Value}' is not eligible in this voting round."
                );
            }

            if (voteCount < 1)
            {
                throw new InvariantViolationException("A vote puts at least one point on a value.");
            }
        }

        if (votes.Values.Sum() != openRound.Allotment)
        {
            throw new InvariantViolationException(
                $"A ballot spends exactly {openRound.Allotment} votes this round."
            );
        }

        openRound.Record(participant, votes);
    }

    internal void CloseRound()
    {
        if (openRound is null)
        {
            return;
        }

        var (lockedValues, tiedValues) = OutcomeOf(openRound);

        closedRounds.Add(
            new ClosedVotingRound(
                openRound.RoundNumber,
                openRound.Allotment,
                openRound.EligibleValues,
                new Dictionary<ValueId, int>(openRound.Tallies),
                openRound.VotedParticipants.Count,
                lockedValues,
                tiedValues
            )
        );
        openRound = null;
    }

    internal void StartTiebreak()
    {
        if (openRound is not null && LastClosedRound is { TiedValues.Count: > 0 })
        {
            return;
        }

        if (openRound is not null || LastClosedRound is not { TiedValues.Count: > 0 } tiedRound)
        {
            throw new InvariantViolationException(
                "A tiebreak follows a closed round that left the last winner places tied."
            );
        }

        openRound = new OpenVotingRound(
            tiedRound.RoundNumber + 1,
            RequiredWinningValueCount - WinningValues.Count,
            tiedRound.TiedValues
        );
    }

    private static (
        IReadOnlyList<ValueId> LockedValues,
        IReadOnlyList<ValueId> TiedValues
    ) OutcomeOf(OpenVotingRound round)
    {
        var ranked = round.EligibleValues.OrderByDescending(value => round.Tallies[value]).ToList();
        var boundaryCount = round.Tallies[ranked[round.Allotment - 1]];
        var aboveBoundary = ranked.Where(value => round.Tallies[value] > boundaryCount).ToList();
        var atBoundary = ranked.Where(value => round.Tallies[value] == boundaryCount).ToList();

        return aboveBoundary.Count + atBoundary.Count == round.Allotment
            ? ([.. aboveBoundary, .. atBoundary], [])
            : (aboveBoundary, atBoundary);
    }

    internal static VotingRounds Restore(
        IReadOnlyList<ClosedVotingRound> closedRounds,
        OpenVotingRound? openRound
    )
    {
        var rounds = new VotingRounds { openRound = openRound };
        rounds.closedRounds.AddRange(closedRounds);
        return rounds;
    }
}
