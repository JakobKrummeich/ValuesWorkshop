using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.State;

internal static class FacilitatorEnabledIntents
{
    internal static IReadOnlyList<FacilitatorIntent> Of(Session session)
    {
        var enabledIntents = new List<FacilitatorIntent>();

        AddPhaseIntents(enabledIntents, session);

        if (session.PhaseProgress.HasNextPhase && PhaseExitGuards.PermitExitOf(session))
        {
            enabledIntents.Add(FacilitatorIntent.AdvancePhase);
        }

        return enabledIntents;
    }

    private static void AddPhaseIntents(List<FacilitatorIntent> enabledIntents, Session session)
    {
        switch (session.PhaseProgress.CurrentPhase)
        {
            case Phase.Quiz:
                AddQuizWalkIntent(enabledIntents, session.Quiz);
                break;
            case Phase.GroupWork:
                enabledIntents.Add(FacilitatorIntent.ReassignScribe);
                break;
            case Phase.ValuePresentation:
                AddPresentationWalkIntents(enabledIntents, session);
                break;
            case Phase.FinalVoting:
                AddVotingIntents(enabledIntents, session.Voting);
                break;
            case Phase.FinalPresentation:
                AddRevealIntent(enabledIntents, session.Reveal);
                break;
        }
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

    private static void AddRevealIntent(List<FacilitatorIntent> enabledIntents, WinnerReveal reveal)
    {
        if (!reveal.IsConcluded)
        {
            enabledIntents.Add(FacilitatorIntent.RevealNextValue);
        }
    }

    private static void AddVotingIntents(
        List<FacilitatorIntent> enabledIntents,
        VotingRounds voting
    )
    {
        if (voting.RoundOpen)
        {
            enabledIntents.Add(FacilitatorIntent.CloseVoting);
        }

        if (voting.TiebreakPending)
        {
            enabledIntents.Add(FacilitatorIntent.StartTiebreakRound);
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
