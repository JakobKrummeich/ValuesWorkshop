using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class SessionCreationEndpointTests
{
    private const string FacilitatorSubjectClaim = "facilitator-from-token";

    [Fact]
    public async Task A_request_without_a_bearer_token_is_401_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = backend.CreateClient();

        var response = await PostSessionAsync(
            client,
            sessionName: "Workshop",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task A_request_without_a_token_is_challenged_even_without_the_fallback_policy()
    {
        using var origin = new WorkshopTestFactory();
        using var backend = origin.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.Configure<AuthorizationOptions>(options => options.FallbackPolicy = null)
            )
        );
        using var client = backend.CreateClient();

        var response = await PostSessionAsync(
            client,
            sessionName: "Workshop",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        response.Headers.WwwAuthenticate.ShouldContain(header => header.Scheme == "Bearer");
    }

    [Fact]
    public async Task A_wrong_passphrase_is_401_with_an_empty_body_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await PostSessionAsync(
            client,
            sessionName: "Workshop",
            passphrase: "not-the-passphrase"
        );

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).ShouldBeEmpty();
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task An_empty_passphrase_is_401_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await PostSessionAsync(client, sessionName: "Workshop", passphrase: "");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).ShouldBeEmpty();
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task An_absent_passphrase_is_401_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await client.PostAsJsonAsync(
            "/api/sessions",
            new { sessionName = "Workshop" },
            JsonSerializerOptions.Web
        );

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task An_absent_session_name_is_400_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await client.PostAsJsonAsync(
            "/api/sessions",
            new { passphrase = WorkshopTestFactory.FacilitatorPassphrase },
            JsonSerializerOptions.Web
        );

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task A_body_that_is_not_json_is_400_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await client.PostAsync(
            "/api/sessions",
            new StringContent("{ not json", Encoding.UTF8, "application/json")
        );

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task A_blank_session_name_is_400_and_persists_nothing()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await PostSessionAsync(
            client,
            sessionName: "   ",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).ShouldNotContain(
            WorkshopTestFactory.FacilitatorPassphrase
        );
        (await StoredSessionsAsync(backend)).ShouldBeEmpty();
    }

    [Fact]
    public async Task An_accepted_request_is_201_and_persists_the_session_for_the_caller()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await PostSessionAsync(
            client,
            sessionName: "  Values Workshop  ",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var sessionIdentity = await ReadSessionIdentityAsync(response);
        var stored = await LoadAsync(backend, sessionIdentity);

        stored.ShouldNotBeNull();
        stored.Revision.ShouldBe(0);
        stored.Name.Value.ShouldBe("Values Workshop");
        stored.IsFacilitatedBy(new FacilitatorSubject(FacilitatorSubjectClaim)).ShouldBeTrue();
    }

    [Fact]
    public async Task An_accepted_response_never_echoes_the_passphrase()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var response = await PostSessionAsync(
            client,
            sessionName: "Workshop",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        (await response.Content.ReadAsStringAsync()).ShouldNotContain(
            WorkshopTestFactory.FacilitatorPassphrase
        );
    }

    [Fact]
    public async Task Two_accepted_requests_produce_two_different_sessions()
    {
        using var backend = new WorkshopTestFactory();
        using var client = AuthenticatedClient(backend);

        var first = await PostSessionAsync(
            client,
            sessionName: "First",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );
        var second = await PostSessionAsync(
            client,
            sessionName: "Second",
            passphrase: WorkshopTestFactory.FacilitatorPassphrase
        );

        var firstIdentity = await ReadSessionIdentityAsync(first);
        var secondIdentity = await ReadSessionIdentityAsync(second);

        firstIdentity.ShouldNotBe(secondIdentity);
        (await StoredSessionsAsync(backend)).Count.ShouldBe(2);
    }

    private static HttpClient AuthenticatedClient(WorkshopTestFactory backend)
    {
        var client = backend.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue(
            "Bearer",
            WorkshopTestFactory.TokenFor(FacilitatorSubjectClaim)
        );

        return client;
    }

    private static Task<HttpResponseMessage> PostSessionAsync(
        HttpClient client,
        string sessionName,
        string passphrase
    )
    {
        return client.PostAsJsonAsync(
            "/api/sessions",
            new { sessionName, passphrase },
            JsonSerializerOptions.Web
        );
    }

    private static async Task<SessionIdentity> ReadSessionIdentityAsync(
        HttpResponseMessage response
    )
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        return new SessionIdentity(document.RootElement.GetProperty("sessionIdentity").GetGuid());
    }

    private static async Task<Session?> LoadAsync(
        WorkshopTestFactory backend,
        SessionIdentity sessionIdentity
    )
    {
        using var scope = backend.Services.CreateScope();

        return await scope
            .ServiceProvider.GetRequiredService<ISessionRepository>()
            .LoadAsync(sessionIdentity);
    }

    private static async Task<IReadOnlyList<Session>> StoredSessionsAsync(
        WorkshopTestFactory backend
    )
    {
        using var scope = backend.Services.CreateScope();

        return await scope.ServiceProvider.GetRequiredService<ISessionRepository>().LoadAllAsync();
    }
}
