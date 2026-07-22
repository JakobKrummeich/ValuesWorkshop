namespace ValuesWorkshop.Domain.Tests;

public class FormationRecordTests
{
    [Fact]
    public void Initially_groups_are_not_formed()
    {
        var record = new FormationRecord();

        record.IsFormed.ShouldBeFalse();
        record.Groups.ShouldBeEmpty();
    }
}
