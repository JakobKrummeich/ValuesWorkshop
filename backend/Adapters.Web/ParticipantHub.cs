using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class ParticipantHub(
    ISessionRepository repository,
    IntentPipeline pipeline,
    ParticipantIntentHandler intentHandler,
    ParticipantWorkshopStateMapper stateMapper,
    WorkshopStateCache cache,
    IRandomness randomness,
    SessionConnectionRegistry registry
) : Hub<IParticipantClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Participant(sessionIdentity, participantId)
        );
        registry.Add(sessionIdentity, Context.ConnectionId);

        var participant = new Participant(
            participantId,
            CallerDisplayName.Of(Context, participantId)
        );

        var joinResult = await pipeline.ExecuteAsync(
            sessionIdentity,
            session => session.Join(participant, randomness)
        );

        if (!joinResult.IsAccepted)
        {
            throw new HubException(joinResult.Detail);
        }

        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);
        var states = cache.StatesOf(session);
        var participantState = states.Participants.TryGetValue(participantId, out var cached)
            ? cached
            : stateMapper.MapFor(session, participantId, session.Revision);
        await Clients.Caller.ReceiveWorkshopState(participantState);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }

    public Task<IntentResult> ChooseQuizAnswer(int questionIndex, int answerIndex)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new ChooseQuizAnswerCommand(sessionIdentity, participantId, questionIndex, answerIndex)
        );
    }

    public Task<IntentResult> SubmitValueSelection(IReadOnlyList<string>? valueIds)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new SubmitValueSelectionCommand(sessionIdentity, participantId, valueIds)
        );
    }

    public Task<IntentResult> AddAction(string? valueId)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new AddActionCommand(sessionIdentity, participantId, valueId)
        );
    }

    public Task<IntentResult> EditAction(string? actionId, string? text)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new EditActionCommand(sessionIdentity, participantId, actionId, text)
        );
    }

    public Task<IntentResult> RemoveAction(string? actionId)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new RemoveActionCommand(sessionIdentity, participantId, actionId)
        );
    }

    public Task<IntentResult> SubmitGroupWork(SubmitGroupWorkValuePayload[]? values)
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        var mapped = values
            ?.Select(value => new SubmitGroupWorkValue(
                value.ValueId,
                value
                    .Actions?.Select(action => new SubmitGroupWorkAction(
                        action.ActionId,
                        action.Text
                    ))
                    .ToList()
            ))
            .ToList();

        return intentHandler.HandleAsync(
            new SubmitGroupWorkCommand(sessionIdentity, participantId, mapped)
        );
    }

    public Task<IntentResult> ReopenGroupWork()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var participantId = CallerParticipantIdentity.ParticipantIdOf(Context, sessionIdentity);

        return intentHandler.HandleAsync(
            new ReopenGroupWorkCommand(sessionIdentity, participantId)
        );
    }
}
