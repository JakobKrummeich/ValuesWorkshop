using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class FacilitatorEnabledIntents
{
    internal static IReadOnlyList<FacilitatorIntent> Of(
        Session session,
        PhaseExitGuards exitGuards,
        int questionCount
    )
    {
        var enabledIntents = new List<FacilitatorIntent>();

        if (session.PhaseProgress.CurrentPhase == Phase.Quiz)
        {
            AddQuizWalkIntent(enabledIntents, session.Quiz, questionCount);
        }

        if (session.PhaseProgress.HasNextPhase && exitGuards.PermitsExitOf(session))
        {
            enabledIntents.Add(FacilitatorIntent.AdvancePhase);
        }

        return enabledIntents;
    }

    private static void AddQuizWalkIntent(
        List<FacilitatorIntent> enabledIntents,
        QuizProgress quiz,
        int questionCount
    )
    {
        if (!quiz.IsRevealed)
        {
            enabledIntents.Add(FacilitatorIntent.RevealAnswer);
        }
        else if (!quiz.IsLearningTextShown)
        {
            enabledIntents.Add(FacilitatorIntent.ShowLearningText);
        }
        else if (!quiz.IsQuizComplete(questionCount))
        {
            enabledIntents.Add(FacilitatorIntent.PoseNextQuestion);
        }
    }
}
