namespace ValuesWorkshop.Domain;

public sealed class Group
{
    private readonly List<ParticipantId> _members;

    public string Name { get; }
    public IReadOnlyList<ParticipantId> Members => _members;
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
        _members = [.. members];
        AssignedValues = assignedValues;
    }

    internal void AddMember(ParticipantId participantId)
    {
        _members.Add(participantId);
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
