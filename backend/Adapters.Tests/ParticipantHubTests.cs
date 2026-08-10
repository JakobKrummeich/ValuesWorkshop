using System.Security.Claims;
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
        var session = TestSessions.Open(KnownSession);
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna Schmidt")]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task A_returning_participant_resumes_instead_of_joining_twice()
    {
        var session = TestSessions.Open(KnownSession);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        session.Roster.Participants.ShouldBe([TestParticipants.Named(Anna, "Anna Schmidt")]);
        session.Revision.ShouldBe(0);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_reconnecting_participant_is_pushed_its_state_immediately()
    {
        var session = TestSessions.Open(KnownSession);
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        await hub.OnConnectedAsync();

        clients
            .CallerClient.Single<ParticipantWorkshopState>()
            .ShouldBeOfType<ParticipantJoinState>();
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
        repository.Add(TestSessions.Open(KnownSession));
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
        repository.Add(TestSessions.Open(KnownSession));
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), subject: null)
        );

        await Should.ThrowAsync<HubException>(hub.OnConnectedAsync);

        repository.Saved.ShouldBeEmpty();
    }

    [Fact]
    public async Task Choosing_an_answer_mutates_persists_and_broadcasts()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.Quiz,
            QuizProgress.Restore(0, false, false, [])
        );
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.ChooseQuizAnswer(0, 2);

        result.ShouldBe(IntentResult.Accepted());
        repository
            .Saved.ShouldHaveSingleItem()
            .Quiz.CastAnswers.ShouldBe([new CastAnswer(0, Anna, 2)]);
        broadcaster.Broadcasts.ShouldHaveSingleItem().Revision.ShouldBe(1);
    }

    [Fact]
    public async Task Choosing_an_out_of_range_answer_is_rejected_as_a_malformed_payload()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.Quiz,
            QuizProgress.Restore(0, false, false, [])
        );
        session.Join(TestParticipants.Named(Anna, "Anna Schmidt"), new FixedRandomness(0));
        repository.Add(session);
        var hub = HubBoundTo(KnownSession, Subject);

        var result = await hub.ChooseQuizAnswer(0, 3);

        result.IsAccepted.ShouldBeFalse();
        result.Code.ShouldBe(IntentRejectionCode.MalformedPayload);
        repository.Saved.ShouldBeEmpty();
        broadcaster.Broadcasts.ShouldBeEmpty();
    }

    [Fact]
    public async Task Choosing_an_answer_without_an_authenticated_subject_is_refused()
    {
        repository.Add(
            TestSessions.InPhase(
                KnownSession,
                Phase.Quiz,
                QuizProgress.Restore(0, false, false, [])
            )
        );
        var hub = HubWithContext(
            new FakeHubCallerContext(KnownSession.Value.ToString(), subject: null)
        );

        await Should.ThrowAsync<HubException>(() => hub.ChooseQuizAnswer(0, 0));

        repository.Saved.ShouldBeEmpty();
    }

    private ParticipantHub HubBoundTo(SessionIdentity sessionIdentity, string subject)
    {
        return HubWithContext(
            new FakeHubCallerContext(
                sessionIdentity.Value.ToString(),
                subject,
                new Claim("name", "Anna Schmidt")
            )
        );
    }

    private ParticipantHub HubWithContext(FakeHubCallerContext context)
    {
        var pipeline = new IntentPipeline(new SessionCommandHandler(repository, broadcaster));

        return new ParticipantHub(
            repository,
            pipeline,
            new ParticipantIntentHandler(pipeline),
            new ParticipantWorkshopStateMapper(new TestQuizCatalog(5)),
            TestWorkshopStateCache.Create(),
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
