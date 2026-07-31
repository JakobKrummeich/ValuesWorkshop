using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

internal static class CallerParticipantIdentity
{
    private const string ParticipantIdentityNamespace = "valuesworkshop:participant:";

    internal static ParticipantId ParticipantIdOf(
        HubCallerContext context,
        SessionIdentity sessionIdentity
    )
    {
        var subject =
            context.User?.FindFirst("sub")?.Value
            ?? context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new HubException("The connection carries no authenticated subject.");
        }

        return ForSubject(sessionIdentity, subject);
    }

    internal static ParticipantId ForSubject(SessionIdentity sessionIdentity, string subject)
    {
        var digest = SHA256.HashData(
            Encoding.UTF8.GetBytes(
                $"{ParticipantIdentityNamespace}{sessionIdentity.Value}:{subject}"
            )
        );

        return new ParticipantId(new Guid(digest.AsSpan(0, 16)));
    }
}
