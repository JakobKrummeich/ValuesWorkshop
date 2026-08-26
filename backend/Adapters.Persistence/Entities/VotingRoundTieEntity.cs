namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class VotingRoundTieEntity
{
    public string SessionIdentity { get; set; } = "";
    public int RoundNumber { get; set; }
    public string ValueId { get; set; } = "";
    public int SortOrder { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
