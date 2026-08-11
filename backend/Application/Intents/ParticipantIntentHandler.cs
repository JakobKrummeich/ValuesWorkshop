using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Intents;

public sealed class ParticipantIntentHandler(IntentPipeline pipeline, IValuesCatalog valuesCatalog)
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

    public Task<IntentResult> HandleAsync(SubmitValueSelectionCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                session.SubmitValueSelection(
                    command.ParticipantId,
                    command.ValueIds.Select(valueId => new ValueId(valueId)).ToList(),
                    CatalogValueIds()
                );
                return true;
            }
        );
    }

    private IReadOnlySet<ValueId> CatalogValueIds()
    {
        return valuesCatalog.Values.Select(value => new ValueId(value.ValueId)).ToHashSet();
    }
}
