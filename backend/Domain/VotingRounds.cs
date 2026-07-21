namespace ValuesWorkshop.Domain;

public sealed class VotingRounds
{
    private readonly List<ValueId> _winningValues = [];

    public bool RoundOpen { get; private set; }
    public IReadOnlyList<ValueId> WinningValues => _winningValues;
}
