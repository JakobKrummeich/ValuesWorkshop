namespace ValuesWorkshop.Domain.Tests;

public class PresentationWalkTests
{
    private static readonly ValueId Honesty = new("honesty");
    private static readonly ValueId Courage = new("courage");
    private static readonly ValueId Trust = new("trust");

    [Fact]
    public void Initially_nothing_is_presented()
    {
        var walk = new PresentationWalk();

        walk.PresentingGroup.ShouldBeNull();
        walk.PresentedValue.ShouldBeNull();
    }

    [Fact]
    public void Opening_stands_the_walk_on_the_first_groups_intro()
    {
        var walk = new PresentationWalk();

        walk.Open(Groups());

        walk.PresentingGroup.ShouldBe("otter");
        walk.PresentedValue.ShouldBeNull();
        walk.ShownValueCount.ShouldBe(0);
    }

    [Fact]
    public void Reopening_an_opened_walk_changes_nothing()
    {
        var walk = new PresentationWalk();
        walk.Open(Groups());
        walk.GoToNextValue(Groups());

        walk.Open(Groups());

        walk.PresentingGroup.ShouldBe("otter");
        walk.PresentedValue.ShouldBe(Honesty);
    }

    [Fact]
    public void Opening_without_groups_leaves_the_walk_unopened()
    {
        var walk = new PresentationWalk();

        walk.Open([]);

        walk.PresentingGroup.ShouldBeNull();
    }

    [Fact]
    public void The_step_after_a_group_intro_presents_that_groups_first_value()
    {
        var walk = new PresentationWalk();
        walk.Open(Groups());

        walk.GoToNextValue(Groups());

        walk.PresentingGroup.ShouldBe("otter");
        walk.PresentedValue.ShouldBe(Honesty);
        walk.ShownValueCount.ShouldBe(1);
    }

    [Fact]
    public void The_step_after_a_value_presents_the_groups_next_value()
    {
        var walk = new PresentationWalk();
        walk.Open(Groups());
        walk.GoToNextValue(Groups());

        walk.GoToNextValue(Groups());

        walk.PresentingGroup.ShouldBe("otter");
        walk.PresentedValue.ShouldBe(Courage);
        walk.ShownValueCount.ShouldBe(2);
    }

    [Fact]
    public void The_step_after_a_groups_last_value_shows_the_next_groups_intro()
    {
        var walk = PresentationWalk.Restore("otter", Courage, 2);

        walk.GoToNextValue(Groups());

        walk.PresentingGroup.ShouldBe("fuchs");
        walk.PresentedValue.ShouldBeNull();
        walk.ShownValueCount.ShouldBe(2);
    }

    [Fact]
    public void A_restored_walk_steps_on_from_its_stored_position()
    {
        var walk = PresentationWalk.Restore("fuchs", null, 2);

        walk.GoToNextValue(Groups());

        walk.PresentingGroup.ShouldBe("fuchs");
        walk.PresentedValue.ShouldBe(Trust);
        walk.ShownValueCount.ShouldBe(3);
    }

    [Fact]
    public void The_step_on_the_last_groups_last_value_is_refused()
    {
        var walk = PresentationWalk.Restore("fuchs", Trust, 3);

        Should.Throw<InvariantViolationException>(() => walk.GoToNextValue(Groups()));

        walk.PresentingGroup.ShouldBe("fuchs");
        walk.PresentedValue.ShouldBe(Trust);
    }

    [Fact]
    public void An_unopened_walk_refuses_to_step()
    {
        var walk = new PresentationWalk();

        Should.Throw<InvariantViolationException>(() => walk.GoToNextValue(Groups()));
    }

    [Fact]
    public void A_group_without_assigned_values_shows_only_its_intro()
    {
        var groups = GroupsWithValues(("otter", [Honesty]), ("igel", []), ("fuchs", [Trust]));
        var walk = PresentationWalk.Restore("otter", Honesty, 1);

        walk.GoToNextValue(groups);
        walk.PresentingGroup.ShouldBe("igel");
        walk.PresentedValue.ShouldBeNull();

        walk.GoToNextValue(groups);
        walk.PresentingGroup.ShouldBe("fuchs");
        walk.PresentedValue.ShouldBeNull();
    }

    [Fact]
    public void The_walk_has_a_next_position_until_the_last_groups_last_value()
    {
        var walk = new PresentationWalk();
        walk.HasNextPosition(Groups()).ShouldBeFalse();

        walk.Open(Groups());
        walk.HasNextPosition(Groups()).ShouldBeTrue();

        walk.GoToNextValue(Groups());
        walk.GoToNextValue(Groups());
        walk.GoToNextValue(Groups());
        walk.HasNextPosition(Groups()).ShouldBeTrue();

        walk.GoToNextValue(Groups());
        walk.HasNextPosition(Groups()).ShouldBeFalse();
    }

    [Fact]
    public void The_presentation_is_complete_once_the_shown_count_reaches_the_presented_count()
    {
        var walk = PresentationWalk.Restore("fuchs", Trust, 3);

        walk.IsPresentationComplete(3).ShouldBeTrue();
        walk.IsPresentationComplete(4).ShouldBeFalse();
    }

    private static IReadOnlyList<Group> Groups()
    {
        return GroupsWithValues(("otter", [Honesty, Courage]), ("fuchs", [Trust]));
    }

    private static IReadOnlyList<Group> GroupsWithValues(
        params (string Name, ValueId[] Values)[] groups
    )
    {
        return groups
            .Select(group =>
            {
                var member = new ParticipantId(Guid.NewGuid());
                return Group.Restore(group.Name, [member], group.Values, member, true, []);
            })
            .ToList();
    }
}
