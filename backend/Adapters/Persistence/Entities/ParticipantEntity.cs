namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class ParticipantEntity
{
    public string Id { get; set; } = "";
    public string SessionIdentity { get; set; } = "";

    public SessionEntity Session { get; set; } = null!;
}
