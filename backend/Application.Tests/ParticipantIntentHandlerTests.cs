using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class ParticipantIntentHandlerTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly IReadOnlyList<string> TenValueIds = Enumerable
        .Range(1, 10)
        .Select(valueNumber => $"wert-{valueNumber}")
        .ToList();

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task A_participant_answers_the_current_question()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, false, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new ChooseQuizAnswerCommand(KnownSession, SessionFixtures.Anna, 0, 2));

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Quiz.CastAnswers.ShouldBe([new CastAnswer(0, SessionFixtures.Anna, 2)]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Quiz.AnsweredCount.ShouldBe(1);
    }

    [Fact]
    public async Task An_out_of_range_answer_index_is_rejected_as_a_malformed_payload()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, false, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new ChooseQuizAnswerCommand(KnownSession, SessionFixtures.Anna, 0, 3));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Answering_the_same_question_twice_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.Quiz,
                quiz: QuizProgress.Restore(
                    0,
                    false,
                    false,
                    [new CastAnswer(0, SessionFixtures.Anna, 1)]
                )
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new ChooseQuizAnswerCommand(KnownSession, SessionFixtures.Anna, 0, 2));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Answering_a_question_that_is_not_current_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(1, false, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new ChooseQuizAnswerCommand(KnownSession, SessionFixtures.Anna, 0, 2));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_caller_that_never_joined_is_rejected_as_not_authorized()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, false, false, []))
        );
        var stranger = new ParticipantId(Guid.Parse("00000000-0000-0000-0000-0000000000ff"));

        var result = await HandlerOver(repository)
            .HandleAsync(new ChooseQuizAnswerCommand(KnownSession, stranger, 0, 2));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_participant_submits_ten_values_exactly_once()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValueSelection)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitValueSelectionCommand(KnownSession, SessionFixtures.Anna, TenValueIds)
            );

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Selection.SubmittedBy.ShouldBe([SessionFixtures.Anna]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Selection.SubmittedBy.Count.ShouldBe(1);
    }

    [Fact]
    public async Task A_selection_of_nine_values_is_rejected_as_a_malformed_payload()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValueSelection)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitValueSelectionCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    TenValueIds.Take(9).ToList()
                )
            );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Submitting_a_second_selection_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValueSelection,
                selection: SelectionRound.Restore(
                    TenValueIds.Select(valueId => new SelectedValue(
                        SessionFixtures.Anna,
                        new ValueId(valueId)
                    )),
                    []
                )
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new SubmitValueSelectionCommand(KnownSession, SessionFixtures.Anna, TenValueIds)
            );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    private ParticipantIntentHandler HandlerOver(FakeSessionRepository repository)
    {
        return new ParticipantIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            new TestValuesCatalog(50)
        );
    }
}
