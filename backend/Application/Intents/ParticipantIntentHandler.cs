namespace ValuesWorkshop.Application.Intents;

public sealed class ParticipantIntentHandler(IntentPipeline pipeline)
{
    public Task<IntentResult> HandleAsync(ChooseQuizAnswerCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                session.ChooseQuizAnswer(
                    command.ParticipantId,
                    command.QuestionIndex,
                    command.AnswerIndex
                );
                return true;
            }
        );
    }
}
