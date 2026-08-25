namespace ValuesWorkshop.Domain.Tests;

public class GroupTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());
    private static readonly ParticipantId Chris = new(Guid.NewGuid());
    private static readonly ValueId Trust = new("vertrauen");
    private static readonly ValueId Courage = new("mut");

    [Fact]
    public void New_group_keeps_name_members_and_assigned_values()
    {
        var members = new[] { new ParticipantId(Guid.NewGuid()) };
        var values = new[] { new ValueId("vertrauen") };

        var group = new Group("Otter", members, values);

        group.Name.ShouldBe("Otter");
        group.Members.ShouldBe(members);
        group.AssignedValues.ShouldBe(values);
        group.Scribe.ShouldBeNull();
        group.IsSubmitted.ShouldBeFalse();
        group.Actions.ShouldBeEmpty();
    }

    [Fact]
    public void Appointing_a_scribe_picks_the_member_the_randomness_names()
    {
        var group = new Group("Otter", [Anna, Ben, Chris], [Trust]);

        group.AppointScribe(new FixedRandomness(2));

        group.Scribe.ShouldBe(Chris);
    }

    [Fact]
    public void Appointing_again_keeps_the_first_scribe()
    {
        var group = new Group("Otter", [Anna, Ben, Chris], [Trust]);
        group.AppointScribe(new FixedRandomness(0));

        group.AppointScribe(new FixedRandomness(1));

        group.Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void Reassigning_hands_the_scribe_role_to_another_member()
    {
        var group = GroupWithScribe();

        group.ReassignScribe(Ben);

        group.Scribe.ShouldBe(Ben);
    }

    [Fact]
    public void Reassigning_to_someone_outside_the_group_is_refused()
    {
        var group = GroupWithScribe();

        Should.Throw<InvariantViolationException>(() =>
            group.ReassignScribe(new ParticipantId(Guid.NewGuid()))
        );

        group.Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void Reassigning_the_current_scribe_changes_nothing()
    {
        var group = GroupWithScribe();

        group.ReassignScribe(Anna);

        group.Scribe.ShouldBe(Anna);
    }

    [Fact]
    public void Reassigning_while_the_result_is_submitted_is_allowed()
    {
        var group = SubmittedGroup();

        group.ReassignScribe(Ben);

        group.Scribe.ShouldBe(Ben);
    }

    [Fact]
    public void The_scribe_adds_an_action_that_is_born_with_empty_text()
    {
        var group = GroupWithScribe();
        var actionId = new ActionId(Guid.NewGuid());

        group.AddAction(Anna, actionId, Trust);

        group.Actions.ShouldBe([new GroupAction(actionId, Trust, GroupActionText.Of(null))]);
    }

    [Fact]
    public void A_member_other_than_the_scribe_cannot_add_an_action()
    {
        var group = GroupWithScribe();

        Should.Throw<NotAuthorizedException>(() =>
            group.AddAction(Ben, new ActionId(Guid.NewGuid()), Trust)
        );

        group.Actions.ShouldBeEmpty();
    }

    [Fact]
    public void Nobody_adds_actions_while_no_scribe_is_appointed()
    {
        var group = new Group("Otter", [Anna, Ben, Chris], [Trust]);

        Should.Throw<NotAuthorizedException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust)
        );
    }

    [Fact]
    public void An_action_for_a_value_the_group_was_not_assigned_is_refused()
    {
        var group = GroupWithScribe();

        Should.Throw<InvariantViolationException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), new ValueId("fremd"))
        );

        group.Actions.ShouldBeEmpty();
    }

    [Fact]
    public void An_action_id_that_already_exists_in_the_group_is_refused()
    {
        var group = GroupWithScribe();
        var actionId = new ActionId(Guid.NewGuid());
        group.AddAction(Anna, actionId, Trust);

        Should.Throw<InvariantViolationException>(() => group.AddAction(Anna, actionId, Trust));

        group.Actions.Count.ShouldBe(1);
    }

    [Fact]
    public void The_sixth_action_for_the_same_value_is_refused()
    {
        var group = GroupWithScribe();
        for (var count = 1; count <= 5; count++)
        {
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust);
        }

        Should.Throw<InvariantViolationException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust)
        );

        group.Actions.Count.ShouldBe(5);
    }

    [Fact]
    public void A_value_restored_beyond_the_bound_accepts_no_further_action()
    {
        var overfullActions = Enumerable
            .Range(1, 6)
            .Select(number => new GroupAction(
                new ActionId(Guid.NewGuid()),
                Trust,
                GroupActionText.Of($"Action {number}")
            ))
            .ToList();
        var group = Group.Restore("fox", [Anna, Ben], [Trust], Anna, false, overfullActions);

        Should.Throw<InvariantViolationException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust)
        );

        group.Actions.Count.ShouldBe(6);
    }

    [Fact]
    public void A_sixth_action_still_fits_when_it_belongs_to_another_value()
    {
        var group = GroupWithScribe();
        for (var count = 1; count <= 5; count++)
        {
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust);
        }

        group.AddAction(Anna, new ActionId(Guid.NewGuid()), Courage);

        group.Actions.Count.ShouldBe(6);
    }

    [Fact]
    public void The_scribe_edits_an_action_and_its_place_in_the_list_survives()
    {
        var group = GroupWithScribe();
        var first = new ActionId(Guid.NewGuid());
        var second = new ActionId(Guid.NewGuid());
        group.AddAction(Anna, first, Trust);
        group.AddAction(Anna, second, Trust);
        group.EditAction(Anna, second, GroupActionText.Of("Listen first"));

        group.EditAction(Anna, first, GroupActionText.Of("Talk honestly"));

        group.Actions.ShouldBe([
            new GroupAction(first, Trust, GroupActionText.Of("Talk honestly")),
            new GroupAction(second, Trust, GroupActionText.Of("Listen first")),
        ]);
    }

    [Fact]
    public void Editing_an_action_the_group_does_not_hold_is_refused()
    {
        var group = GroupWithScribe();

        Should.Throw<InvariantViolationException>(() =>
            group.EditAction(Anna, new ActionId(Guid.NewGuid()), GroupActionText.Of("Talk"))
        );
    }

    [Fact]
    public void A_member_other_than_the_scribe_cannot_edit_an_action()
    {
        var group = GroupWithScribe();
        var actionId = new ActionId(Guid.NewGuid());
        group.AddAction(Anna, actionId, Trust);
        group.EditAction(Anna, actionId, GroupActionText.Of("Talk openly"));

        Should.Throw<NotAuthorizedException>(() =>
            group.EditAction(Ben, actionId, GroupActionText.Of("Hijacked"))
        );

        group.Actions[0].Text.ShouldBe(GroupActionText.Of("Talk openly"));
    }

    [Fact]
    public void The_scribe_removes_an_action()
    {
        var group = GroupWithScribe();
        var actionId = new ActionId(Guid.NewGuid());
        group.AddAction(Anna, actionId, Trust);

        group.RemoveAction(Anna, actionId);

        group.Actions.ShouldBeEmpty();
    }

    [Fact]
    public void Removing_an_action_the_group_does_not_hold_is_refused()
    {
        var group = GroupWithScribe();

        Should.Throw<InvariantViolationException>(() =>
            group.RemoveAction(Anna, new ActionId(Guid.NewGuid()))
        );
    }

    [Fact]
    public void A_member_other_than_the_scribe_cannot_remove_an_action()
    {
        var group = GroupWithScribe();
        var actionId = new ActionId(Guid.NewGuid());
        group.AddAction(Anna, actionId, Trust);

        Should.Throw<NotAuthorizedException>(() => group.RemoveAction(Ben, actionId));

        group.Actions.Count.ShouldBe(1);
    }

    [Fact]
    public void Submitting_needs_an_action_for_every_assigned_value()
    {
        var group = GroupWithScribe();
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Trust, "Talk");

        Should.Throw<InvariantViolationException>(() => group.Submit(Anna));

        group.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void Submitting_is_refused_when_any_action_has_empty_text()
    {
        var group = GroupWithScribe();
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Trust, "Talk");
        group.AddAction(Anna, new ActionId(Guid.NewGuid()), Courage);

        Should.Throw<InvariantViolationException>(() => group.Submit(Anna));

        group.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void The_scribe_submits_once_every_value_holds_an_action()
    {
        var group = GroupWithScribe();
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Trust, "Talk");
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Courage, "Dare");

        group.Submit(Anna);

        group.IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void Submitting_an_already_submitted_result_is_a_no_op()
    {
        var group = SubmittedGroup();

        group.Submit(Anna);

        group.IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void A_member_other_than_the_scribe_cannot_submit()
    {
        var group = GroupWithScribe();
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Trust, "Talk");
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Courage, "Dare");

        Should.Throw<NotAuthorizedException>(() => group.Submit(Ben));

        group.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void A_submitted_result_refuses_adding_editing_and_removing()
    {
        var group = SubmittedGroup();
        var existing = group.Actions[0].ActionId;

        Should.Throw<InvariantViolationException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust)
        );
        Should.Throw<InvariantViolationException>(() =>
            group.EditAction(Anna, existing, GroupActionText.Of("Changed"))
        );
        Should.Throw<InvariantViolationException>(() => group.RemoveAction(Anna, existing));
    }

    [Fact]
    public void The_scribe_reopens_a_submitted_result_and_edits_again()
    {
        var group = SubmittedGroup();

        group.Reopen(Anna);
        group.EditAction(Anna, group.Actions[0].ActionId, GroupActionText.Of("Changed"));

        group.IsSubmitted.ShouldBeFalse();
        group.Actions[0].Text.ShouldBe(GroupActionText.Of("Changed"));
    }

    [Fact]
    public void Reopening_a_result_that_is_still_open_is_a_no_op()
    {
        var group = GroupWithScribe();

        group.Reopen(Anna);

        group.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void A_member_other_than_the_scribe_cannot_reopen()
    {
        var group = SubmittedGroup();

        Should.Throw<NotAuthorizedException>(() => group.Reopen(Ben));

        group.IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public void The_new_scribe_works_where_the_old_one_is_refused()
    {
        var group = GroupWithScribe();

        group.ReassignScribe(Ben);

        Should.Throw<NotAuthorizedException>(() =>
            group.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust)
        );
        group.AddAction(Ben, new ActionId(Guid.NewGuid()), Trust);
        group.Actions.Count.ShouldBe(1);
    }

    [Fact]
    public void Restore_carries_the_actions_in_their_stored_order()
    {
        var actions = new[]
        {
            new GroupAction(new ActionId(Guid.NewGuid()), Trust, GroupActionText.Of("Talk")),
            new GroupAction(new ActionId(Guid.NewGuid()), Courage, GroupActionText.Of("Dare")),
        };

        var group = Group.Restore("Otter", [Anna], [Trust, Courage], Anna, true, actions);

        group.Actions.ShouldBe(actions);
        group.Scribe.ShouldBe(Anna);
        group.IsSubmitted.ShouldBeTrue();
    }

    private static Group GroupWithScribe()
    {
        var group = new Group("Otter", [Anna, Ben, Chris], [Trust, Courage]);
        group.AppointScribe(new FixedRandomness(0));

        return group;
    }

    private static Group SubmittedGroup()
    {
        var group = GroupWithScribe();
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Trust, "Talk");
        AddActionWithText(group, new ActionId(Guid.NewGuid()), Courage, "Dare");
        group.Submit(Anna);

        return group;
    }

    private static void AddActionWithText(
        Group group,
        ActionId actionId,
        ValueId valueId,
        string text
    )
    {
        group.AddAction(Anna, actionId, valueId);
        group.EditAction(Anna, actionId, GroupActionText.Of(text));
    }
}
