using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ValuesWorkshop.Application;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Web;

public static class SessionCreationEndpoint
{
    private const string InvalidRequestDetail = "The session name is missing, blank, or too long.";

    public static IEndpointRouteBuilder MapSessionCreation(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/sessions", CreateSessionAsync);

        return endpoints;
    }

    private static async Task<IResult> CreateSessionAsync(
        SessionCreationRequest request,
        ClaimsPrincipal caller,
        SessionCreationHandler handler
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

        return ResponseFor(result);
    }

    private static IResult ResponseFor(SessionCreationResult result)
    {
        if (result.IsAccepted && result.SessionIdentity is { } sessionIdentity)
        {
            return Results.Json(
                new SessionCreationResponse(sessionIdentity.Value),
                statusCode: StatusCodes.Status201Created
            );
        }

        return result.Rejection == SessionCreationRejection.InvalidRequest
            ? Results.Problem(
                detail: InvalidRequestDetail,
                statusCode: StatusCodes.Status400BadRequest
            )
            : Results.Unauthorized();
    }
}
