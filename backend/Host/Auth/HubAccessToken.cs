using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace ValuesWorkshop.Host.Auth;

internal static class HubAccessToken
{
    private const string HubPathPrefix = "/hub";

    internal static Task ReadFromQueryString(MessageReceivedContext context)
    {
        var accessToken = context.Request.Query["access_token"].ToString();

        if (
            !string.IsNullOrEmpty(accessToken)
            && context.HttpContext.Request.Path.StartsWithSegments(HubPathPrefix)
        )
        {
            context.Token = accessToken;
        }

        return Task.CompletedTask;
    }
}
