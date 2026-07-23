using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Application;
using ValuesWorkshop.Domain.Ports;
using ValuesWorkshop.Host;

var builder = WebApplication.CreateBuilder(args);

var dataDirectory = Environment.GetEnvironmentVariable("DATA_DIR") ?? "data";
Directory.CreateDirectory(dataDirectory);
var databasePath = Path.Combine(dataDirectory, "valuesworkshop.db");

builder.Services.AddDbContext<WorkshopDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}")
);
builder.Services.AddScoped<ISessionRepository, SqliteSessionRepository>();
builder.Services.AddScoped<IBroadcaster, NoOpBroadcaster>();
builder.Services.AddScoped<SessionCommandHandler>();

var oidcAuthority = Environment.GetEnvironmentVariable("OIDC_AUTHORITY") ?? "http://localhost:9000";
var oidcMetadataUrl = Environment.GetEnvironmentVariable("OIDC_METADATA_URL");
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS") ?? "http://localhost:3000";

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = oidcAuthority;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
        };
        if (!string.IsNullOrEmpty(oidcMetadataUrl))
        {
            options.MetadataAddress = oidcMetadataUrl;
        }
    });
builder
    .Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<WorkshopDbContext>();
    await database.Database.EnsureCreatedAsync();
}

LogOrToolsVersion(app);

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "ValuesWorkshop API").AllowAnonymous();
app.MapGet("/health", () => Results.Ok("ok")).AllowAnonymous();
app.MapGet("/api/protected-test", () => Results.Ok("authenticated"));

await app.RunAsync();

static void LogOrToolsVersion(WebApplication app)
{
    var solver = new Google.OrTools.Sat.CpSolver();
    _ = solver;
    app.Logger.LogInformation(
        "OR-Tools loaded: {Version}",
        Google.OrTools.Init.OrToolsVersion.VersionString()
    );
}
