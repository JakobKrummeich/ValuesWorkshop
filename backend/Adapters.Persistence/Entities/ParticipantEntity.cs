namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class ParticipantEntity
{
    public string Id { get; set; } = "";
    public string SessionIdentity { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public int JoinOrder { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
