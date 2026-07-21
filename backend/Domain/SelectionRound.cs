namespace ValuesWorkshop.Domain;

public sealed class SelectionRound
{
    private readonly List<ParticipantId> _submittedBy = [];
    private readonly List<ValueId> _topValues = [];

    public IReadOnlyList<ParticipantId> SubmittedBy => _submittedBy;
    public IReadOnlyList<ValueId> TopValues => _topValues;
}
