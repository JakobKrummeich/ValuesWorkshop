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
    private readonly RecordingHubClients<IFacilitatorClient> facilitatorClients = new();
    private readonly RecordingHubClients<IParticipantClient> participantClients = new();
    private readonly RecordingHubClients<IPresenterClient> presenterClients = new();
    private readonly GroupFormationRuns formationRuns;
    private readonly WorkshopStateCache cache;

    public GroupFormationServiceTests()
    {
        formationRuns = TestWorkshopStateCache.FormationRuns(new TestGroupSolver(), clock);
        cache = TestWorkshopStateCache.Create(formationRuns);
    }

    [Fact]
    public async Task A_session_inside_its_window_is_pushed_the_progress_of_its_run()
    {
        var session = await AKnownFormingSessionAsync();
        clock.Advance(TimeSpan.FromSeconds(1.5));

        await ServiceUnderTest().TickOnceAsync();

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
        await AKnownFormingSessionAsync();
        clock.Advance(TimeSpan.FromSeconds(1.5));

        await ServiceUnderTest().TickOnceAsync();

        FacilitatorState().EnabledIntents.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_session_whose_window_is_over_gets_its_groups_and_forgets_its_run()
    {
        await AKnownFormingSessionAsync();
        clock.Advance(TimeSpan.FromSeconds(3));

        await ServiceUnderTest().TickOnceAsync();

        var saved = repository.Saved.ShouldHaveSingleItem();
        saved.Formation.IsFormed.ShouldBeTrue();
        saved.Formation.Groups.SelectMany(group => group.Members).Count().ShouldBe(4);
        formationRuns.RunningSessions().ShouldBeEmpty();
    }

    [Fact]
    public async Task The_state_that_reveals_the_groups_reaches_every_role()
    {
        await AKnownFormingSessionAsync();
        clock.Advance(TimeSpan.FromSeconds(3));

        await ServiceUnderTest().TickOnceAsync();

        PresenterState()
            .ShouldBeOfType<PresenterGroupFormationState>()
            .Formation.ShouldBeOfType<PresenterFormedView>()
            .Groups.ShouldNotBeEmpty();
        FacilitatorState().EnabledIntents.ShouldContain(FacilitatorIntent.AdvancePhase);
    }

    [Fact]
    public async Task A_session_whose_groups_already_stand_forgets_its_run_without_pushing()
    {
        var session = await AKnownFormingSessionAsync();
        formationRuns.FormGroupsIn(session);

        await ServiceUnderTest().TickOnceAsync();

        formationRuns.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_session_the_repository_no_longer_knows_forgets_its_run()
    {
        formationRuns.EnsureRunningFor(AFormingSession());

        await ServiceUnderTest().TickOnceAsync();

        formationRuns.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
    }

    [Fact]
    public async Task A_tick_that_fails_forgets_the_run_instead_of_retrying_it_forever()
    {
        await AKnownFormingSessionAsync();

        await ServiceUnderTest(new UnreachableSessionRepository()).TickOnceAsync();

        formationRuns.RunningSessions().ShouldBeEmpty();
        presenterClients.AddressedGroups.ShouldBeEmpty();
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

    private async Task<Session> AKnownFormingSessionAsync()
    {
        var session = AFormingSession();
        await repository.CreateAsync(session);
        formationRuns.EnsureRunningFor(session);

        return session;
    }

    private FacilitatorWorkshopState FacilitatorState()
    {
        return facilitatorClients
            .GroupClient(SessionGroups.Facilitator(KnownSession))
            .Single<FacilitatorWorkshopState>();
    }

    private PresenterWorkshopState PresenterState()
    {
        return presenterClients
            .GroupClient(SessionGroups.Presenter(KnownSession))
            .Single<PresenterWorkshopState>();
    }

    private ParticipantWorkshopState ParticipantState(ParticipantId participantId)
    {
        return participantClients
            .GroupClient(SessionGroups.Participant(KnownSession, participantId))
            .Single<ParticipantWorkshopState>();
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
            formationRuns,
            services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(),
            cache,
            dispatcher,
            new GroupFormationTickInterval(TimeSpan.FromMilliseconds(50)),
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
