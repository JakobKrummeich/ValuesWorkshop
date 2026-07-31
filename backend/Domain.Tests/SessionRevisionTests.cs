namespace ValuesWorkshop.Domain.Tests;

public class SessionRevisionTests
{
    [Fact]
    public void A_new_session_starts_at_revision_zero()
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));

        session.Revision.ShouldBe(0);
    }

    [Fact]
    public void Bumping_moves_the_revision_forward_by_one()
    {
        var session = new Session(new SessionIdentity(Guid.NewGuid()));

        session.BumpRevision();
        session.BumpRevision();

        session.Revision.ShouldBe(2);
    }

    [Fact]
    public void A_restored_session_keeps_the_revision_it_was_persisted_with()
    {
        var session = Session.Restore(
            new SessionIdentity(Guid.NewGuid()),
            Roster.Restore([]),
            PhaseProgress.Restore(Phase.Quiz),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 7
        );

        session.Revision.ShouldBe(7);
    }
}
