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

    private static readonly ParticipantId Anna = CallerParticipantIdentity.ForSubject(Subject);

    private readonly InMemorySessionRepository repository = new();
    private readonly RecordingBroadcaster broadcaster = new();
    private readonly RecordingHubClients<IParticipantClient> clients = new();
    private readonly RecordingGroupManager groups = new();

    [Fact]
    public async Task Connecting_puts_a_newcomer_on_the_roster_and_pushes_their_own_state()
    {
        var session = new Session(KnownSession);
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([Anna]);
        var state = clients.CallerClient.Single<ParticipantWorkshopState>();
        state.Phase.ShouldBe(Phase.Join);
        state.ParticipantCount.ShouldBe(1);
        state.Revision.ShouldBe(1);
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
        clients.CallerClient.Single<ParticipantWorkshopState>().ParticipantCount.ShouldBe(1);
    }

    [Fact]
    public void The_same_subject_always_maps_to_the_same_participant()
    {
        CallerParticipantIdentity
            .ForSubject(Subject)
            .ShouldBe(CallerParticipantIdentity.ForSubject(Subject));
        CallerParticipantIdentity.ForSubject("ben").ShouldNotBe(Anna);
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
    public async Task Connecting_to_an_unknown_session_is_refused_and_pushes_nothing()
    {
        var hub = HubBoundTo(KnownSession, Subject);

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        clients.CallerClient.ReceivedStates.ShouldBeEmpty();
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

    [Fact]
    public async Task Joining_broadcasts_the_changed_roster_to_everyone()
    {
        repository.Add(new Session(KnownSession));
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        broadcaster.Broadcasts.ShouldHaveSingleItem().Roster.Participants.ShouldBe([Anna]);
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
            new FixedRandomness(0)
        )
        {
            Clients = clients,
            Groups = groups,
            Context = context,
        };
    }
}
