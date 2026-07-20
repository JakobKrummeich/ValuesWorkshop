namespace ValuesWorkshop.Domain.Tests;

public class FormationRecordTests
{
    [Fact]
    public void Initially_groups_are_not_formed()
    {
        var record = new FormationRecord();

        Assert.False(record.IsFormed);
        Assert.Empty(record.Groups);
    }
}
