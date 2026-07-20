namespace ValuesWorkshop.Domain;

/// <summary>
/// Aggregate: one group of a session, fixed in membership and assigned values
/// once formed. Owns scribe, actions, submitted state. Enforces I9–I11.
/// </summary>
public sealed class Group(string name, IReadOnlyList<ParticipantId> members, IReadOnlyList<ValueId> assignedValues)
{
    public string Name { get; } = name;
    public IReadOnlyList<ParticipantId> Members { get; } = members;
    public IReadOnlyList<ValueId> AssignedValues { get; } = assignedValues;
    public ParticipantId? Scribe { get; private set; }
    public bool IsSubmitted { get; private set; }
}
