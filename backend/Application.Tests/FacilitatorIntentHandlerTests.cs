using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorIntentHandlerTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task The_facilitator_advances_the_phase()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        broadcaster
            .Broadcasts.ShouldHaveSingleItem()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
    }

    [Fact]
    public async Task Another_subject_may_not_advance_the_phase()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, new CallerSubject("someone-else")));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
        (await repository.LoadAsync(KnownSession))
            .ShouldNotBeNull()
            .PhaseProgress.CurrentPhase.ShouldBe(Phase.Join);
    }

    [Fact]
    public async Task An_advance_blocked_by_an_exit_guard_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.GroupWork,
                formation: SessionFixtures.TwoGroups(),
                revision: 4
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();

        var stored = (await repository.LoadAsync(KnownSession)).ShouldNotBeNull();
        stored.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupWork);
        stored.Revision.ShouldBe(4);
    }

    [Fact]
    public async Task Entering_the_selection_results_fixes_the_top_value_set_widened_by_a_tie()
    {
        var selection = SelectionRound.Restore(
            TestValueIds
                .Numbered(1, 10)
                .Select(valueId => new SelectedValue(SessionFixtures.Anna, valueId))
                .Concat(
                    TestValueIds
                        .Numbered(3, 10)
                        .Select(valueId => new SelectedValue(SessionFixtures.Ben, valueId))
                ),
            []
        );
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValueSelection, selection: selection)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        saved.Selection.TopValues.ShouldBe(
            TestValueIds
                .Numbered(3, 8)
                .Concat([
                    new ValueId("wert-1"),
                    new ValueId("wert-2"),
                    new ValueId("wert-11"),
                    new ValueId("wert-12"),
                ])
                .ToList(),
            ignoreOrder: true
        );
    }

    [Fact]
    public async Task Entering_group_formation_forms_the_groups()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InSelectionResults());

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupFormation);
        saved.Formation.IsFormed.ShouldBeTrue();
        var group = saved.Formation.Groups.ShouldHaveSingleItem();
        group.Name.ShouldBe("tier-1");
        group.Members.ShouldBe(
            [SessionFixtures.Anna, SessionFixtures.Ben, SessionFixtures.Chris],
            ignoreOrder: true
        );
        group.AssignedValues.ShouldBe(saved.Selection.TopValues, ignoreOrder: true);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Formation.IsFormed.ShouldBeTrue();
    }

    [Fact]
    public async Task Every_registered_phase_entry_action_runs_after_an_advance()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InPhase(Phase.Join));
        var recorder = new RecordingPhaseEntryAction();
        var handler = new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            [recorder]
        );

        var result = await handler.HandleAsync(
            new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller)
        );

        result.ShouldBe(IntentResult.Accepted());
        recorder.SeenPhases.ShouldHaveSingleItem().ShouldBe(Phase.Quiz);
    }

    [Fact]
    public async Task A_failing_solver_propagates_loudly()
    {
        var repository = FakeSessionRepository.Holding(SessionFixtures.InSelectionResults());
        var handler = HandlerOver(repository, new ThrowingGroupSolver());

        await Should.ThrowAsync<InvalidOperationException>(() =>
            handler.HandleAsync(
                new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller)
            )
        );

        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task An_advance_past_the_last_phase_stays_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.FinalPresentation)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_facilitator_reveals_the_answer_of_the_current_question()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, false, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealAnswerCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.IsRevealed.ShouldBeTrue();
        broadcaster.Broadcasts.ShouldHaveSingleItem().Quiz.IsRevealed.ShouldBeTrue();
    }

    [Fact]
    public async Task The_facilitator_shows_the_learning_text_once_the_answer_is_revealed()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, true, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new ShowLearningTextCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.IsLearningTextShown.ShouldBeTrue();
    }

    [Fact]
    public async Task The_facilitator_poses_the_next_question_from_the_catalog()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, true, true, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new PoseNextQuestionCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldHaveSingleItem().Quiz.CurrentQuestionIndex.ShouldBe(1);
    }

    [Fact]
    public async Task Posing_past_the_last_catalog_question_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(4, true, true, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new PoseNextQuestionCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Another_subject_may_not_reveal_the_answer()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, false, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new RevealAnswerCommand(KnownSession, new CallerSubject("someone-else")));

        ShouldBeRejectedAsNotAuthorized(result, repository);
    }

    [Fact]
    public async Task Another_subject_may_not_show_the_learning_text()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, true, false, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ShowLearningTextCommand(KnownSession, new CallerSubject("someone-else"))
            );

        ShouldBeRejectedAsNotAuthorized(result, repository);
    }

    [Fact]
    public async Task Another_subject_may_not_pose_the_next_question()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.Quiz, quiz: QuizProgress.Restore(0, true, true, []))
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new PoseNextQuestionCommand(KnownSession, new CallerSubject("someone-else"))
            );

        ShouldBeRejectedAsNotAuthorized(result, repository);
    }

    [Fact]
    public async Task The_facilitator_hands_the_scribe_role_to_another_member()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Ben.Value.ToString()
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Scribe.ShouldBe(SessionFixtures.Ben);
        broadcaster.Broadcasts.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task Reassigning_the_current_scribe_changes_nothing()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Anna.Value.ToString()
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reassign_target_off_the_roster_is_rejected_as_an_unknown_participant()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    Guid.NewGuid().ToString()
                )
            );

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.UnknownParticipant);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reassign_target_outside_every_group_is_rejected_as_an_invariant_violation()
    {
        var groupsWithoutChris = FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [SessionFixtures.Ben, SessionFixtures.Anna],
                    [new ValueId("wert-1")],
                    SessionFixtures.Anna,
                    false,
                    []
                ),
            ]
        );
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: groupsWithoutChris)
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Chris.Value.ToString()
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_participant_identifier_that_is_not_a_uuid_is_rejected_as_a_malformed_payload()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    "not-a-uuid"
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Reassigning_before_the_group_work_phase_is_rejected_as_a_wrong_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupFormation, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Ben.Value.ToString()
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.WrongPhase);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Reassigning_stays_available_after_the_group_work_phase()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.ValuePresentation, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Ben.Value.ToString()
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Scribe.ShouldBe(SessionFixtures.Ben);
    }

    [Fact]
    public async Task Another_subject_may_not_reassign_the_scribe()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    new CallerSubject("someone-else"),
                    SessionFixtures.Ben.Value.ToString()
                )
            );

        ShouldBeRejectedAsNotAuthorized(result, repository);
    }

    [Fact]
    public async Task A_reassigned_scribe_loses_the_role_the_moment_the_new_one_gains_it()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SessionFixtures.TwoGroups())
        );

        var reassignment = await HandlerOver(repository)
            .HandleAsync(
                new ReassignScribeCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    SessionFixtures.Ben.Value.ToString()
                )
            );
        reassignment.ShouldBe(IntentResult.Accepted());

        var reassignedRepository = FakeSessionRepository.Holding(repository.Saved.Single());
        var participantHandler = new ParticipantIntentHandler(
            new IntentPipeline(new SessionCommandHandler(reassignedRepository, broadcaster)),
            new TestValuesCatalog(50)
        );

        var oldScribeAttempt = await participantHandler.HandleAsync(
            new AddActionCommand(KnownSession, SessionFixtures.Anna, "wert-1", "Talk")
        );
        oldScribeAttempt.IsAccepted.ShouldBeFalse();
        oldScribeAttempt.Code.ShouldBe(IntentRejectionCode.NotAuthorized);

        var newScribeAttempt = await participantHandler.HandleAsync(
            new AddActionCommand(KnownSession, SessionFixtures.Ben, "wert-1", "Talk")
        );
        newScribeAttempt.ShouldBe(IntentResult.Accepted());
        reassignedRepository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem();
    }

    private void ShouldBeRejectedAsNotAuthorized(
        IntentResult result,
        FakeSessionRepository repository
    )
    {
        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.NotAuthorized);
        result.Detail.ShouldNotBeNullOrWhiteSpace();
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    private FacilitatorIntentHandler HandlerOver(
        FakeSessionRepository repository,
        IGroupSolver? groupSolverPort = null
    )
    {
        return new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            [new GroupFormation(groupSolverPort ?? new TestGroupSolver(), new TestGroupNames(8))]
        );
    }

    private sealed class RecordingPhaseEntryAction : IPhaseEntryAction
    {
        public List<Phase> SeenPhases { get; } = [];

        public void ExecuteFor(Session session)
        {
            SeenPhases.Add(session.PhaseProgress.CurrentPhase);
        }
    }
}
