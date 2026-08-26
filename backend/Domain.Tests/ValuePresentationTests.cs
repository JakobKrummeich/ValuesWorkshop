namespace ValuesWorkshop.Domain.Tests;

public class ValuePresentationTests
{
    private static readonly ValueId Honesty = new("honesty");
    private static readonly ValueId Courage = new("courage");

    [Fact]
    public void The_facilitator_steps_the_walk_to_the_next_value()
    {
        var session = SessionPresenting("otter", presentedValue: null);

        ValuePresentation.GoToNextValue(session);

        session.Presentation.PresentedValue.ShouldBe(Honesty);
    }

    [Fact]
    public void The_walk_is_stepped_only_during_value_presentation()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.GroupWork,
            formation: Formation(),
            presentation: PresentationWalk.Restore("otter", null, 0)
        );

        Should.Throw<WrongPhaseException>(() => ValuePresentation.GoToNextValue(session));
    }

    [Fact]
    public void A_presented_actions_wording_is_corrected()
    {
        var session = SessionPresenting("otter", Honesty);
        var actionId = ActionIdOf(session, Honesty);

        ValuePresentation.CorrectActionWording(
            session,
            actionId,
            GroupActionText.Of("We speak openly about mistakes")
        );

        PresentedTextOf(session, actionId).ShouldBe("We speak openly about mistakes");
    }

    [Fact]
    public void Wording_is_corrected_only_during_value_presentation()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.GroupWork,
            formation: Formation(),
            presentation: PresentationWalk.Restore("otter", Honesty, 1)
        );

        Should.Throw<WrongPhaseException>(() =>
            ValuePresentation.CorrectActionWording(
                session,
                ActionIdOf(session, Honesty),
                GroupActionText.Of("Corrected")
            )
        );
    }

    [Fact]
    public void Wording_is_not_corrected_on_a_group_intro()
    {
        var session = SessionPresenting("otter", presentedValue: null);

        Should.Throw<InvariantViolationException>(() =>
            ValuePresentation.CorrectActionWording(
                session,
                ActionIdOf(session, Honesty),
                GroupActionText.Of("Corrected")
            )
        );
    }

    [Fact]
    public void Wording_is_not_corrected_on_another_values_action()
    {
        var session = SessionPresenting("otter", Honesty);

        Should.Throw<InvariantViolationException>(() =>
            ValuePresentation.CorrectActionWording(
                session,
                ActionIdOf(session, Courage),
                GroupActionText.Of("Corrected")
            )
        );
    }

    [Fact]
    public void A_presented_action_keeps_a_non_empty_text()
    {
        var session = SessionPresenting("otter", Honesty);
        var actionId = ActionIdOf(session, Honesty);

        Should.Throw<InvariantViolationException>(() =>
            ValuePresentation.CorrectActionWording(session, actionId, GroupActionText.Of("   "))
        );

        PresentedTextOf(session, actionId).ShouldBe("We start meetings on time");
    }

    [Fact]
    public void An_unknown_action_cannot_be_reworded()
    {
        var session = SessionPresenting("otter", Honesty);

        Should.Throw<InvariantViolationException>(() =>
            ValuePresentation.CorrectActionWording(
                session,
                new ActionId(Guid.NewGuid()),
                GroupActionText.Of("Corrected")
            )
        );
    }

    [Fact]
    public void The_presented_actions_are_the_presenting_groups_actions_on_the_presented_value()
    {
        var session = SessionPresenting("otter", Honesty);

        var presentedActions = ValuePresentation.PresentedActionsOf(session);

        presentedActions.ShouldHaveSingleItem().Text.Value.ShouldBe("We start meetings on time");
    }

    [Fact]
    public void A_group_intro_presents_no_actions()
    {
        var session = SessionPresenting("otter", presentedValue: null);

        ValuePresentation.PresentedActionsOf(session).ShouldBeEmpty();
    }

    private static Session SessionPresenting(string groupName, ValueId? presentedValue)
    {
        return TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.ValuePresentation,
            formation: Formation(),
            presentation: PresentationWalk.Restore(
                groupName,
                presentedValue,
                presentedValue is null ? 0 : 1
            )
        );
    }

    private static FormationRecord Formation()
    {
        var member = new ParticipantId(Guid.NewGuid());

        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "otter",
                    [member],
                    [Honesty, Courage],
                    member,
                    true,
                    [
                        new GroupAction(
                            new ActionId(Guid.NewGuid()),
                            Honesty,
                            GroupActionText.Of("We start meetings on time")
                        ),
                        new GroupAction(
                            new ActionId(Guid.NewGuid()),
                            Courage,
                            GroupActionText.Of("We ask before assuming")
                        ),
                    ]
                ),
            ]
        );
    }

    private static ActionId ActionIdOf(Session session, ValueId valueId)
    {
        return session
            .Formation.Groups[0]
            .Actions.First(action => action.ValueId == valueId)
            .ActionId;
    }

    private static string PresentedTextOf(Session session, ActionId actionId)
    {
        return session
            .Formation.Groups[0]
            .Actions.First(action => action.ActionId == actionId)
            .Text.Value;
    }
}
