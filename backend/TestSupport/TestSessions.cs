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

    public static Session InPhase(SessionIdentity identity, Phase phase)
    {
        return Session.Restore(
            identity,
            Facilitator,
            Name,
            Roster.Restore([]),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
    }

    public static void AdvanceToNextPhase(Session session)
    {
        session.AdvancePhase(session.Facilitator);
    }
}
