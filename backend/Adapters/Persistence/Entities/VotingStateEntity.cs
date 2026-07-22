namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class VotingStateEntity
{
    public string SessionIdentity { get; set; } = "";
    public bool RoundOpen { get; set; }
    public int RoundNumber { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
