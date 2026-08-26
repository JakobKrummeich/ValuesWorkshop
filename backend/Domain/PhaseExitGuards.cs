namespace ValuesWorkshop.Domain;

public static class PhaseExitGuards
{
    private static IReadOnlyList<IPhaseExitGuard> GuardsFor(Session session)
    {
        return
        [
            new QuizExitGuard(),
            new GroupFormationExitGuard(),
            new GroupWorkExitGuard(),
            new ValuePresentationExitGuard(session.Formation.AssignedValueCount),
            new FinalVotingExitGuard(),
        ];
    }

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
        var guard = GuardsFor(session)
            .FirstOrDefault(candidate => candidate.Phase == session.PhaseProgress.CurrentPhase);

        return guard is not null && !guard.IsSatisfiedBy(session) ? guard : null;
    }
}
