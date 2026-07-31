using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class AuthenticationTests : IClassFixture<WorkshopTestFactory>, IDisposable
{
    private readonly HttpClient client;

    public AuthenticationTests(WorkshopTestFactory factory)
    {
        client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false }
        );
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/health")]
    public async Task AnonymousEndpoints_return_200_without_token(string path)
    {
        var response = await client.GetAsync(path);

        ((int)response.StatusCode).ShouldBe(200);
    }

    [Fact]
    public async Task FallbackPolicy_requires_auth_for_unmapped_api_route()
    {
        var response = await client.GetAsync("/api/anything");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ExpiredToken_returns_401()
    {
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue(
            "Bearer",
            WorkshopTestFactory.TokenFor("test-user", expired: true)
        );

        var response = await client.GetAsync("/api/anything");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TamperedToken_returns_401()
    {
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue(
            "Bearer",
            WorkshopTestFactory.TokenFor("test-user") + "tampered"
        );

        var response = await client.GetAsync("/api/anything");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    public void Dispose()
    {
        client.Dispose();
    }
}
