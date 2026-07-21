namespace ValuesWorkshop.Domain.Tests;

public class GroupTests
{
    [Fact]
    public void New_group_keeps_name_members_and_assigned_values()
    {
        var members = new[] { new ParticipantId(Guid.NewGuid()) };
        var values = new[] { new ValueId("vertrauen") };

        var group = new Group("Otter", members, values);

        Assert.Equal("Otter", group.Name);
        Assert.Equal(members, group.Members);
        Assert.Equal(values, group.AssignedValues);
        Assert.Null(group.Scribe);
        Assert.False(group.IsSubmitted);
    }
}
