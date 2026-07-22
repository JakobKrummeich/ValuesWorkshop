using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

SeedDatabase(app);
LogOrToolsVersion(app);

app.MapGet("/", () => "ValuesWorkshop API");
app.MapGet("/health", () => Results.Ok("ok"));

await app.RunAsync();

static void SeedDatabase(WebApplication app)
{
    var dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? "data";
    Directory.CreateDirectory(dataDir);
    var dbPath = Path.Combine(dataDir, "valuesworkshop.db");

    using var connection = new SqliteConnection($"Data Source={dbPath}");
    connection.Open();

    using var createCmd = connection.CreateCommand();
    createCmd.CommandText = """
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """;
    createCmd.ExecuteNonQuery();

    using var countCmd = connection.CreateCommand();
    countCmd.CommandText = "SELECT COUNT(*) FROM sessions";
    var count = (long)countCmd.ExecuteScalar()!;

    if (count == 0)
    {
        using var insertCmd = connection.CreateCommand();
        insertCmd.CommandText = """
            INSERT INTO sessions (id, name, created_at)
            VALUES ('demo-session-1', 'Demo Workshop', datetime('now'))
            """;
        insertCmd.ExecuteNonQuery();
        app.Logger.LogInformation("Seeded demo session: demo-session-1");
    }
}

static void LogOrToolsVersion(WebApplication app)
{
    var solver = new Google.OrTools.Sat.CpSolver();
    _ = solver;
    app.Logger.LogInformation(
        "OR-Tools loaded: {Version}",
        Google.OrTools.Init.OrToolsVersion.VersionString()
    );
}
