using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Formation;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Web;

public sealed record GroupFormationTickInterval(TimeSpan Value);

public sealed class GroupFormationService(
    GroupFormationRuns formationRuns,
    IServiceScopeFactory scopeFactory,
    WorkshopStateCache cache,
    RoleStateDispatcher dispatcher,
    GroupFormationTickInterval interval,
    ILogger<GroupFormationService> logger
) : BackgroundService
{
    public async Task TickOnceAsync()
    {
        foreach (var sessionIdentity in formationRuns.RunningSessions())
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

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(interval.Value);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await TickOnceAsync();
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Running the group formation windows failed.");
            }
        }
    }

    private async Task AdvanceFormationOfAsync(SessionIdentity sessionIdentity)
    {
        using var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<ISessionRepository>();
        var session = await repository.LoadAsync(sessionIdentity);

        if (session is null || !session.IsFormingGroups)
        {
            formationRuns.Drop(sessionIdentity);

            return;
        }

        if (!formationRuns.IsWindowOverFor(sessionIdentity))
        {
            await dispatcher.SendAsync(sessionIdentity, cache.StatesOf(session));

            return;
        }

        await scope
            .ServiceProvider.GetRequiredService<SessionCommandHandler>()
            .HandleAsync(
                sessionIdentity,
                formingSession =>
                {
                    formationRuns.FormGroupsIn(formingSession);

                    return true;
                }
            );

        formationRuns.Drop(sessionIdentity);
    }
}
