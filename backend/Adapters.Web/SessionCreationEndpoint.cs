using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using ValuesWorkshop.Application;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public static class SessionCreationEndpoint
{
    private const string InvalidRequestDetail = "The session name is missing, blank, or too long.";
    private const string UnavailableDetail =
        "The session could not be opened right now. Please try again.";

    public static IEndpointRouteBuilder MapSessionCreation(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapPost("/api/sessions", CreateSessionAsync)
            .RequireAuthorization()
            .RequireRateLimiting(SessionCreationRateLimit.PolicyName);

        return endpoints;
    }

    private static async Task<IResult> CreateSessionAsync(
        SessionCreationRequest request,
        ClaimsPrincipal caller,
        SessionCreationHandler handler,
        ILoggerFactory loggerFactory
    )
    {
        var subject = CallerSubject.Of(caller);

        if (string.IsNullOrWhiteSpace(subject))
        {
            return Results.Unauthorized();
        }

        var result = await handler.CreateAsync(
            new FacilitatorSubject(subject),
            new SessionName(request.SessionName ?? string.Empty),
            request.Passphrase ?? string.Empty
        );

        if (result is SessionCreationResult.PassphraseRejected)
        {
            loggerFactory
                .CreateLogger(typeof(SessionCreationEndpoint).FullName!)
                .LogWarning("Rejected the session creation passphrase of {Subject}.", subject);
        }

        return ResponseFor(result);
    }

    private static IResult ResponseFor(SessionCreationResult result)
    {
        return result switch
        {
            SessionCreationResult.Accepted accepted => Results.Json(
                new SessionCreationResponse(accepted.SessionIdentity.Value),
                statusCode: StatusCodes.Status201Created
            ),
            SessionCreationResult.InvalidRequest => Results.Problem(
                detail: InvalidRequestDetail,
                statusCode: StatusCodes.Status400BadRequest
            ),
            SessionCreationResult.CreationUnavailable => Results.Problem(
                detail: UnavailableDetail,
                statusCode: StatusCodes.Status503ServiceUnavailable
            ),
            SessionCreationResult.PassphraseRejected => Results.Unauthorized(),
            _ => throw new UnreachableException($"Unmapped session creation result {result}."),
        };
    }
}
