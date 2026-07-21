namespace ValuesWorkshop.Domain;

public sealed class WorkshopState
{
    public Phase CurrentPhase { get; private set; } = Phase.Join;
}
