using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain.Ports;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class SessionCreationConflictTests
{
    [Fact]
    public async Task A_create_that_loses_the_race_for_its_identity_is_503_and_leaks_no_detail()
    {
        var createRace = new CreateRace();
        using var origin = new WorkshopTestFactory();
        using var backend = RacingBackend(origin, createRace);
        using var client = AuthenticatedClient(backend);
        createRace.LetARivalWinTheNextCreate();

        var response = await client.PostAsJsonAsync(
            "/api/sessions",
            new
            {
                sessionName = "Workshop",
                passphrase = WorkshopTestFactory.FacilitatorPassphrase,
            },
            JsonSerializerOptions.Web
        );

        response.StatusCode.ShouldBe(HttpStatusCode.ServiceUnavailable);

        var body = await response.Content.ReadAsStringAsync();
        body.ShouldNotContain(nameof(ConcurrencyConflictException));
        body.ShouldNotContain("SQLite");
        body.ShouldNotContain("stack");
    }

    private static WebApplicationFactory<AssemblyMarker> RacingBackend(
        WorkshopTestFactory origin,
        CreateRace createRace
    )
    {
        return origin.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ISessionRepository>();
                services.AddScoped<SqliteSessionRepository>();
                services.AddScoped<ISessionRepository>(provider => new GatedSessionRepository(
                    provider.GetRequiredService<SqliteSessionRepository>(),
                    new SaveGate(),
                    createRace
                ));
            })
        );
    }

    private static HttpClient AuthenticatedClient(WebApplicationFactory<AssemblyMarker> backend)
    {
        var client = backend.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue(
            "Bearer",
            WorkshopTestFactory.TokenFor("facilitator-losing-the-race")
        );

        return client;
    }
}
