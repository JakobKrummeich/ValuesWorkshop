namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class SelectionSubmissionEntity
{
    public string SessionIdentity { get; set; } = "";
    public string ParticipantId { get; set; } = "";

    public SessionEntity Session { get; set; } = null!;
}
