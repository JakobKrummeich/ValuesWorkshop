namespace ValuesWorkshop.Domain;

/// <summary>Current phase plus within-phase state. Enforces I1, I2.</summary>
public sealed class WorkshopState
{
    public Phase CurrentPhase { get; private set; } = Phase.Join;
}
