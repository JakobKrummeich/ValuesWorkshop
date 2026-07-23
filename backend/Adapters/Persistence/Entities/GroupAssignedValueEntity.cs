namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class GroupAssignedValueEntity
{
    public int GroupId { get; set; }
    public string ValueId { get; set; } = "";

    public GroupEntity Group { get; set; } = null!;
}
