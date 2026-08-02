using Microsoft.AspNetCore.Http;

namespace ValuesWorkshop.Adapters.Web;

internal static class CallerKey
{
    private const string UnknownCaller = "unknown-caller";

    internal static string Of(HttpContext httpContext)
    {
        var subject = CallerSubject.Of(httpContext.User);

        if (!string.IsNullOrWhiteSpace(subject))
        {
            return subject;
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownCaller;
    }
}
