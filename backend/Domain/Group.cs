namespace ValuesWorkshop.Domain;

public sealed class Group
{
    public string Name { get; }
    public IReadOnlyList<ParticipantId> Members { get; }
    public IReadOnlyList<ValueId> AssignedValues { get; }
    public ParticipantId? Scribe { get; private set; }
    public bool IsSubmitted { get; private set; }

    public Group(
        string name,
        IReadOnlyList<ParticipantId> members,
        IReadOnlyList<ValueId> assignedValues
    )
    {
        Name = name;
        Members = members;
        AssignedValues = assignedValues;
    }

    internal static Group Restore(
        string name,
        IReadOnlyList<ParticipantId> members,
        IReadOnlyList<ValueId> assignedValues,
        ParticipantId? scribe,
        bool isSubmitted
    )
    {
        return new Group(name, members, assignedValues)
        {
            Scribe = scribe,
            IsSubmitted = isSubmitted,
        };
    }
}
