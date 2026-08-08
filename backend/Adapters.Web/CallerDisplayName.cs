using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

internal static class CallerDisplayName
{
    internal static ParticipantName Of(HubCallerContext context, ParticipantId participantId)
    {
        var user = context.User;
        var claimed = user?.FindFirst("name")?.Value ?? user?.FindFirst(ClaimTypes.Name)?.Value;

        return ParticipantName.Of(claimed, participantId);
    }
}
