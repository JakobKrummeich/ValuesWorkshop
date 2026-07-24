namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class GroupActionEntity
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string ValueId { get; set; } = "";
    public string Text { get; set; } = "";
    public int SortOrder { get; set; }

    public GroupEntity Group { get; set; } = null!;
}
