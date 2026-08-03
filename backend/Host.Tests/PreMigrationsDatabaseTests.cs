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
    public async Task A_database_written_before_migrations_existed_serves_a_session_write()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();
        await WritePreMigrationsDatabase(databasePath);

        try
        {
            using var backend = WorkshopTestFactory.On(databasePath);
            using var client = AuthenticatedClient(backend);

            var response = await client.PostAsJsonAsync(
                "/api/sessions",
                new
                {
                    sessionName = "Workshop",
                    passphrase = WorkshopTestFactory.FacilitatorPassphrase,
                },
                JsonSerializerOptions.Web
            );

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
    public async Task Sessions_stored_before_migrations_existed_survive_the_migration()
    {
        var databasePath = WorkshopTestFactory.TemporaryDatabasePath();
        await WritePreMigrationsDatabase(databasePath);
        var sessionIdentity = Guid.NewGuid();
        await InsertPreMigrationsSession(databasePath, sessionIdentity);

        try
        {
            using var backend = WorkshopTestFactory.On(databasePath);
            using var scope = backend.Services.CreateScope();

            var stored = await scope
                .ServiceProvider.GetRequiredService<ISessionRepository>()
                .LoadAllAsync();

            stored.Count.ShouldBe(1);
            stored[0].Identity.Value.ShouldBe(sessionIdentity);
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(databasePath);
        }
    }

    private static async Task WritePreMigrationsDatabase(string databasePath)
    {
        var schema = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "PreMigrationsSchema.sql")
        );

        await ExecuteAsync(databasePath, schema);
    }

    private static Task InsertPreMigrationsSession(string databasePath, Guid sessionIdentity)
    {
        return ExecuteAsync(
            databasePath,
            $"""
            INSERT INTO sessions
                (identity, facilitator_subject, name, current_phase, revision, is_formed, created_at)
            VALUES
                ('{sessionIdentity}', 'facilitator', 'Older Workshop', 0, 3, 0, '2026-01-01T00:00:00Z');
            INSERT INTO quiz_state (session_identity, is_revealed, is_learning_text_shown)
            VALUES ('{sessionIdentity}', 0, 0);
            INSERT INTO presentation_state (session_identity) VALUES ('{sessionIdentity}');
            INSERT INTO voting_state (session_identity, round_open, round_number)
            VALUES ('{sessionIdentity}', 0, 0);
            """
        );
    }

    private static async Task ExecuteAsync(string databasePath, string sql)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath}");
        await connection.OpenAsync();

        var command = connection.CreateCommand();
        command.CommandText = sql;
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
