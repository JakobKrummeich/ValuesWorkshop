using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

public sealed class GroupFormationWindowTests : IClassFixture<WorkshopTestFactory>
{
    private const int ParticipantCount = 4;

    private static readonly IReadOnlyList<ValueId> TopValues =
    [
        new("freiheit"),
        new("autonomie"),
        new("kreativitaet"),
        new("neugier"),
    ];

    private readonly WorkshopTestFactory factory;

    public GroupFormationWindowTests(WorkshopTestFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task A_presenter_watches_the_formation_window_run_before_the_groups_arrive()
    {
        using var backend = BackendWithFormationWindow(milliseconds: 1000);
        var sessionIdentity = await AnUnformedSessionAsync(backend);
        await using var connection = PresenterConnection(backend, sessionIdentity);
        var inbox = new StateInbox<PresenterWorkshopState>(connection);

        await connection.StartAsync();

        var forming = await NextFormationAsync(
            inbox,
            formation => formation is PresenterFormingView
        );
        var progress = forming.Formation.ShouldBeOfType<PresenterFormingView>().Progress;
        progress.ShouldBeLessThan(1);

        var advanced = await NextFormationAsync(
            inbox,
            formation => formation is PresenterFormingView later && later.Progress > progress
        );
        advanced.Revision.ShouldBe(forming.Revision);

        var formed = await NextFormationAsync(inbox, formation => formation is PresenterFormedView);
        formed
            .Formation.ShouldBeOfType<PresenterFormedView>()
            .Groups.SelectMany(group => group.MemberDisplayNames)
            .Count()
            .ShouldBe(ParticipantCount);
    }

    private static async Task<PresenterGroupFormationState> NextFormationAsync(
        StateInbox<PresenterWorkshopState> inbox,
        Func<PresenterFormationView, bool> expectation
    )
    {
        var state = await inbox.NextMatchingAsync(candidate =>
            candidate is PresenterGroupFormationState formation && expectation(formation.Formation)
        );

        return state.ShouldBeOfType<PresenterGroupFormationState>();
    }

    private WebApplicationFactory<AssemblyMarker> BackendWithFormationWindow(int milliseconds)
    {
        return factory.WithWebHostBuilder(builder =>
            builder.UseSetting("GROUP_FORMATION_WINDOW_MS", milliseconds.ToString())
        );
    }

    private static async Task<SessionIdentity> AnUnformedSessionAsync(
        WebApplicationFactory<AssemblyMarker> backend
    )
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());
        var session = TestSessions.InPhase(
            sessionIdentity,
            Phase.SelectionResults,
            selection: SelectionRound.Restore([], TopValues)
        );

        foreach (var number in Enumerable.Range(1, ParticipantCount))
        {
            session.Join(
                TestParticipants.Named(new ParticipantId(Guid.NewGuid()), $"Person {number}"),
                new FixedRandomness(0)
            );
        }

        session.AdvancePhase();

        using var scope = backend.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ISessionRepository>().CreateAsync(session);

        return sessionIdentity;
    }

    private static HubConnection PresenterConnection(
        WebApplicationFactory<AssemblyMarker> backend,
        SessionIdentity sessionIdentity
    )
    {
        var server = backend.Server;

        return new HubConnectionBuilder()
            .WithUrl(
                new Uri(
                    server.BaseAddress,
                    $"/hub/presenter?sessionIdentity={sessionIdentity.Value}"
                ),
                options =>
                {
                    options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                    options.Transports = HttpTransportType.LongPolling;
                }
            )
            .Build();
    }
}
