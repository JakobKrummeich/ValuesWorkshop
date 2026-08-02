using System.Security.Claims;

namespace ValuesWorkshop.Adapters.Web;

internal static class CallerSubjectClaim
{
    internal static string? Of(ClaimsPrincipal? user)
    {
        return user?.FindFirst("sub")?.Value ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
