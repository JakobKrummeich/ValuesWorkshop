using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestSessions
{
    public static readonly FacilitatorSubject Facilitator = new("facilitator-subject");
    public static readonly SessionName Name = new("Test workshop");

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
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null,
        long revision = 0
    )
    {
        return Session.Restore(
            identity,
            Facilitator,
            Name,
            Roster.Restore([]),
            PhaseProgress.Restore(phase),
            quiz ?? QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            formation ?? FormationRecord.Restore(false, []),
            presentation ?? PresentationWalk.Restore(null, null, 0),
            voting ?? VotingRounds.Restore(false, 0, []),
            revision
        );
    }

    public static void AdvanceToNextPhase(Session session)
    {
        session.AdvancePhase(session.Facilitator, WorkshopContentSizes.Placeholder);
    }
}
