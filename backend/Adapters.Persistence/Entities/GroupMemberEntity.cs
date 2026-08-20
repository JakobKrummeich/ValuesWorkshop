namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class GroupMemberEntity
{
    public int GroupId { get; set; }
    public string ParticipantId { get; set; } = "";
    public int SortOrder { get; set; }

    public GroupEntity Group { get; set; } = null!;
}
