using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class SessionViews
{
    internal static QuizView Quiz(Session session)
    {
        return new QuizView(session.Quiz.CurrentQuestion, SubStateOf(session.Quiz));
    }

    internal static IReadOnlyList<string> TopValueIds(Session session)
    {
        return ValueIdsOf(session.Selection.TopValues);
    }

    internal static SelectionProgressView SelectionProgress(Session session)
    {
        return new SelectionProgressView(session.Selection.SubmittedBy.Count, TopValueIds(session));
    }

    internal static IReadOnlyList<Group> Groups(Session session)
    {
        return session.Formation.IsFormed ? session.Formation.Groups : [];
    }

    internal static GroupWorkStatus WorkStatusOf(Group group)
    {
        return group.IsSubmitted ? GroupWorkStatus.Submitted : GroupWorkStatus.Editing;
    }

    internal static string? PresentedValueId(Session session)
    {
        return session.Presentation.PresentedValue?.Value;
    }

    internal static PresentationView Presentation(Session session)
    {
        return new PresentationView(
            session.Presentation.PresentingGroup,
            PresentedValueId(session)
        );
    }

    internal static VotingView Voting(Session session)
    {
        return new VotingView(session.Voting.RoundNumber, session.Voting.RoundOpen);
    }

    internal static ConclusionView Conclusion(Session session)
    {
        return new ConclusionView(ValueIdsOf(session.Voting.WinningValues));
    }

    internal static IReadOnlyList<string> ValueIdsOf(IEnumerable<ValueId> values)
    {
        return values.Select(value => value.Value).ToList();
    }

    private static QuizSubState SubStateOf(QuizProgress quiz)
    {
        if (quiz.IsLearningTextShown)
        {
            return QuizSubState.LearningTextShown;
        }

        return quiz.IsRevealed ? QuizSubState.Revealed : QuizSubState.Answering;
    }
}
