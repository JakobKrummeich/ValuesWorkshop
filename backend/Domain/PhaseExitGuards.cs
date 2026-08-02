using System.Collections.Immutable;

namespace ValuesWorkshop.Domain;

public sealed record PhaseExitGuards
{
    private readonly ImmutableDictionary<Phase, IPhaseExitGuard> guardsByPhase;

    public PhaseExitGuards(params IPhaseExitGuard[] guards)
    {
        guardsByPhase = guards.ToImmutableDictionary(guard => guard.Phase);
    }

    public static PhaseExitGuards None { get; } = new();

    internal void RequireSatisfied(Session session)
    {
        if (
            guardsByPhase.TryGetValue(session.PhaseProgress.CurrentPhase, out var guard)
            && !guard.IsSatisfiedBy(session)
        )
        {
            throw new WrongPhaseException(guard.Refusal);
        }
    }
}
