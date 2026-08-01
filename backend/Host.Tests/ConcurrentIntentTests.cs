using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

public sealed class ConcurrentIntentTests
{
    [Fact]
    public async Task A_join_that_collides_with_an_advance_survives_next_to_the_advanced_phase()
    {
        var gate = new SaveGate();
        using var origin = new WorkshopTestFactory();
        using var backend = GatedBackend(origin, gate);
        var sessionIdentity = await SeedJoinPhaseSession(backend);

        await using var facilitator = ConnectionFor(
            backend,
            "facilitator",
            sessionIdentity,
            TestSessions.Facilitator.Value
        );
        var facilitatorInbox = new StateInbox<FacilitatorWorkshopState>(facilitator);
        await facilitator.StartAsync();
        await facilitatorInbox.NextAsync();

        gate.HoldTheNextSave();
        await using var participant = ConnectionFor(
            backend,
            "participant",
            sessionIdentity,
            "anna"
        );
        var participantInbox = new StateInbox<ParticipantWorkshopState>(participant);
        var joining = participant.StartAsync();
        await gate.WaitUntilSaveIsHeldAsync();

        var advanceResult = await facilitator.InvokeAsync<IntentResult>(
            nameof(FacilitatorHub.AdvancePhase)
        );

        gate.ReleaseHeldSave();
        await joining;

        advanceResult.IsAccepted.ShouldBeTrue();
        var joinedState = await participantInbox.NextMatchingAsync(state =>
            state.Phase == Phase.Quiz
        );
        joinedState.ParticipantCount.ShouldBe(1);

        var stored = await LoadSession(backend, sessionIdentity);
        stored.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        stored.Roster.Participants.ShouldHaveSingleItem();
        stored.Revision.ShouldBe(2);
    }

    private static WebApplicationFactory<AssemblyMarker> GatedBackend(
        WorkshopTestFactory origin,
        SaveGate gate
    )
    {
        return origin.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ISessionRepository>();
                services.AddScoped<SqliteSessionRepository>();
                services.AddScoped<ISessionRepository>(provider => new GatedSessionRepository(
                    provider.GetRequiredService<SqliteSessionRepository>(),
                    gate
                ));
            })
        );
    }

    private static async Task<SessionIdentity> SeedJoinPhaseSession(
        WebApplicationFactory<AssemblyMarker> backend
    )
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());

        using var scope = backend.Services.CreateScope();
        await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .CreateAsync(TestSessions.Open(sessionIdentity));

        return sessionIdentity;
    }

    private static async Task<Session> LoadSession(
        WebApplicationFactory<AssemblyMarker> backend,
        SessionIdentity sessionIdentity
    )
    {
        using var scope = backend.Services.CreateScope();
        var session = await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .LoadAsync(sessionIdentity);

        return session.ShouldNotBeNull();
    }

    private static HubConnection ConnectionFor(
        WebApplicationFactory<AssemblyMarker> backend,
        string role,
        SessionIdentity sessionIdentity,
        string subject
    )
    {
        var server = backend.Server;

        return new HubConnectionBuilder()
            .WithUrl(
                new Uri(server.BaseAddress, $"/hub/{role}?sessionIdentity={sessionIdentity.Value}"),
                options =>
                {
                    options.HttpMessageHandlerFactory = _ => server.CreateHandler();
                    options.Transports = HttpTransportType.LongPolling;
                    options.AccessTokenProvider = () =>
                        Task.FromResult<string?>(WorkshopTestFactory.TokenFor(subject));
                }
            )
            .Build();
    }
}
