using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace ValuesWorkshop.Adapters.Web;

public sealed record SessionCreationRequest(string SessionName, string Passphrase)
{
    public static async ValueTask<SessionCreationRequest?> BindAsync(HttpContext httpContext)
    {
        var body = await ReadBodyAsync(httpContext);

        if (body is null)
        {
            return null;
        }

        return new SessionCreationRequest(
            body.SessionName ?? string.Empty,
            body.Passphrase ?? string.Empty
        );
    }

    private static async ValueTask<SessionCreationBody?> ReadBodyAsync(HttpContext httpContext)
    {
        if (!httpContext.Request.HasJsonContentType())
        {
            return null;
        }

        try
        {
            return await httpContext.Request.ReadFromJsonAsync<SessionCreationBody>();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record SessionCreationBody(string? SessionName, string? Passphrase);
}
