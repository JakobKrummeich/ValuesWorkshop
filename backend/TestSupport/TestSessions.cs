using ValuesWorkshop.Domain;

namespace ValuesWorkshop.TestSupport;

public static class TestSessions
{
    public static readonly FacilitatorSubject Facilitator = new("facilitator-subject");
    public static readonly CallerSubject FacilitatorCaller = new(Facilitator.Value);
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
        SelectionRound? selection = null,
        FormationRecord? formation = null,
        PresentationWalk? presentation = null,
        VotingRounds? voting = null,
        long revision = 0,
        IEnumerable<Participant>? roster = null
    )
    {
        return Session.Restore(
            identity,
            Facilitator,
            Name,
            Roster.Restore(roster ?? []),
            PhaseProgress.Restore(phase),
            quiz ?? UnansweredQuiz(phase),
            selection ?? SelectionRound.Restore([], []),
            formation ?? FormationRecord.Restore(false, []),
            presentation ?? PresentationWalk.Restore(null, null, 0),
            voting ?? VotingRounds.Restore([], null),
            revision
        );
    }

    private static QuizProgress UnansweredQuiz(Phase phase)
    {
        return QuizProgress.Restore(phase == Phase.Quiz ? 0 : null, false, false, []);
    }

    public static void WalkQuizToCompletion(Session session)
    {
        for (var questionIndex = 0; questionIndex < QuizProgress.QuestionCount; questionIndex++)
        {
            session.RevealAnswer();
            session.ShowLearningText();

            if (questionIndex < QuizProgress.QuestionCount - 1)
            {
                session.PoseNextQuestion();
            }
        }
    }
}
