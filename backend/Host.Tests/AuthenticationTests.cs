using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class AuthenticationTests
    : IClassFixture<AuthenticationTests.AuthTestFactory>,
        IDisposable
{
    private static readonly SymmetricSecurityKey TestSigningKey = new(
        "test-signing-key-that-is-long-enough-for-hmac-sha256"u8.ToArray()
    );

    private readonly HttpClient client;

    public AuthenticationTests(AuthTestFactory factory)
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
        var token = GenerateTestToken("test-user", expired: true);
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/anything");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TamperedToken_returns_401()
    {
        var token = GenerateTestToken("test-user") + "tampered";
        client.DefaultRequestHeaders.Authorization = new AuthHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/anything");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    public void Dispose()
    {
        client.Dispose();
    }

    private static string GenerateTestToken(string subject, bool expired = false)
    {
        var credentials = new SigningCredentials(TestSigningKey, SecurityAlgorithms.HmacSha256);

        var expires = expired ? DateTime.UtcNow.AddHours(-1) : DateTime.UtcNow.AddHours(1);
        var notBefore = expired ? DateTime.UtcNow.AddHours(-2) : DateTime.UtcNow.AddMinutes(-1);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, subject)]),
            Expires = expires,
            NotBefore = notBefore,
            Issuer = "test-issuer",
            SigningCredentials = credentials,
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }

    public sealed class AuthTestFactory : WebApplicationFactory<AssemblyMarker>
    {
        protected override void ConfigureWebHost(
            Microsoft.AspNetCore.Hosting.IWebHostBuilder builder
        )
        {
            builder.ConfigureServices(services =>
            {
                services.PostConfigure<JwtBearerOptions>(
                    JwtBearerDefaults.AuthenticationScheme,
                    options =>
                    {
                        options.Authority = null;
                        options.MetadataAddress = null!;
                        options.RequireHttpsMetadata = false;
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidIssuer = "test-issuer",
                            ValidateAudience = false,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = TestSigningKey,
                        };
                    }
                );
            });
        }
    }
}
