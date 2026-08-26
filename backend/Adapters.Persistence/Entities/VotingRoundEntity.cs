namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class VotingRoundEntity
{
    public string SessionIdentity { get; set; } = "";
    public int RoundNumber { get; set; }
    public int Allotment { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
