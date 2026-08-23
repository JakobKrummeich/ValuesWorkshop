using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class WorkshopStateCacheTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly WorkshopStateCache cache = TestWorkshopStateCache.Create();

    [Fact]
    public void A_forming_session_is_mapped_afresh_and_never_retained()
    {
        var session = FormingSession();

        var first = cache.StatesOf(session);
        var second = cache.StatesOf(session);

        second.ShouldNotBeSameAs(first);
        cache.LatestOf(KnownSession).ShouldBeNull();
    }

    [Fact]
    public void A_session_that_starts_forming_drops_the_state_cached_before_it()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.SelectionResults);
        cache.StatesOf(session);

        session.AdvancePhase();
        cache.StatesOf(session);

        cache.LatestOf(KnownSession).ShouldBeNull();
    }

    private static Session FormingSession()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.SelectionResults);
        session.AdvancePhase();

        return session;
    }

    [Fact]
    public void An_unchanged_session_is_mapped_only_once()
    {
        var session = TestSessions.Open(KnownSession);
        session.BumpRevision();

        var first = cache.StatesOf(session);
        var second = cache.StatesOf(session);

        second.ShouldBeSameAs(first);
    }

    [Fact]
    public void A_new_revision_is_mapped_again()
    {
        var session = TestSessions.Open(KnownSession);
        session.BumpRevision();
        var first = cache.StatesOf(session);

        session.AdvancePhase();
        session.BumpRevision();
        var second = cache.StatesOf(session);

        second.ShouldNotBeSameAs(first);
        second.Revision.ShouldBe(2);
        second.Facilitator.Phase.ShouldBe(Phase.Quiz);
    }

    [Fact]
    public void Every_roster_participant_gets_their_own_mapped_state()
    {
        var session = TestSessions.Open(KnownSession);
        var anna = new ParticipantId(Guid.NewGuid());
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        session.BumpRevision();

        var states = cache.StatesOf(session);

        states.Participants.Keys.ShouldBe([anna]);
        states.Participants[anna].ParticipantCount.ShouldBe(1);
    }

    [Fact]
    public void The_latest_state_of_an_unseen_session_is_unknown()
    {
        cache.LatestOf(KnownSession).ShouldBeNull();
    }

    [Fact]
    public void Sessions_that_are_no_longer_connected_are_forgotten()
    {
        var session = TestSessions.Open(KnownSession);
        cache.StatesOf(session);

        cache.RetainOnly([new SessionIdentity(Guid.NewGuid())]);

        cache.LatestOf(KnownSession).ShouldBeNull();
    }

    [Fact]
    public void Sessions_that_are_still_connected_are_kept()
    {
        var session = TestSessions.Open(KnownSession);
        cache.StatesOf(session);

        cache.RetainOnly([KnownSession]);

        cache.LatestOf(KnownSession).ShouldNotBeNull();
    }
}
