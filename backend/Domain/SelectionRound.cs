namespace ValuesWorkshop.Domain;

public sealed class SelectionRound
{
    private readonly List<ParticipantId> _submittedBy = [];
    private readonly List<ValueId> _topValues = [];

    public IReadOnlyList<ParticipantId> SubmittedBy => _submittedBy;
    public IReadOnlyList<ValueId> TopValues => _topValues;

    internal static SelectionRound Restore(
        IEnumerable<ParticipantId> submittedBy,
        IEnumerable<ValueId> topValues
    )
    {
        var round = new SelectionRound();
        round._submittedBy.AddRange(submittedBy);
        round._topValues.AddRange(topValues);
        return round;
    }
}
