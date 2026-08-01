using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class SessionCreationRateLimitTests
{
    private const string WrongPassphrase = "not-the-passphrase";

    [Fact]
    public async Task An_attempt_beyond_the_window_limit_is_429_and_never_echoes_the_passphrase()
    {
        using var origin = new WorkshopTestFactory();
        using var backend = LimitedBackend(origin, attemptsPerWindow: 1);
        using var client = ClientFor(backend, "facilitator-guessing");

        var firstAttempt = await PostSessionAsync(client, WrongPassphrase);
        var secondAttempt = await PostSessionAsync(client, WrongPassphrase);

        firstAttempt.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        secondAttempt.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        (await secondAttempt.Content.ReadAsStringAsync()).ShouldNotContain(WrongPassphrase);
    }

    [Fact]
    public async Task One_callers_exhausted_attempts_never_block_another_caller()
    {
        using var origin = new WorkshopTestFactory();
        using var backend = LimitedBackend(origin, attemptsPerWindow: 1);
        using var guesser = ClientFor(backend, "facilitator-guessing");
        using var newcomer = ClientFor(backend, "facilitator-arriving-late");

        await PostSessionAsync(guesser, WrongPassphrase);
        var blocked = await PostSessionAsync(guesser, WrongPassphrase);
        var accepted = await PostSessionAsync(newcomer, WorkshopTestFactory.FacilitatorPassphrase);

        blocked.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        accepted.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    private static WebApplicationFactory<AssemblyMarker> LimitedBackend(
        WorkshopTestFactory origin,
        int attemptsPerWindow
    )
    {
        return origin.WithWebHostBuilder(builder =>
            builder
                .UseSetting(
                    "SESSION_CREATION_ATTEMPTS_PER_WINDOW",
                    attemptsPerWindow.ToString(System.Globalization.CultureInfo.InvariantCulture)
                )
                .UseSetting("SESSION_CREATION_ATTEMPT_WINDOW_SECONDS", "600")
        );
    }

    private static HttpClient ClientFor(
        WebApplicationFactory<AssemblyMarker> backend,
        string subject
    )
    {
        var client = backend.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue(
            "Bearer",
            WorkshopTestFactory.TokenFor(subject)
        );

        return client;
    }

    private static Task<HttpResponseMessage> PostSessionAsync(HttpClient client, string passphrase)
    {
        return client.PostAsJsonAsync(
            "/api/sessions",
            new { sessionName = "Workshop", passphrase },
            JsonSerializerOptions.Web
        );
    }
}
