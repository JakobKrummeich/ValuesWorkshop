using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class WorkshopDatabaseSchemaTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public WorkshopDatabaseSchemaTests()
    {
        _connection.Open();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    [Fact]
    public async Task An_empty_database_gets_the_schema_and_a_recorded_migration()
    {
        using var context = NewContext();

        await WorkshopDatabaseSchema.ApplyAsync(context);

        (await AppliedMigrations(context)).ShouldNotBeEmpty();
        (await ColumnsOf(context, "presentation_state")).ShouldContain("shown_value_count");
    }

    [Fact]
    public async Task An_already_migrated_database_keeps_its_recorded_migrations()
    {
        using var context = NewContext();
        await WorkshopDatabaseSchema.ApplyAsync(context);
        var applied = await AppliedMigrations(context);

        await WorkshopDatabaseSchema.ApplyAsync(context);

        (await AppliedMigrations(context)).ShouldBe(applied);
    }

    [Fact]
    public async Task A_database_created_before_migrations_existed_is_refused()
    {
        using var context = NewContext();
        await context.Database.EnsureCreatedAsync();

        var refusal = await Should.ThrowAsync<InvalidOperationException>(
            WorkshopDatabaseSchema.ApplyAsync(context)
        );

        refusal.Message.ShouldContain(_connection.DataSource);
        refusal.Message.ShouldContain("delete");
        refusal.Message.ShouldContain("docker compose -f docker-compose.dev.yml down -v");
    }

    private WorkshopDbContext NewContext()
    {
        return new WorkshopDbContext(
            new DbContextOptionsBuilder<WorkshopDbContext>().UseSqlite(_connection).Options
        );
    }

    private static async Task<IReadOnlyList<string>> AppliedMigrations(WorkshopDbContext context)
    {
        return (await context.Database.GetAppliedMigrationsAsync()).ToList();
    }

    private static Task<List<string>> ColumnsOf(WorkshopDbContext context, string table)
    {
        return context
            .Database.SqlQuery<string>($"SELECT name AS \"Value\" FROM pragma_table_info({table})")
            .ToListAsync();
    }
}
