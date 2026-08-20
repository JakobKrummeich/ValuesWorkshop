using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class FacilitatorEnabledIntents
{
    internal static IReadOnlyList<FacilitatorIntent> Of(Session session)
    {
        var enabledIntents = new List<FacilitatorIntent>();

        if (session.PhaseProgress.CurrentPhase == Phase.Quiz)
        {
            AddQuizWalkIntent(enabledIntents, session.Quiz);
        }

        if (session.PhaseProgress.HasNextPhase && PhaseExitGuards.PermitExitOf(session))
        {
            enabledIntents.Add(FacilitatorIntent.AdvancePhase);
        }

        return enabledIntents;
    }

    private static void AddQuizWalkIntent(List<FacilitatorIntent> enabledIntents, QuizProgress quiz)
    {
        if (!quiz.IsRevealed)
        {
            enabledIntents.Add(FacilitatorIntent.RevealAnswer);
        }
        else if (!quiz.IsLearningTextShown)
        {
            enabledIntents.Add(FacilitatorIntent.ShowLearningText);
        }
        else if (!quiz.IsQuizComplete)
        {
            enabledIntents.Add(FacilitatorIntent.PoseNextQuestion);
        }
    }
}
