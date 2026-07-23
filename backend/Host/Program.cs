using Microsoft.EntityFrameworkCore;
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

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<WorkshopDbContext>();
    await database.Database.EnsureCreatedAsync();
}

LogOrToolsVersion(app);

app.MapGet("/", () => "ValuesWorkshop API");
app.MapGet("/health", () => Results.Ok("ok"));

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
