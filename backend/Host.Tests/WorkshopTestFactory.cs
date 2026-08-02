using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using ValuesWorkshop.Adapters.Persistence;

namespace ValuesWorkshop.Host.Tests;

public sealed class WorkshopTestFactory : WebApplicationFactory<AssemblyMarker>
{
    internal const string Issuer = "test-issuer";

    internal const string FacilitatorPassphrase = "test-facilitator-passphrase";

    internal static readonly SymmetricSecurityKey SigningKey = new(
        "test-signing-key-that-is-long-enough-for-hmac-sha256"u8.ToArray()
    );

    private readonly string databasePath;
    private readonly bool ownsDatabaseFile;

    static WorkshopTestFactory()
    {
        Environment.SetEnvironmentVariable("FACILITATOR_PASSPHRASE", FacilitatorPassphrase);
    }

    public WorkshopTestFactory()
        : this(TemporaryDatabasePath(), ownsDatabaseFile: true) { }

    private WorkshopTestFactory(string databasePath, bool ownsDatabaseFile)
    {
        this.databasePath = databasePath;
        this.ownsDatabaseFile = ownsDatabaseFile;
    }

    internal static string TemporaryDatabasePath()
    {
        return Path.Combine(Path.GetTempPath(), $"valuesworkshop-tests-{Guid.NewGuid()}.db");
    }

    internal static WorkshopTestFactory On(string databasePath)
    {
        return new WorkshopTestFactory(databasePath, ownsDatabaseFile: false);
    }

    internal static string TokenFor(
        string subject,
        bool expired = false,
        SecurityKey? signingKey = null
    )
    {
        var expires = expired ? DateTime.UtcNow.AddHours(-1) : DateTime.UtcNow.AddHours(1);
        var notBefore = expired ? DateTime.UtcNow.AddHours(-2) : DateTime.UtcNow.AddMinutes(-1);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, subject)]),
            Expires = expires,
            NotBefore = notBefore,
            Issuer = Issuer,
            SigningCredentials = new SigningCredentials(
                signingKey ?? SigningKey,
                SecurityAlgorithms.HmacSha256
            ),
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            UseSharedInMemoryDatabase(services);
            UseTestSigningKey(services);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            SqliteConnection.ClearAllPools();

            if (ownsDatabaseFile)
            {
                File.Delete(databasePath);
            }
        }
    }

    private void UseSharedInMemoryDatabase(IServiceCollection services)
    {
        services.RemoveAll<DbContextOptions<WorkshopDbContext>>();
        services.RemoveAll<DbContextOptions>();
        services.AddDbContext<WorkshopDbContext>(options =>
            options.UseSqlite($"Data Source={databasePath}")
        );
    }

    private static void UseTestSigningKey(IServiceCollection services)
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
                    ValidIssuer = Issuer,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = SigningKey,
                };
            }
        );
    }
}
