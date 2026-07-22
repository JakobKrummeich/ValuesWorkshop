namespace ValuesWorkshop.Domain.Tests;

public class SessionTests
{
    [Fact]
    public void New_session_starts_with_all_building_blocks_in_initial_state()
    {
        var session = new Session();

        session.State.CurrentPhase.ShouldBe(Phase.Join);
        session.Roster.Participants.ShouldBeEmpty();
        session.Quiz.CurrentQuestion.ShouldBeNull();
        session.Selection.TopValues.ShouldBeEmpty();
        session.Formation.IsFormed.ShouldBeFalse();
        session.Presentation.PresentedValue.ShouldBeNull();
        session.Voting.WinningValues.ShouldBeEmpty();
    }
}
