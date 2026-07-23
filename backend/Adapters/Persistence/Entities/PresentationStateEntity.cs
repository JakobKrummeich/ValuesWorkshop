namespace ValuesWorkshop.Adapters.Persistence.Entities;

public sealed class PresentationStateEntity
{
    public string SessionIdentity { get; set; } = "";
    public string? PresentingGroupName { get; set; }
    public string? PresentedValueId { get; set; }

    public SessionEntity Session { get; set; } = null!;
}
