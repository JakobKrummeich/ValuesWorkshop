namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class WinningValueEntity
{
    public string SessionIdentity { get; set; } = "";
    public string ValueId { get; set; } = "";
    public int Rank { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
