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
    public async Task A_null_selection_is_rejected_as_a_malformed_payload_without_a_fallback()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValueSelection)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new SubmitValueSelectionCommand(KnownSession, SessionFixtures.Anna, null));

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
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

    private static readonly ActionId KnownAction = new(
        Guid.Parse("00000000-0000-0000-0000-00000000ac10")
    );

    private static Session GroupWorkSession(params GroupAction[] tierOneActions)
    {
        return SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups(tierOneActions)
        );
    }

    private static GroupAction TierOneAction(ActionId actionId, string text)
    {
        return new GroupAction(actionId, new ValueId("wert-1"), GroupActionText.Of(text));
    }

    [Fact]
    public async Task The_scribe_adds_an_action_for_an_assigned_value()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(
                new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-1", " Talk daily. ")
            );

        result.ShouldBe(IntentResult.Accepted());
        var action = repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem();
        action.ValueId.ShouldBe(new ValueId("wert-1"));
        action.Text.Value.ShouldBe("Talk daily.");
        action.ActionId.Value.ShouldNotBe(Guid.Empty);
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task A_group_member_that_is_not_the_scribe_is_rejected_as_not_authorized()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new AddActionCommand(KnownSession, SessionFixtures.Ben, "wert-1", "Talk"));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_blank_action_text_is_accepted_during_editing()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-1", "   "));

        result.IsAccepted.ShouldBeTrue();
        repository.Saved.ShouldNotBeEmpty();
    }

    [Fact]
    public async Task A_null_payload_is_rejected_as_a_malformed_payload_without_a_fallback()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());
        var handler = HandlerOver(repository);

        var addResult = await handler.HandleAsync(
            new AddActionCommand(KnownSession, SessionFixtures.Anna, null, null)
        );
        var editResult = await handler.HandleAsync(
            new EditActionCommand(KnownSession, SessionFixtures.Anna, null, null)
        );
        var removeResult = await handler.HandleAsync(
            new RemoveActionCommand(KnownSession, SessionFixtures.Anna, null)
        );

        addResult.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        editResult.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        removeResult.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_blank_value_identifier_is_rejected_as_a_malformed_payload()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new AddActionCommand(KnownSession, SessionFixtures.Anna, "  ", "Talk"));

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_action_for_a_value_of_another_group_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(
                new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-2", "Talk")
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_sixth_action_on_one_value_is_rejected_as_an_invariant_violation()
    {
        var fiveActions = Enumerable
            .Range(1, 5)
            .Select(actionNumber =>
                TierOneAction(new ActionId(Guid.NewGuid()), $"Action {actionNumber}")
            )
            .ToArray();
        var repository = FakeSessionRepository.Holding(GroupWorkSession(fiveActions));

        var result = await HandlerOver(repository)
            .HandleAsync(
                new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-1", "One more")
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Adding_an_action_outside_the_group_work_phase_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupFormation, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-1", "Talk")
            );

        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_scribe_edits_an_action_of_the_own_group()
    {
        var repository = FakeSessionRepository.Holding(
            GroupWorkSession(TierOneAction(KnownAction, "Old wording"))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new EditActionCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    KnownAction.Value.ToString(),
                    "New wording"
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem()
            .Text.Value.ShouldBe("New wording");
    }

    [Fact]
    public async Task An_action_identifier_that_is_not_a_uuid_is_rejected_as_a_malformed_payload()
    {
        var repository = FakeSessionRepository.Holding(
            GroupWorkSession(TierOneAction(KnownAction, "Old wording"))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new EditActionCommand(KnownSession, SessionFixtures.Anna, "not-a-uuid", "New")
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Editing_an_action_the_group_does_not_hold_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(
                new EditActionCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    Guid.NewGuid().ToString(),
                    "New wording"
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Editing_a_submitted_result_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(
                new EditActionCommand(
                    KnownSession,
                    SessionFixtures.Chris,
                    Guid.NewGuid().ToString(),
                    "New wording"
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_scribe_removes_an_action_of_the_own_group()
    {
        var repository = FakeSessionRepository.Holding(
            GroupWorkSession(TierOneAction(KnownAction, "Obsolete"))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new RemoveActionCommand(
                    KnownSession,
                    SessionFixtures.Anna,
                    KnownAction.Value.ToString()
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].Actions.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_scribe_submits_a_result_with_an_action_for_every_assigned_value()
    {
        var repository = FakeSessionRepository.Holding(
            GroupWorkSession(TierOneAction(KnownAction, "Talk"))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new SubmitGroupWorkCommand(KnownSession, SessionFixtures.Anna));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[0].IsSubmitted.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Submitting_with_a_value_at_zero_actions_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new SubmitGroupWorkCommand(KnownSession, SessionFixtures.Anna));

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Submitting_an_already_submitted_result_changes_nothing()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new SubmitGroupWorkCommand(KnownSession, SessionFixtures.Chris));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_scribe_reopens_a_submitted_result()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new ReopenGroupWorkCommand(KnownSession, SessionFixtures.Chris));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Formation.Groups[1].IsSubmitted.ShouldBeFalse();
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Reopening_a_result_that_is_still_editable_changes_nothing()
    {
        var repository = FakeSessionRepository.Holding(GroupWorkSession());

        var result = await HandlerOver(repository)
            .HandleAsync(new ReopenGroupWorkCommand(KnownSession, SessionFixtures.Anna));

        result.ShouldBe(IntentResult.Accepted());
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
