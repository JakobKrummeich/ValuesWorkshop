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

    public bool PermitsExitOf(Session session)
    {
        return BlockingGuardFor(session) is null;
    }

    internal void RequireSatisfied(Session session)
    {
        if (BlockingGuardFor(session) is { } blockingGuard)
        {
            throw new WrongPhaseException(blockingGuard.Refusal);
        }
    }

    private IPhaseExitGuard? BlockingGuardFor(Session session)
    {
        return
            guardsByPhase.TryGetValue(session.PhaseProgress.CurrentPhase, out var guard)
            && !guard.IsSatisfiedBy(session)
            ? guard
            : null;
    }
}
