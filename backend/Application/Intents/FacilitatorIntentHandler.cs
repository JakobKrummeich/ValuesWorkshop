using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed class FacilitatorIntentHandler(
    IntentPipeline pipeline,
    IEnumerable<IPhaseEntryAction> phaseEntryActions
)
{
    public Task<IntentResult> HandleAsync(AdvancePhaseCommand command)
    {
        return ExecuteAsFacilitatorAsync(
            command.SessionIdentity,
            command.Caller,
            session =>
            {
                session.AdvancePhase();
                foreach (var phaseEntryAction in phaseEntryActions)
                {
                    phaseEntryAction.ExecuteFor(session);
                }
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(RevealAnswerCommand command)
    {
        return ExecuteAsFacilitatorAsync(
            command.SessionIdentity,
            command.Caller,
            session =>
            {
                var was = session.Quiz.IsRevealed;
                session.RevealAnswer();
                return !was;
            }
        );
    }

    public Task<IntentResult> HandleAsync(ShowLearningTextCommand command)
    {
        return ExecuteAsFacilitatorAsync(
            command.SessionIdentity,
            command.Caller,
            session =>
            {
                var was = session.Quiz.IsLearningTextShown;
                session.ShowLearningText();
                return !was;
            }
        );
    }

    public Task<IntentResult> HandleAsync(PoseNextQuestionCommand command)
    {
        return ExecuteAsFacilitatorAsync(
            command.SessionIdentity,
            command.Caller,
            session =>
            {
                session.PoseNextQuestion();
                return true;
            }
        );
    }

    private Task<IntentResult> ExecuteAsFacilitatorAsync(
        SessionIdentity sessionIdentity,
        CallerSubject caller,
        Func<Session, bool> intent
    )
    {
        return pipeline.ExecuteAsync(
            sessionIdentity,
            session =>
            {
                if (!session.IsFacilitatedBy(caller))
                {
                    throw new NotAuthorizedException(
                        "Only the facilitator of this session may command it."
                    );
                }

                return intent(session);
            }
        );
    }
}
