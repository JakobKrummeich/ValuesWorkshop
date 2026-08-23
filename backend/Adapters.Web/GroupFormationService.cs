using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

public sealed record GroupFormationTickInterval(TimeSpan Value);

public sealed record GroupFormationDiscoveryInterval(TimeSpan Value);

public sealed class GroupFormationService(
    SessionConnectionRegistry registry,
    GroupFormationRunner formationRunner,
    IServiceScopeFactory scopeFactory,
    WorkshopStateCache cache,
    RoleStateDispatcher dispatcher,
    GroupFormationTickInterval tickInterval,
    GroupFormationDiscoveryInterval discoveryInterval,
    ILogger<GroupFormationService> logger
) : BackgroundService
{
    public async Task TickOnceAsync()
    {
        formationRunner.RetainOnly(registry.ConnectedSessions());

        await AdvanceEachAsync(formationRunner.RunningSessions());
    }

    public async Task DiscoverOnceAsync()
    {
        await AdvanceEachAsync(SessionsWithoutARun());
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.WhenAll(
            RepeatAsync(tickInterval.Value, TickOnceAsync, stoppingToken),
            RepeatAsync(discoveryInterval.Value, DiscoverOnceAsync, stoppingToken)
        );
    }

    private IReadOnlyList<SessionIdentity> SessionsWithoutARun()
    {
        return registry.ConnectedSessions().Except(formationRunner.RunningSessions()).ToList();
    }

    private async Task RepeatAsync(TimeSpan every, Func<Task> work, CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(every);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await work();
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Running the group formation windows failed.");
            }
        }
    }

    private async Task AdvanceEachAsync(IReadOnlyList<SessionIdentity> sessionIdentities)
    {
        foreach (var sessionIdentity in sessionIdentities)
        {
            try
            {
                await AdvanceFormationOfAsync(sessionIdentity);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Advancing a group formation failed.");
            }
        }
    }

    private async Task AdvanceFormationOfAsync(SessionIdentity sessionIdentity)
    {
        using var scope = scopeFactory.CreateScope();

        if (formationRunner.IsWindowOverFor(sessionIdentity))
        {
            await CloseWindowOfAsync(scope, sessionIdentity);

            return;
        }

        var session = await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .LoadAsync(sessionIdentity);

        if (session is null || !session.IsFormingGroups)
        {
            formationRunner.Drop(sessionIdentity);

            return;
        }

        formationRunner.EnsureRunningFor(session);

        await dispatcher.SendAsync(sessionIdentity, cache.StatesOf(session));
    }

    private async Task CloseWindowOfAsync(IServiceScope scope, SessionIdentity sessionIdentity)
    {
        await scope
            .ServiceProvider.GetRequiredService<SessionCommandHandler>()
            .HandleAsync(
                sessionIdentity,
                formingSession =>
                {
                    if (!formingSession.IsFormingGroups)
                    {
                        return false;
                    }

                    formationRunner.FormGroupsIn(formingSession);

                    return true;
                }
            );

        formationRunner.Drop(sessionIdentity);
    }
}
