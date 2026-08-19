using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestSessions
{
    public static readonly FacilitatorSubject Facilitator = new("facilitator-subject");
    public static readonly CallerSubject FacilitatorCaller = new(Facilitator.Value);
    public static readonly SessionName Name = new("Test workshop");

    public static CallerSubject CallerOf(Session session)
    {
        return new CallerSubject(session.Facilitator.Value);
    }

    public static Session Open(SessionIdentity identity)
    {
        return Open(identity, Facilitator);
    }

    public static Session Open(SessionIdentity identity, FacilitatorSubject facilitator)
    {
        return Session.Open(identity, facilitator, Name);
    }

    public static Session InPhase(
        SessionIdentity identity,
        Phase phase,
        QuizProgress? quiz = null,
        SelectionRound? selection = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null,
        long revision = 0,
        Roster? roster = null
    )
    {
        return Session.Restore(
            identity,
            Facilitator,
            Name,
            roster ?? Roster.Restore([]),
            PhaseProgress.Restore(phase),
            quiz ?? DefaultQuiz(phase),
            selection ?? SelectionRound.Restore([], []),
            formation ?? FormationRecord.Restore(false, []),
            presentation ?? PresentationWalk.Restore(null, null, 0),
            voting ?? VotingRounds.Restore(false, 0, []),
            revision
        );
    }

    private static QuizProgress DefaultQuiz(Phase phase)
    {
        return QuizProgress.Restore(phase == Phase.Quiz ? 0 : null, false, false, []);
    }

    public static void AdvanceToNextPhase(Session session)
    {
        session.AdvancePhase(
            CallerOf(session),
            PhaseExitGuards.None,
            new TestGroupSolver(),
            new TestAnimalNames(8)
        );
    }
}
