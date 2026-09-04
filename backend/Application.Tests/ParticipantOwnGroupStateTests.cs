using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class ParticipantOwnGroupStateTests
{
    [Fact]
    public void Own_group_carries_the_animal_name_members_in_formation_order_and_value_texts()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantGroupFormationState>()
            .Formation.ShouldBeOfType<ParticipantFormedView>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.Name.ShouldBe(
            new GroupNameView("tier-1", new LocalizedTextView("Tier 1", "Animal 1"))
        );
        ownGroup.MemberDisplayNames.ShouldBe(["Ben", "Anna Schmidt"]);
        ownGroup.AssignedValues.ShouldBe([
            new WorkshopValueView("wert-1", new LocalizedTextView("Wert 1", "Value 1")),
        ]);
    }

    [Fact]
    public void Own_group_describes_only_the_callers_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Chris)
            .ShouldBeOfType<ParticipantGroupFormationState>()
            .Formation.ShouldBeOfType<ParticipantFormedView>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.Name.AnimalId.ShouldBe("tier-2");
        ownGroup.MemberDisplayNames.ShouldBe(["#c3c3c3"]);
    }

    [Fact]
    public void Own_group_carries_no_group_work_fields_before_the_group_work_phase()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantGroupFormationState>()
            .Formation.ShouldBeOfType<ParticipantFormedView>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.IsCallerScribe.ShouldBeNull();
        ownGroup.ScribeName.ShouldBeNull();
        ownGroup.WorkStatus.ShouldBeNull();
        ownGroup.Actions.ShouldBeNull();
    }

    [Fact]
    public void Own_group_names_the_scribe_and_flags_the_scribe_caller_during_group_work()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var scribeView = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantGroupWorkState>()
            .OwnGroup.ShouldNotBeNull();
        var memberView = Map(session, caller: SessionFixtures.Ben)
            .ShouldBeOfType<ParticipantGroupWorkState>()
            .OwnGroup.ShouldNotBeNull();

        scribeView.IsCallerScribe.ShouldBe(true);
        scribeView.ScribeName.ShouldBe("Anna Schmidt");
        scribeView.WorkStatus.ShouldBe(GroupWorkStatus.Editing);
        scribeView.Actions.ShouldNotBeNull().ShouldBeEmpty();
        memberView.IsCallerScribe.ShouldBe(false);
        memberView.ScribeName.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void Own_group_reports_a_submitted_work_status()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Chris)
            .ShouldBeOfType<ParticipantGroupWorkState>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
    }

    [Fact]
    public void Own_group_actions_ride_in_group_order_with_their_sort_order()
    {
        var firstAction = new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01"));
        var secondAction = new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac02"));
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(firstAction, new ValueId("wert-1"), GroupActionText.Of("Talk")),
                new GroupAction(secondAction, new ValueId("wert-1"), GroupActionText.Of("Listen"))
            )
        );

        var ownGroup = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantGroupWorkState>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.Actions.ShouldBe([
            new GroupActionView(firstAction.Value, "wert-1", "Talk", 0),
            new GroupActionView(secondAction.Value, "wert-1", "Listen", 1),
        ]);
    }

    [Fact]
    public void A_caller_who_is_in_no_group_of_a_formed_session_fails_loudly()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        Should
            .Throw<InvalidOperationException>(() =>
                Map(session, caller: new ParticipantId(Guid.NewGuid()))
            )
            .Message.ShouldBe("Once the groups stand, every participant belongs to one of them.");
    }

    [Fact]
    public void A_group_named_after_an_unknown_animal_fails_loudly()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore(
                        "tier-99",
                        [SessionFixtures.Anna],
                        [new ValueId("wert-1")],
                        null,
                        false,
                        []
                    ),
                ]
            )
        );

        Should
            .Throw<InvalidOperationException>(() => Map(session))
            .Message.ShouldContain("tier-99");
    }

    [Fact]
    public void An_assigned_value_missing_from_the_catalog_fails_loudly()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore(
                        "tier-1",
                        [SessionFixtures.Anna],
                        [new ValueId("wert-999")],
                        null,
                        false,
                        []
                    ),
                ]
            )
        );

        Should
            .Throw<InvalidOperationException>(() => Map(session))
            .Message.ShouldContain("wert-999");
    }

    [Fact]
    public void Final_voting_state_still_names_the_callers_own_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            formation: SessionFixtures.TwoGroups(),
            voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 2))
        );

        var ownGroup = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantFinalVotingState>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.Name.AnimalId.ShouldBe("tier-1");
        ownGroup.MemberDisplayNames.ShouldBe(["Ben", "Anna Schmidt"]);
        ownGroup.WorkStatus.ShouldBeNull();
        ownGroup.Actions.ShouldBeNull();
    }

    [Fact]
    public void Final_presentation_state_still_names_the_callers_own_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Chris)
            .ShouldBeOfType<ParticipantFinalPresentationState>()
            .OwnGroup.ShouldNotBeNull();

        ownGroup.Name.AnimalId.ShouldBe("tier-2");
        ownGroup.WorkStatus.ShouldBeNull();
        ownGroup.Actions.ShouldBeNull();
    }

    [Fact]
    public void A_caller_of_no_group_votes_and_watches_the_finale_without_one()
    {
        var caller = new ParticipantId(Guid.Parse("abcdef12-0000-4000-8000-000000000009"));

        Map(
                SessionFixtures.InPhase(
                    Phase.FinalVoting,
                    formation: SessionFixtures.TwoGroups(),
                    voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 2))
                ),
                caller
            )
            .ShouldBeOfType<ParticipantFinalVotingState>()
            .OwnGroup.ShouldBeNull();
        Map(
                SessionFixtures.InPhase(
                    Phase.FinalPresentation,
                    formation: SessionFixtures.TwoGroups()
                ),
                caller
            )
            .ShouldBeOfType<ParticipantFinalPresentationState>()
            .OwnGroup.ShouldBeNull();
    }

    private static ParticipantWorkshopState Map(Session session, ParticipantId? caller = null)
    {
        return TestMappers
            .Participant()
            .MapFor(session, caller ?? SessionFixtures.Anna, revision: 1);
    }
}
