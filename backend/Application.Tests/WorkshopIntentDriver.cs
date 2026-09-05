using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Application.Tests;

public enum WorkshopIntentKind
{
    AdvancePhase,
    PoseNextQuestion,
    RevealAnswer,
    ShowLearningText,
    ReassignScribe,
    GoToNextValue,
    CloseVoting,
    StartTiebreakRound,
    RevealNextValue,
    ChooseQuizAnswer,
    SubmitValueSelection,
    SubmitFinalVotes,
}

internal sealed class WorkshopIntentDriver
{
    private static readonly SessionIdentity Identity = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );
    private static readonly CallerSubject Caller = TestSessions.FacilitatorCaller;
    private static readonly ParticipantId Voter = SessionFixtures.Anna;

    private readonly IReadOnlyDictionary<WorkshopIntentKind, Func<Task<IntentResult>>> intents;

    internal WorkshopIntentDriver(ISessionRepository repository)
    {
        var pipeline = new IntentPipeline(
            new SessionCommandHandler(repository, new RecordingBroadcaster())
        );
        var facilitator = new FacilitatorIntentHandler(pipeline, []);
        var participant = new ParticipantIntentHandler(pipeline, new TestValuesCatalog(50));

        intents = new Dictionary<WorkshopIntentKind, Func<Task<IntentResult>>>
        {
            [WorkshopIntentKind.AdvancePhase] = () =>
                facilitator.HandleAsync(new AdvancePhaseCommand(Identity, Caller)),
            [WorkshopIntentKind.PoseNextQuestion] = () =>
                facilitator.HandleAsync(new PoseNextQuestionCommand(Identity, Caller)),
            [WorkshopIntentKind.RevealAnswer] = () =>
                facilitator.HandleAsync(new RevealAnswerCommand(Identity, Caller)),
            [WorkshopIntentKind.ShowLearningText] = () =>
                facilitator.HandleAsync(new ShowLearningTextCommand(Identity, Caller)),
            [WorkshopIntentKind.ReassignScribe] = () =>
                facilitator.HandleAsync(
                    new ReassignScribeCommand(
                        Identity,
                        Caller,
                        SessionFixtures.Ben.Value.ToString()
                    )
                ),
            [WorkshopIntentKind.GoToNextValue] = () =>
                facilitator.HandleAsync(new GoToNextValueCommand(Identity, Caller)),
            [WorkshopIntentKind.CloseVoting] = () =>
                facilitator.HandleAsync(new CloseVotingCommand(Identity, Caller)),
            [WorkshopIntentKind.StartTiebreakRound] = () =>
                facilitator.HandleAsync(new StartTiebreakRoundCommand(Identity, Caller)),
            [WorkshopIntentKind.RevealNextValue] = () =>
                facilitator.HandleAsync(new RevealNextValueCommand(Identity, Caller)),
            [WorkshopIntentKind.ChooseQuizAnswer] = () =>
                participant.HandleAsync(new ChooseQuizAnswerCommand(Identity, Voter, 0, 0)),
            [WorkshopIntentKind.SubmitValueSelection] = () =>
                participant.HandleAsync(
                    new SubmitValueSelectionCommand(Identity, Voter, CatalogValueIds())
                ),
            [WorkshopIntentKind.SubmitFinalVotes] = () =>
                participant.HandleAsync(
                    new SubmitFinalVotesCommand(
                        Identity,
                        Voter,
                        [new SubmitFinalVote("wert-1", VotingRounds.RequiredWinningValueCount)]
                    )
                ),
        };
    }

    internal IntentResult Execute(WorkshopIntentKind intentKind)
    {
        return intents[intentKind]().GetAwaiter().GetResult();
    }

    private static IReadOnlyList<string> CatalogValueIds()
    {
        return TestValueIds
            .Numbered(1, SelectionRound.ValuesPerSelection)
            .Select(valueId => valueId.Value)
            .ToList();
    }
}
