namespace ValuesWorkshop.Domain;

internal static class PhaseExitGuard
{
    internal static void RequireSatisfied(Session session, WorkshopContentSizes contentSizes)
    {
        var refusal = RefusalOf(session, contentSizes);

        if (refusal is not null)
        {
            throw new WrongPhaseException(refusal);
        }
    }

    private static string? RefusalOf(Session session, WorkshopContentSizes contentSizes)
    {
        return session.PhaseProgress.CurrentPhase switch
        {
            Phase.Quiz when !session.Quiz.IsWalkComplete(contentSizes.QuizQuestionCount) =>
                "The quiz is left once the last question's learning text has been shown.",
            Phase.GroupWork when !session.Formation.IsEveryGroupSubmitted =>
                "Group work is left once every group has submitted its result (I12).",
            Phase.ValuePresentation
                when !session.Presentation.IsWalkComplete(contentSizes.PresentedValueCount) =>
                "Value presentation is left once every group's every value has been shown (I12).",
            Phase.FinalVoting when !session.Voting.WinnersStand =>
                "Final voting is left once the winning values stand (I15).",
            _ => null,
        };
    }
}
