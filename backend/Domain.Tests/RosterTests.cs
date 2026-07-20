namespace ValuesWorkshop.Domain.Tests;

public class RosterTests
{
    [Fact]
    public void New_roster_has_no_participants()
    {
        Assert.Empty(new Roster().Participants);
    }
}
