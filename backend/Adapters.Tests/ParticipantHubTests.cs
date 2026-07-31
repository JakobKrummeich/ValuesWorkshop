using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public class ParticipantHubTests
{
    private const string Subject = "anna";

    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly ParticipantId Anna = CallerParticipantIdentity.ForSubject(
        KnownSession,
        Subject
    );

    private readonly InMemorySessionRepository repository = new();
    private readonly RecordingBroadcaster broadcaster = new();
    private readonly RecordingHubClients<IParticipantClient> clients = new();
    private readonly RecordingGroupManager groups = new();
    private readonly SessionConnectionRegistry registry = new();

    [Fact]
    public async Task Connecting_puts_a_newcomer_on_the_roster_and_broadcasts_the_new_state()
    {
        var session = new Session(KnownSession);
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([Anna]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task A_returning_participant_resumes_instead_of_joining_twice()
    {
        var session = new Session(KnownSession);
        session.Join(Anna, new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([Anna]);
        session.Revision.ShouldBe(0);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reconnecting_participant_is_pushed_its_state_immediately()
    {
        var session = new Session(KnownSession);
        session.Join(Anna, new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        clients.CallerClient.Single<ParticipantWorkshopState>().ShouldBeOfType<ParticipantJoinState>();
    }

    [Fact]
    public void The_same_subject_is_the_same_participant_in_one_session_and_nobody_else_elsewhere()
    {
        CallerParticipantIdentity
            .ForSubject(KnownSession, Subject)
            .ShouldBe(CallerParticipantIdentity.ForSubject(KnownSession, Subject));
        CallerParticipantIdentity.ForSubject(KnownSession, "ben").ShouldNotBe(Anna);
        CallerParticipantIdentity
            .ForSubject(new SessionIdentity(Guid.NewGuid()), Subject)
            .ShouldNotBe(Anna);
    }

    [Fact]
    public async Task Connecting_joins_the_group_that_only_this_participant_receives()
    {
        repository.Add(new Session(KnownSession));
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        groups.JoinedGroups.ShouldBe([SessionGroups.Participant(KnownSession, Anna)]);
    }

    [Fact]
    public async Task Connecting_to_an_unknown_session_is_refused_and_broadcasts_nothing()
    {
        var hub = HubBoundTo(KnownSession, Subject);

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Connecting_without_an_authenticated_subject_is_refused()
    {
        repository.Add(new Session(KnownSession));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), subject: null)
        );

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        repository.Saved.ShouldBeEmpty();
    }

    private ParticipantHub HubBoundTo(SessionIdentity sessionIdentity, string subject)
    {
        return HubWithContext(new FakeHubCallerContext(sessionIdentity.Value.ToString(), subject));
    }

    private ParticipantHub HubWithContext(FakeHubCallerContext context)
    {
        return new ParticipantHub(
            repository,
            new IntentPipeline(new SessionCommandHandler(repository, broadcaster)),
            new WorkshopStateCache(),
            new FixedRandomness(0),
            registry
        )
        {
            Clients = clients,
            Groups = groups,
            Context = context,
        };
    }
}
