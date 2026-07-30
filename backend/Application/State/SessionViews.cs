using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class SessionViews
{
    internal static QuizView? Quiz(Session session)
    {
        if (session.Quiz.CurrentQuestion is not int questionNumber)
        {
            return null;
        }

        return new QuizView(questionNumber, SubStateOf(session.Quiz));
    }

    internal static bool HasReachedSelection(Session session)
    {
        return session.PhaseProgress.CurrentPhase >= Phase.ValueSelection;
    }

    internal static bool HasReachedVoting(Session session)
    {
        return session.PhaseProgress.CurrentPhase >= Phase.FinalVoting;
    }

    internal static IReadOnlyList<string> TopValueIds(Session session)
    {
        return ValueIdsOf(session.Selection.TopValues);
    }

    internal static SelectionProgressView? SelectionProgress(Session session)
    {
        return HasReachedSelection(session)
            ? new SelectionProgressView(session.Selection.SubmittedBy.Count, TopValueIds(session))
            : null;
    }

    internal static IReadOnlyList<Group>? Groups(Session session)
    {
        return session.Formation.IsFormed ? session.Formation.Groups : null;
    }

    internal static GroupWorkStatus WorkStatusOf(Group group)
    {
        return group.IsSubmitted ? GroupWorkStatus.Submitted : GroupWorkStatus.Editing;
    }

    internal static string? PresentedValueId(Session session)
    {
        return session.Presentation.PresentedValue?.Value;
    }

    internal static PresentationView? Presentation(Session session)
    {
        var presentedValueId = PresentedValueId(session);

        return presentedValueId is null
            ? null
            : new PresentationView(session.Presentation.PresentingGroup, presentedValueId);
    }

    internal static VotingView? Voting(Session session)
    {
        return HasReachedVoting(session)
            ? new VotingView(session.Voting.RoundNumber, session.Voting.RoundOpen)
            : null;
    }

    internal static ConclusionView? Conclusion(Session session)
    {
        var winners = ValueIdsOf(session.Voting.WinningValues);

        return winners.Count == 0 ? null : new ConclusionView(winners);
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
