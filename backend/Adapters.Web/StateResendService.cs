using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ValuesWorkshop.Adapters.Web;

public sealed record StateResendInterval(TimeSpan Value);

public sealed class StateResendService(
    SessionConnectionRegistry registry,
    WorkshopStateCache cache,
    RoleStateDispatcher dispatcher,
    StateResendInterval interval,
    ILogger<StateResendService> logger
) : BackgroundService
{
    public async Task ResendOnceAsync()
    {
        var connectedSessions = registry.ConnectedSessions();

        cache.RetainOnly(connectedSessions);

        foreach (var sessionIdentity in connectedSessions)
        {
            var states = cache.LatestOf(sessionIdentity);

            if (states is not null)
            {
                await dispatcher.SendAsync(sessionIdentity, states);
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
                await ResendOnceAsync();
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Resending workshop state failed.");
            }
        }
    }
}
