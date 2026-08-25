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
                    IntentPayloadValidator.RequiredValueIds(command.ValueIds),
                    CatalogValueIds()
                );
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(AddActionCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                GroupWork.AddAction(
                    session,
                    command.ParticipantId,
                    new ActionId(Guid.NewGuid()),
                    IntentPayloadValidator.RequiredValueId(command.ValueId),
                    GroupActionText.Of(command.Text)
                );
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(EditActionCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                GroupWork.EditAction(
                    session,
                    command.ParticipantId,
                    IntentPayloadValidator.RequiredActionId(command.ActionId),
                    GroupActionText.Of(command.Text)
                );
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(RemoveActionCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                GroupWork.RemoveAction(
                    session,
                    command.ParticipantId,
                    IntentPayloadValidator.RequiredActionId(command.ActionId)
                );
                return true;
            }
        );
    }

    public Task<IntentResult> HandleAsync(SubmitGroupWorkCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                if (command.Actions is not null)
                {
                    foreach (var action in command.Actions)
                    {
                        GroupWork.EditAction(
                            session,
                            command.ParticipantId,
                            IntentPayloadValidator.RequiredActionId(action.ActionId),
                            GroupActionText.Of(action.Text)
                        );
                    }
                }

                var wasSubmitted = IsCallerGroupSubmitted(session, command.ParticipantId);
                GroupWork.Submit(session, command.ParticipantId);
                return !wasSubmitted;
            }
        );
    }

    public Task<IntentResult> HandleAsync(ReopenGroupWorkCommand command)
    {
        return pipeline.ExecuteAsync(
            command.SessionIdentity,
            session =>
            {
                var wasSubmitted = IsCallerGroupSubmitted(session, command.ParticipantId);
                GroupWork.Reopen(session, command.ParticipantId);
                return wasSubmitted;
            }
        );
    }

    private static bool IsCallerGroupSubmitted(Session session, ParticipantId participantId)
    {
        return session.Formation.Groups.Any(group =>
            group.Members.Contains(participantId) && group.IsSubmitted
        );
    }

    private IReadOnlySet<ValueId> CatalogValueIds()
    {
        return valuesCatalog.Values.Select(value => new ValueId(value.ValueId)).ToHashSet();
    }
}
