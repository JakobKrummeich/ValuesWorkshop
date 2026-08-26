using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorPresentationIntentTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly RecordingBroadcaster broadcaster = new();

    [Fact]
    public async Task Entering_value_presentation_opens_the_walk_on_the_first_groups_intro()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(Phase.GroupWork, formation: SubmittedGroups())
        );
        var handler = new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            [new PresentationOpening()]
        );

        var result = await handler.HandleAsync(
            new AdvancePhaseCommand(KnownSession, TestSessions.FacilitatorCaller)
        );

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValuePresentation);
        saved.Presentation.PresentingGroup.ShouldBe("tier-1");
        saved.Presentation.PresentedValue.ShouldBeNull();
    }

    private static FormationRecord SubmittedGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [SessionFixtures.Anna],
                    [new ValueId("wert-1")],
                    SessionFixtures.Anna,
                    true,
                    []
                ),
                Group.Restore(
                    "tier-2",
                    [SessionFixtures.Chris],
                    [new ValueId("wert-2")],
                    SessionFixtures.Chris,
                    true,
                    []
                ),
            ]
        );
    }

    [Fact]
    public async Task The_facilitator_steps_the_presentation_walk_to_the_next_value()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: SubmittedGroups(),
                presentation: PresentationWalk.Restore("tier-1", null, 0)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new GoToNextValueCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.ShouldBe(IntentResult.Accepted());
        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Presentation.PresentingGroup.ShouldBe("tier-1");
        saved.Presentation.PresentedValue.ShouldBe(new ValueId("wert-1"));
        broadcaster
            .Broadcasts.ShouldHaveSingleItem()
            .Presentation.PresentedValue.ShouldBe(new ValueId("wert-1"));
    }

    [Fact]
    public async Task Another_subject_may_not_step_the_presentation_walk()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: SubmittedGroups(),
                presentation: PresentationWalk.Restore("tier-1", null, 0)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new GoToNextValueCommand(KnownSession, new CallerSubject("someone-else")));

        ShouldBeRejectedAsNotAuthorized(result, repository);
    }

    [Fact]
    public async Task A_step_beyond_the_last_value_is_rejected_as_an_invariant_violation()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: SubmittedGroups(),
                presentation: PresentationWalk.Restore("tier-2", new ValueId("wert-2"), 2)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(new GoToNextValueCommand(KnownSession, TestSessions.FacilitatorCaller));

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task The_facilitator_corrects_a_presented_actions_wording()
    {
        var actionId = Guid.NewGuid();
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: PresentingGroups(actionId),
                presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new CorrectActionWordingCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    actionId.ToString(),
                    "  We speak openly about mistakes  "
                )
            );

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Formation.Groups[0]
            .Actions.ShouldHaveSingleItem()
            .Text.Value.ShouldBe("We speak openly about mistakes");
    }

    [Fact]
    public async Task A_wording_correction_with_a_malformed_action_id_is_rejected()
    {
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: PresentingGroups(Guid.NewGuid()),
                presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new CorrectActionWordingCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    "not-a-uuid",
                    "Corrected"
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_wording_correction_on_a_group_intro_is_rejected()
    {
        var actionId = Guid.NewGuid();
        var repository = FakeSessionRepository.Holding(
            SessionFixtures.InPhase(
                Phase.ValuePresentation,
                formation: PresentingGroups(actionId),
                presentation: PresentationWalk.Restore("tier-1", null, 0)
            )
        );

        var result = await HandlerOver(repository)
            .HandleAsync(
                new CorrectActionWordingCommand(
                    KnownSession,
                    TestSessions.FacilitatorCaller,
                    actionId.ToString(),
                    "Corrected"
                )
            );

        result.Code.ShouldBe(IntentRejectionCode.InvariantViolated);
        repository.Saved.ShouldBeEmpty();
    }

    private static FormationRecord PresentingGroups(Guid actionId)
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [SessionFixtures.Anna],
                    [new ValueId("wert-1")],
                    SessionFixtures.Anna,
                    true,
                    [
                        new GroupAction(
                            new ActionId(actionId),
                            new ValueId("wert-1"),
                            GroupActionText.Of("We start meetings on time")
                        ),
                    ]
                ),
            ]
        );
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

    private FacilitatorIntentHandler HandlerOver(FakeSessionRepository repository)
    {
        return new FacilitatorIntentHandler(
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            []
        );
    }
}
