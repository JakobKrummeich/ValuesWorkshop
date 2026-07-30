namespace ValuesWorkshop.Domain;

public sealed class PhaseProgress
{
    public Phase CurrentPhase { get; private set; } = Phase.Join;

    internal void Advance()
    {
        if (CurrentPhase == Phase.FinalPresentation)
        {
            throw new InvariantViolationException(
                "The workshop is in its last phase; phases move forward only (I1)."
            );
        }

        CurrentPhase++;
    }

    internal static PhaseProgress Restore(Phase currentPhase)
    {
        return new PhaseProgress { CurrentPhase = currentPhase };
    }
}
