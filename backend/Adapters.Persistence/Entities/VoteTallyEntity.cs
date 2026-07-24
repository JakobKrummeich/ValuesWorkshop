namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class VoteTallyEntity
{
    public string SessionIdentity { get; set; } = "";
    public int RoundNumber { get; set; }
    public string ValueId { get; set; } = "";
    public int VoteCount { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
