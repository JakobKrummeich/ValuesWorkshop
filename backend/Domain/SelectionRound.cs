namespace ValuesWorkshop.Domain;

/// <summary>Value selections, who-has-submitted, top values. Enforces I6, I7.</summary>
public sealed class SelectionRound
{
    private readonly List<ParticipantId> _submittedBy = [];
    private readonly List<ValueId> _topValues = [];

    public IReadOnlyList<ParticipantId> SubmittedBy => _submittedBy;
    public IReadOnlyList<ValueId> TopValues => _topValues;
}
