namespace ValuesWorkshop.Domain;

internal sealed class OpenVotingRound
{
    private readonly Dictionary<ValueId, int> tallies;
    private readonly HashSet<ParticipantId> votedParticipants;

    internal OpenVotingRound(int roundNumber, int allotment, IReadOnlyList<ValueId> eligibleValues)
        : this(
            roundNumber,
            allotment,
            eligibleValues,
            eligibleValues.ToDictionary(value => value, _ => 0),
            new HashSet<ParticipantId>()
        ) { }

    internal OpenVotingRound(
        int roundNumber,
        int allotment,
        IReadOnlyList<ValueId> eligibleValues,
        IReadOnlyDictionary<ValueId, int> tallies,
        IReadOnlySet<ParticipantId> votedParticipants
    )
    {
        RoundNumber = roundNumber;
        Allotment = allotment;
        EligibleValues = eligibleValues.ToList();
        this.tallies = new Dictionary<ValueId, int>(tallies);
        this.votedParticipants = [.. votedParticipants];
    }

    internal int RoundNumber { get; }
    internal int Allotment { get; }
    internal IReadOnlyList<ValueId> EligibleValues { get; }
    internal IReadOnlyDictionary<ValueId, int> Tallies => tallies;
    internal IReadOnlySet<ParticipantId> VotedParticipants => votedParticipants;

    internal void Record(ParticipantId participant, IReadOnlyDictionary<ValueId, int> votes)
    {
        foreach (var (value, voteCount) in votes)
        {
            tallies[value] += voteCount;
        }

        votedParticipants.Add(participant);
    }
}
