namespace ValuesWorkshop.Domain.Tests;

public class SessionTests
{
    [Fact]
    public void New_session_starts_with_all_building_blocks_in_initial_state()
    {
        var session = new Session();

        Assert.Equal(Phase.Join, session.State.CurrentPhase);
        Assert.Empty(session.Roster.Participants);
        Assert.Null(session.Quiz.CurrentQuestion);
        Assert.Empty(session.Selection.TopValues);
        Assert.False(session.Formation.IsFormed);
        Assert.Null(session.Presentation.PresentedValue);
        Assert.Empty(session.Voting.WinningValues);
    }
}
