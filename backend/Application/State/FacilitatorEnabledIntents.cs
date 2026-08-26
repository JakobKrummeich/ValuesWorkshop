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

        if (session.PhaseProgress.CurrentPhase == Phase.GroupWork)
        {
            enabledIntents.Add(FacilitatorIntent.ReassignScribe);
        }

        if (session.PhaseProgress.CurrentPhase == Phase.ValuePresentation)
        {
            AddPresentationWalkIntents(enabledIntents, session);
        }

        if (session.PhaseProgress.HasNextPhase && PhaseExitGuards.PermitExitOf(session))
        {
            enabledIntents.Add(FacilitatorIntent.AdvancePhase);
        }

        return enabledIntents;
    }

    private static void AddPresentationWalkIntents(
        List<FacilitatorIntent> enabledIntents,
        Session session
    )
    {
        if (session.Presentation.HasNextPosition(session.Formation.Groups))
        {
            enabledIntents.Add(FacilitatorIntent.GoToNextValue);
        }

        if (session.Presentation.PresentedValue is not null)
        {
            enabledIntents.Add(FacilitatorIntent.CorrectActionWording);
        }
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
