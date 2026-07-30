namespace ValuesWorkshop.Domain;

public sealed class PhaseProgress
{
    public Phase CurrentPhase { get; private set; } = Phase.Join;

    internal static PhaseProgress Restore(Phase currentPhase)
    {
        return new PhaseProgress { CurrentPhase = currentPhase };
    }
}
