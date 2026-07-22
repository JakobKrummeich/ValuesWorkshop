namespace ValuesWorkshop.Domain;

public sealed class VotingRounds
{
    private readonly List<ValueId> _winningValues = [];

    public bool RoundOpen { get; private set; }
    public int RoundNumber { get; private set; }
    public IReadOnlyList<ValueId> WinningValues => _winningValues;

    internal static VotingRounds Restore(
        bool roundOpen,
        int roundNumber,
        IEnumerable<ValueId> winningValues
    )
    {
        var rounds = new VotingRounds { RoundOpen = roundOpen, RoundNumber = roundNumber };
        rounds._winningValues.AddRange(winningValues);
        return rounds;
    }
}
