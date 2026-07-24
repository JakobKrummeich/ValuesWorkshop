namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class GroupEntity
{
    public int Id { get; set; }
    public string SessionIdentity { get; set; } = "";
    public string Name { get; set; } = "";
    public string? ScribeParticipantId { get; set; }
    public bool IsSubmitted { get; set; }

    public SessionEntity Session { get; set; } = null!;
    public List<GroupMemberEntity> Members { get; set; } = [];
    public List<GroupAssignedValueEntity> AssignedValues { get; set; } = [];
    public List<GroupActionEntity> Actions { get; set; } = [];
}
