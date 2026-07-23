namespace ValuesWorkshop.Domain;

public sealed class WorkshopState
{
    public Phase CurrentPhase { get; private set; } = Phase.Join;

    internal static WorkshopState Restore(Phase currentPhase)
    {
        return new WorkshopState { CurrentPhase = currentPhase };
    }
}
