using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

[Authorize]
public sealed class FacilitatorHub(
    ISessionRepository repository,
    FacilitatorIntentHandler intentHandler,
    WorkshopStateCache cache,
    SessionConnectionRegistry registry
) : Hub<IFacilitatorClient>
{
    public override async Task OnConnectedAsync()
    {
        var sessionIdentity = HubSessionBinding.SessionIdentityOf(Context);
        var session = await HubSessionLoader.RequiredAsync(repository, sessionIdentity);

        RequireFacilitator(session);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SessionGroups.Facilitator(sessionIdentity)
        );
        registry.Add(sessionIdentity, Context.ConnectionId);

        await Clients.Caller.ReceiveWorkshopState(cache.StatesOf(session).Facilitator);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);

        return base.OnDisconnectedAsync(exception);
    }

    private CallerSubject Caller()
    {
        var subject = CallerSubjectClaim.Of(Context.User);

        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new HubException("The caller is not authenticated.");
        }

        return new CallerSubject(subject);
    }

    private void RequireFacilitator(Session session)
    {
        if (!session.IsFacilitatedBy(Caller()))
        {
            throw new HubException("The caller is not the facilitator of this session.");
        }
    }

    public Task<IntentResult> AdvancePhase()
    {
        return intentHandler.HandleAsync(
            new AdvancePhaseCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> RevealAnswer()
    {
        return intentHandler.HandleAsync(
            new RevealAnswerCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> ShowLearningText()
    {
        return intentHandler.HandleAsync(
            new ShowLearningTextCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> PoseNextQuestion()
    {
        return intentHandler.HandleAsync(
            new PoseNextQuestionCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> ReassignScribe(string? participantId)
    {
        return intentHandler.HandleAsync(
            new ReassignScribeCommand(
                HubSessionBinding.SessionIdentityOf(Context),
                Caller(),
                participantId
            )
        );
    }

    public Task<IntentResult> GoToNextValue()
    {
        return intentHandler.HandleAsync(
            new GoToNextValueCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> CorrectActionWording(string? actionId, string? text)
    {
        return intentHandler.HandleAsync(
            new CorrectActionWordingCommand(
                HubSessionBinding.SessionIdentityOf(Context),
                Caller(),
                actionId,
                text
            )
        );
    }

    public Task<IntentResult> RevealNextValue()
    {
        return intentHandler.HandleAsync(
            new RevealNextValueCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> CloseVoting()
    {
        return intentHandler.HandleAsync(
            new CloseVotingCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }

    public Task<IntentResult> StartTiebreakRound()
    {
        return intentHandler.HandleAsync(
            new StartTiebreakRoundCommand(HubSessionBinding.SessionIdentityOf(Context), Caller())
        );
    }
}
