using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Tests;

public class GroupFormationServiceTests
{
    private static readonly SessionIdentity KnownSession = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private readonly ManualTimeProvider clock = new();
    private readonly InMemorySessionRepository repository = new();
    private readonly SessionConnectionRegistry registry = new();
    private readonly RecordingHubClients<IFacilitatorClient> facilitatorClients = new();
    private readonly RecordingHubClients<IParticipantClient> participantClients = new();
    private readonly RecordingHubClients<IPresenterClient> presenterClients = new();
    private readonly GroupFormationRunner formationRunner;
    private readonly WorkshopStateCache cache;

    public GroupFormationServiceTests()
    {
        formationRunner = TestWorkshopStateCache.FormationRunner(new TestGroupSolver(), clock);
        cache = TestWorkshopStateCache.Create(formationRunner);
    }

    [Fact]
    public async Task A_connected_session_that_is_forming_its_groups_is_discovered()
    {
        await AConnectedFormingSessionAsync();

        await ServiceUnderTest().DiscoverOnceAsync();

        formationRunner.RunningSessions().ShouldBe([KnownSession]);
        PresenterState()
            .ShouldBeOfType<PresenterGroupFormationState>()
            .Formation.ShouldBeOfType<PresenterFormingView>()
            .Progress.ShouldBe(0);
    }

