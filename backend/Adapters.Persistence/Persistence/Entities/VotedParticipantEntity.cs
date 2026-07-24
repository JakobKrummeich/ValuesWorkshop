namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class VotedParticipantEntity
{
    public string SessionIdentity { get; set; } = "";
    public int RoundNumber { get; set; }
    public string ParticipantId { get; set; } = "";

    public SessionEntity Session { get; set; } = null!;
}
