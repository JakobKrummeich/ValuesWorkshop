namespace ValuesWorkshop.Domain.Tests;

public class GroupTests
{
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
    }
}
