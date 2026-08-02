using System.Globalization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Adapters.Web;
using ValuesWorkshop.Application;
using ValuesWorkshop.Application.Intents;
using ValuesWorkshop.Application.Ports.Driven;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;
using ValuesWorkshop.Host;
using ValuesWorkshop.Host.Auth;

var builder = WebApplication.CreateBuilder(args);

var dataDirectory = Environment.GetEnvironmentVariable("DATA_DIR") ?? "data";
Directory.CreateDirectory(dataDirectory);
var databasePath = Path.Combine(dataDirectory, "valuesworkshop.db");

builder.Services.AddDbContext<WorkshopDbContext>(options =>
    options.UseSqlite($"Data Source={databasePath}")
);
builder.Services.AddScoped<ISessionRepository, SqliteSessionRepository>();
builder.Services.AddScoped<IBroadcaster, SignalRBroadcaster>();
builder.Services.AddScoped<SessionCommandHandler>();
builder.Services.AddScoped<SessionCreationHandler>();
builder.Services.AddScoped<IntentPipeline>();
builder.Services.AddSingleton<IRandomness, SystemRandomness>();
builder.Services.AddSingleton<IFacilitatorPassphrase>(
    new FacilitatorPassphrase(Environment.GetEnvironmentVariable("FACILITATOR_PASSPHRASE"))
);
builder.Services.AddSingleton<WorkshopStateCache>();
builder.Services.AddSingleton<SessionConnectionRegistry>();
builder.Services.AddSingleton<RoleStateDispatcher>();
builder.Services.AddSingleton(
    new StateResendInterval(
        TimeSpan.FromMilliseconds(
            double.Parse(
                builder.Configuration["STATE_RESEND_INTERVAL_MS"] ?? "500",
                CultureInfo.InvariantCulture
            )
        )
    )
);
builder.Services.AddHostedService<StateResendService>();
builder.Services.AddSignalR();
builder.Services.AddSessionCreationRateLimit(
    new SessionCreationRateLimit(
        int.Parse(
            builder.Configuration["SESSION_CREATION_ATTEMPTS_PER_WINDOW"] ?? "5",
            CultureInfo.InvariantCulture
        ),
        TimeSpan.FromSeconds(
            double.Parse(
                builder.Configuration["SESSION_CREATION_ATTEMPT_WINDOW_SECONDS"] ?? "60",
                CultureInfo.InvariantCulture
            )
        )
    )
);

var oidcAuthority = Environment.GetEnvironmentVariable("OIDC_AUTHORITY") ?? "http://localhost:9000";
var oidcMetadataUrl = Environment.GetEnvironmentVariable("OIDC_METADATA_URL");
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS") ?? "http://localhost:3000";

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = oidcAuthority;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
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
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = HubAccessToken.ReadFromQueryString,
        };
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
app.UseRateLimiter();

app.MapGet("/", () => "ValuesWorkshop API").AllowAnonymous();
app.MapGet("/health", () => Results.Ok("ok")).AllowAnonymous();

app.MapSessionCreation();

app.MapHub<FacilitatorHub>("/hub/facilitator");
app.MapHub<ParticipantHub>("/hub/participant");
app.MapHub<PresenterHub>("/hub/presenter");

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
