using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Adapters.Persistence.Entities;

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
    public async Task Applying_the_schema_twice_changes_nothing()
    {
        using var context = NewContext();
        await WorkshopDatabaseSchema.ApplyAsync(context);
        var applied = await AppliedMigrations(context);

        await WorkshopDatabaseSchema.ApplyAsync(context);

        (await AppliedMigrations(context)).ShouldBe(applied);
    }

    [Fact]
    public async Task A_database_created_without_migrations_is_adopted_with_its_rows_intact()
    {
        using var creator = NewContext();
        await creator.Database.EnsureCreatedAsync();
        creator.Sessions.Add(
            new SessionEntity
            {
                Identity = Guid.NewGuid().ToString(),
                FacilitatorSubject = "facilitator",
                Name = "Older Workshop",
                CreatedAt = "2026-01-01T00:00:00Z",
            }
        );
        await creator.SaveChangesAsync();

        using var context = NewContext();
        await WorkshopDatabaseSchema.ApplyAsync(context);

        (await AppliedMigrations(context)).ShouldNotBeEmpty();
        (await context.Sessions.CountAsync()).ShouldBe(1);
    }

    [Fact]
    public async Task A_database_too_old_to_adopt_is_refused_with_the_tables_it_lacks()
    {
        using var context = NewContext();
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE sessions (identity TEXT PRIMARY KEY)"
        );

        var refusal = await Should.ThrowAsync<InvalidOperationException>(
            WorkshopDatabaseSchema.ApplyAsync(context)
        );

        refusal.Message.ShouldContain("participants");
        refusal.Message.ShouldContain("delete the database file");
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
