namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class TopValueEntity
{
    public string SessionIdentity { get; set; } = "";
    public string ValueId { get; set; } = "";

    public SessionEntity Session { get; set; } = null!;
}
