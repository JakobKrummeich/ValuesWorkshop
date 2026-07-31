using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

internal static class HubSessionBinding
{
    private const string SessionIdentityQueryKey = "sessionIdentity";

    internal static SessionIdentity SessionIdentityOf(HubCallerContext context)
    {
        var query = context.GetHttpContext()?.Request.Query[SessionIdentityQueryKey].ToString();

        if (!Guid.TryParse(query, out var identity))
        {
            throw new HubException(
                "The connection carries no readable sessionIdentity query parameter."
            );
        }

        return new SessionIdentity(identity);
    }
}
