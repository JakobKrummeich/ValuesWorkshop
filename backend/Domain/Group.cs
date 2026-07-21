namespace ValuesWorkshop.Domain;

public sealed class Group(
    string name,
    IReadOnlyList<ParticipantId> members,
    IReadOnlyList<ValueId> assignedValues
)
{
    public string Name { get; } = name;
    public IReadOnlyList<ParticipantId> Members { get; } = members;
    public IReadOnlyList<ValueId> AssignedValues { get; } = assignedValues;
    public ParticipantId? Scribe { get; private set; }
    public bool IsSubmitted { get; private set; }
}
