using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace ValuesWorkshop.Adapters.Web;

internal sealed class SessionCreationRateLimitPolicy(
    SessionCreationRateLimit rateLimit,
    ILogger<SessionCreationRateLimitPolicy> logger
) : IRateLimiterPolicy<string>
{
    public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected =>
        (context, _) =>
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            logger.LogWarning(
                "Refused a session creation attempt from {Caller} that exceeded {AttemptsPerWindow} attempts per {Window}.",
                CallerKey.Of(context.HttpContext),
                rateLimit.AttemptsPerWindow,
                rateLimit.Window
            );

            return ValueTask.CompletedTask;
        };

    public RateLimitPartition<string> GetPartition(HttpContext httpContext)
    {
        return RateLimitPartition.GetFixedWindowLimiter(
            CallerKey.Of(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimit.AttemptsPerWindow,
                Window = rateLimit.Window,
                QueueLimit = 0,
            }
        );
    }
}
