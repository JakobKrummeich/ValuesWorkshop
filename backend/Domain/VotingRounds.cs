namespace ValuesWorkshop.Domain;

/// <summary>Allotment, who-has-voted, anonymous tallies, ties, winners. Enforces I13–I15.</summary>
public sealed class VotingRounds
{
    private readonly List<ValueId> _winningValues = [];

    public bool RoundOpen { get; private set; }
    public IReadOnlyList<ValueId> WinningValues => _winningValues;
}
