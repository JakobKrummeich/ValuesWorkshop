using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;

namespace ValuesWorkshop.Adapters.Web;

public sealed record SessionCreationRateLimit(int AttemptsPerWindow, TimeSpan Window)
{
    public const string PolicyName = "session-creation";
}

public static class SessionCreationRateLimitRegistration
{
    public static IServiceCollection AddSessionCreationRateLimit(
        this IServiceCollection services,
        SessionCreationRateLimit rateLimit
    )
    {
        services.AddSingleton(rateLimit);

        return services.AddRateLimiter(options =>
        {
            options.AddPolicy<string, SessionCreationRateLimitPolicy>(
                SessionCreationRateLimit.PolicyName
            );
        });
    }
}
