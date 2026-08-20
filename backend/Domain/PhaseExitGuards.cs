using System.Collections.Immutable;

namespace ValuesWorkshop.Domain;

public static class PhaseExitGuards
{
    private static readonly ImmutableDictionary<Phase, IPhaseExitGuard> GuardsByPhase =
        new IPhaseExitGuard[]
        {
            new QuizExitGuard(),
            new GroupWorkExitGuard(),
            new FinalVotingExitGuard(),
        }.ToImmutableDictionary(guard => guard.Phase);

    public static bool PermitExitOf(Session session)
    {
        return BlockingGuardFor(session) is null;
    }

    internal static void RequireSatisfiedBy(Session session)
    {
        if (BlockingGuardFor(session) is { } blockingGuard)
        {
            throw new WrongPhaseException(blockingGuard.Refusal);
        }
    }

    private static IPhaseExitGuard? BlockingGuardFor(Session session)
    {
        return
            GuardsByPhase.TryGetValue(session.PhaseProgress.CurrentPhase, out var guard)
            && !guard.IsSatisfiedBy(session)
            ? guard
            : null;
    }
}
