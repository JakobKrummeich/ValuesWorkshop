using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Host.Tests;

public sealed class BackendRestartTests
{
    [Fact]
    public async Task A_client_reconnecting_after_a_restart_is_pushed_the_state_that_survived()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();
        SessionIdentity sessionIdentity;
        PresenterWorkshopState stateBeforeRestart;

        try
        {
            using (var backend = WorkshopTestFactory.On(databasePath))
            {
                sessionIdentity = await SeedSession(backend, Phase.GroupWork);
                await using var connection = PresenterConnection(backend, sessionIdentity);
                var inbox = new StateInbox<PresenterWorkshopState>(connection);
                await connection.StartAsync();

                stateBeforeRestart = await inbox.NextAsync();
                await connection.StopAsync();
            }

            using var restarted = WorkshopTestFactory.On(databasePath);
            await using var reconnection = PresenterConnection(restarted, sessionIdentity);
            var reconnectedInbox = new StateInbox<PresenterWorkshopState>(reconnection);
            await reconnection.StartAsync();

            var stateAfterRestart = await reconnectedInbox.NextAsync();
            stateAfterRestart.Phase.ShouldBe(stateBeforeRestart.Phase);
            stateAfterRestart.Revision.ShouldBe(stateBeforeRestart.Revision);
        }
        finally
        {
            File.Delete(databasePath);
        }
    }

    private static async Task<SessionIdentity> SeedSession(WorkshopTestFactory backend, Phase phase)
    {
        var sessionIdentity = new SessionIdentity(Guid.NewGuid());
        var session = new Session(sessionIdentity);

        while (session.PhaseProgress.CurrentPhase != phase)
        {
            session.AdvancePhase();
        }

        using var scope = backend.Services.CreateScope();
        await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .SaveAsync(session, expectedRevision: 0);

        return sessionIdentity;
    }

    private static HubConnection PresenterConnection(
        WorkshopTestFactory backend,
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