    [Fact]
    public async Task A_connected_session_outside_group_formation_starts_no_run()
    {
        var session = TestSessions.InPhase(KnownSession, Phase.SelectionResults);
        await repository.CreateAsync(session);
        registry.Add(KnownSession, "connection-1");

        await ServiceUnderTest().DiscoverOnceAsync();

        formationRunner.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_tick_reads_no_session_as_long_as_no_formation_runs()
    {
        await AConnectedFormingSessionAsync();

        await ServiceUnderTest().TickOnceAsync();

        repository.Loaded.ShouldBeEmpty();
        formationRunner.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public async Task A_discovered_session_is_left_to_the_ticks_from_then_on()
    {
        await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        repository.Loaded.Clear();

        await service.DiscoverOnceAsync();

        repository.Loaded.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_run_of_a_session_nobody_is_connected_to_is_forgotten()
    {
        var session = AFormingSession();
        await repository.CreateAsync(session);
        formationRunner.EnsureRunningFor(session);

        await ServiceUnderTest().TickOnceAsync();

        formationRunner.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_session_inside_its_window_is_pushed_the_progress_of_its_run()
    {
        var session = await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(1.5));

        await service.TickOnceAsync();

        PresenterState()
            .ShouldBeOfType<PresenterGroupFormationState>()
            .Formation.ShouldBeOfType<PresenterFormingView>()
            .Progress.ShouldBe(0.5);
        FacilitatorState()
            .ShouldBeOfType<FacilitatorGroupFormationState>()
            .Formation.ShouldBeOfType<FacilitatorFormingView>()
            .Progress.ShouldBe(0.5);
        ParticipantState(session.Roster.Participants[0].Id)
            .ShouldBeOfType<ParticipantGroupFormationState>()
            .Formation.ShouldBeOfType<ParticipantFormingView>()
            .Progress.ShouldBe(0.5);
    }

    [Fact]
    public async Task The_facilitator_may_not_advance_while_the_bar_is_still_running()
    {
        await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(1.5));

        await service.TickOnceAsync();

        FacilitatorState().EnabledIntents.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_session_whose_window_is_over_gets_its_groups_and_forgets_its_run()
    {
        await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(3));

        await service.TickOnceAsync();

        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Formation.IsFormed.ShouldBeTrue();
        saved.Formation.Groups.SelectMany(group => group.Members).Count().ShouldBe(4);
        formationRunner.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public async Task A_window_that_is_over_saves_nothing_once_the_groups_already_stand()
    {
        var session = await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(3));
        formationRunner.FormGroupsIn(session);

        await service.TickOnceAsync();

        repository.Saved.ShouldBeEmpty();
        session.Revision.ShouldBe(0);
        formationRunner.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public async Task The_state_that_reveals_the_groups_reaches_every_role()
    {
        await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(3));

        await service.TickOnceAsync();

        PresenterState()
            .ShouldBeOfType<PresenterGroupFormationState>()
            .Formation.ShouldBeOfType<PresenterFormedView>()
            .Groups.ShouldNotBeEmpty();
        FacilitatorState().EnabledIntents.ShouldContain(FacilitatorIntent.AdvancePhase);
    }

    [Fact]
    public async Task A_session_whose_groups_already_stand_forgets_its_run_without_pushing()
    {
        var session = await AConnectedFormingSessionAsync();
        var service = ServiceUnderTest();
        await service.DiscoverOnceAsync();
        var statesBeforeTheGroupsStood = PresenterStates().Count;
        formationRunner.FormGroupsIn(session);

        await service.TickOnceAsync();

        formationRunner.RunningSessions().ShouldBeEmpty();
        PresenterStates().Count.ShouldBe(statesBeforeTheGroupsStood);
    }

    [Fact]
    public async Task A_session_the_repository_no_longer_knows_forgets_its_run()
    {
        formationRunner.EnsureRunningFor(AFormingSession());
        registry.Add(KnownSession, "connection-1");

        await ServiceUnderTest().TickOnceAsync();

        formationRunner.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_tick_that_fails_keeps_the_run_so_the_next_tick_retries_it()
    {
        await AConnectedFormingSessionAsync();
        await ServiceUnderTest().DiscoverOnceAsync();
        clock.Advance(TimeSpan.FromSeconds(3));

        await ServiceUnderTest(new UnreachableSessionRepository()).TickOnceAsync();

        formationRunner.RunningSessions().ShouldBe([KnownSession]);
        repository.Saved.ShouldBeEmpty();

        await ServiceUnderTest().TickOnceAsync();

        repository.Saved.ShouldHaveSingleItem().Formation.IsFormed.ShouldBeTrue();
    }

    private static Session AFormingSession()
    {
        var session = TestSessions.InPhase(
            KnownSession,
            Phase.SelectionResults,
            selection: SelectionRound.Restore([], TestValueIds.Numbered(1, 4))
        );

        foreach (var number in Enumerable.Range(1, 4))
        {
            session.Join(
                TestParticipants.Named(
                    new ParticipantId(new Guid(number, 0, 0, [0, 0, 0, 0, 0, 0, 0, 0])),
                    $"Person {number}"
                ),
                new FixedRandomness(0)
            );
        }

        session.AdvancePhase();

        return session;
    }

    private async Task<Session> AConnectedFormingSessionAsync()
    {
        var session = AFormingSession();
        await repository.CreateAsync(session);
        registry.Add(KnownSession, "connection-1");

        return session;
    }

    private FacilitatorWorkshopState FacilitatorState()
    {
        return facilitatorClients
            .GroupClient(SessionGroups.Facilitator(KnownSession))
            .Latest<FacilitatorWorkshopState>();
    }

    private PresenterWorkshopState PresenterState()
    {
        return presenterClients
            .GroupClient(SessionGroups.Presenter(KnownSession))
            .Latest<PresenterWorkshopState>();
    }

    private ParticipantWorkshopState ParticipantState(ParticipantId participantId)
    {
        return participantClients
            .GroupClient(SessionGroups.Participant(KnownSession, participantId))
            .Latest<ParticipantWorkshopState>();
    }

    private IReadOnlyList<object> PresenterStates()
    {
        return presenterClients.GroupClient(SessionGroups.Presenter(KnownSession)).ReceivedStates;
    }

    private GroupFormationService ServiceUnderTest(ISessionRepository? sessionRepository = null)
    {
        var dispatcher = new RoleStateDispatcher(
            new RecordingHubContext<FacilitatorHub, IFacilitatorClient>(facilitatorClients),
            new RecordingHubContext<ParticipantHub, IParticipantClient>(participantClients),
            new RecordingHubContext<PresenterHub, IPresenterClient>(presenterClients)
        );

        var services = new ServiceCollection();
        services.AddScoped(_ => sessionRepository ?? repository);
        services.AddScoped<IBroadcaster>(_ => new SignalRBroadcaster(cache, dispatcher));
        services.AddScoped<SessionCommandHandler>();

        return new GroupFormationService(
            registry,
            formationRunner,
            services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(),
            cache,
            dispatcher,
            new GroupFormationTickInterval(TimeSpan.FromMilliseconds(50)),
            new GroupFormationDiscoveryInterval(TimeSpan.FromMilliseconds(250)),
            NullLogger<GroupFormationService>.Instance
        );
    }

    private sealed class UnreachableSessionRepository : ISessionRepository
    {
        public Task<Session?> LoadAsync(SessionIdentity sessionIdentity)
        {
            throw new InvalidOperationException("The session store is unreachable.");
        }

        public Task CreateAsync(Session session)
        {
            throw new InvalidOperationException("The session store is unreachable.");
        }

        public Task SaveAsync(Session session, long expectedRevision)
        {
            throw new InvalidOperationException("The session store is unreachable.");
        }

        public Task<IReadOnlyList<Session>> LoadAllAsync()
        {
            throw new InvalidOperationException("The session store is unreachable.");
        }
    }
}
