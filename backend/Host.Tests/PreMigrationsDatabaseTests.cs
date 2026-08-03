using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using ValuesWorkshop.Domain.Ports;
using AuthHeaderValue = System.Net.Http.Headers.AuthenticationHeaderValue;

namespace ValuesWorkshop.Host.Tests;

public sealed class PreMigrationsDatabaseTests
{
    private const string FacilitatorSubjectClaim = "facilitator-from-token";

    [Fact]
    public async Task A_database_written_before_migrations_existed_is_refused_at_startup()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();
        await WritePreMigrationsDatabase(databasePath);

        try
        {
            using var backend = WorkshopTestFactory.On(databasePath);

            var refusal = Should.Throw<InvalidOperationException>(() => backend.CreateClient());

            refusal.Message.ShouldContain(databasePath);
            refusal.Message.ShouldContain("delete");
            refusal.Message.ShouldContain("docker compose -f docker-compose.dev.yml down -v");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task A_fresh_database_file_is_migrated_at_startup_and_serves_a_session_write()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();

        try
        {
            using var backend = WorkshopTestFactory.On(databasePath);
            using var client = AuthenticatedClient(backend);

            var response = await CreateSession(client);

            response.StatusCode.ShouldBe(HttpStatusCode.Created);
            (await ColumnsOf(databasePath, "presentation_state")).ShouldContain(
                "shown_value_count"
            );
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task An_already_migrated_database_keeps_its_sessions_across_a_restart()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();

        try
        {
            using (var firstRun = WorkshopTestFactory.On(databasePath))
            {
                using var client = AuthenticatedClient(firstRun);
                (await CreateSession(client)).StatusCode.ShouldBe(HttpStatusCode.Created);
            }

            SqliteConnection.ClearAllPools();

            using var secondRun = WorkshopTestFactory.On(databasePath);
            using var scope = secondRun.Services.CreateScope();

            var stored = await scope
                .ServiceProvider.GetRequiredService<ISessionRepository>()
                .LoadAllAsync();

            stored.Count.ShouldBe(1);
            stored[0].Name.Value.ShouldBe("Workshop");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    private static Task<HttpResponseMessage> CreateSession(HttpClient client)
    {
        return client.PostAsJsonAsync(
            "/api/sessions",
            new
            {
                sessionName = "Workshop",
                passphrase = WorkshopTestFactory.FacilitatorPassphrase,
            },
            JsonSerializerOptions.Web
        );
    }

    private static async Task WritePreMigrationsDatabase(string databasePath)
    {
        var schema = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "PreMigrationsSchema.sql")
        );

        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync();

        var command = connection.CreateCommand();
        command.CommandText = schema;
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<IReadOnlyList<string>> ColumnsOf(string databasePath, string table)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync();

        var command = connection.CreateCommand();
        command.CommandText = $"SELECT name FROM pragma_table_info('{table}')";

        var columns = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        return columns;
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
}
