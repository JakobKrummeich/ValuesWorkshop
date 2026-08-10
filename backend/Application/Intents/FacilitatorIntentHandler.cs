using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed class FacilitatorIntentHandler(
    IntentPipeline pipeline,
    PhaseExitGuards exitGuards,
    IQuizCatalog quizCatalog
)
{
    public Task<IntentResult> HandleAsync(AdvancePhaseCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                session.AdvancePhase(command.Caller, exitGuards);
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(RevealAnswerCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                var was = session.Quiz.IsRevealed;
                session.RevealAnswer(command.Caller);
                return !was;
            }
        );
    }

    public Task<IntentResult> HandleAsync(ShowLearningTextCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                var was = session.Quiz.IsLearningTextShown;
                session.ShowLearningText(command.Caller);
                return !was;
            }
        );
    }

    public Task<IntentResult> HandleAsync(PoseNextQuestionCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                session.PoseNextQuestion(command.Caller, quizCatalog.Questions.Count);
                return true;
            }
        );
    }
}
