using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ValuesWorkshop.Adapters.Persistence;

public static class WorkshopDatabaseSchema
{
    public static async Task ApplyAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken = default
    )
    {
        var tables = await TableNamesAsync(database, cancellationToken);

        if (IsCreatedBeforeMigrations(database, tables))
        {
            throw new InvalidOperationException(RefusalMessage(database));
        }

        await database.Database.MigrateAsync(cancellationToken);
    }

    private static bool IsCreatedBeforeMigrations(
        WorkshopDbContext database,
        IReadOnlyCollection<string> tables
    )
    {
        return !tables.Contains(HistoryRepository.DefaultTableName)
            && ModelTables(database).Any(table => tables.Contains(table.Name));
    }

    private static string RefusalMessage(WorkshopDbContext database)
    {
        var databaseFile = database.Database.GetDbConnection().DataSource;

        return $"The database at '{databaseFile}' was created before migrations existed: it "
            + $"holds application tables but no {HistoryRepository.DefaultTableName} table, so "
            + "migrations cannot be applied to it. Delete the database file and start again "
            + "(with the development compose stack: "
            + "docker compose -f docker-compose.dev.yml down -v).";
    }

    private static IEnumerable<ITable> ModelTables(WorkshopDbContext database)
    {
        return database.GetService<IDesignTimeModel>().Model.GetRelationalModel().Tables;
    }

    private static Task<List<string>> TableNamesAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        return database
            .Database.SqlQueryRaw<string>(
                "SELECT name AS \"Value\" FROM sqlite_master WHERE type = 'table'"
            )
            .ToListAsync(cancellationToken);
    }
}
