namespace ValuesWorkshop.Domain.Tests;

public class SessionTests
{
    [Fact]
    public void New_session_starts_with_all_building_blocks_in_initial_state()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = new Session(identity);

        session.Identity.ShouldBe(identity);
        session.State.CurrentPhase.ShouldBe(Phase.Join);
        session.Roster.Participants.ShouldBeEmpty();
        session.Quiz.CurrentQuestion.ShouldBeNull();
        session.Selection.TopValues.ShouldBeEmpty();
        session.Formation.IsFormed.ShouldBeFalse();
        session.Presentation.PresentedValue.ShouldBeNull();
        session.Voting.WinningValues.ShouldBeEmpty();
    }
}
