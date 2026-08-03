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
        if (await IsCreatedBeforeMigrationsAsync(database, cancellationToken))
        {
            await AdoptDatabaseCreatedBeforeMigrationsAsync(database, cancellationToken);
        }

        await database.Database.MigrateAsync(cancellationToken);
    }

    private static async Task<bool> IsCreatedBeforeMigrationsAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        var tables = await TableNamesAsync(database, cancellationToken);

        return !tables.Contains(HistoryRepository.DefaultTableName)
            && ModelTables(database).Any(table => tables.Contains(table.Name));
    }

    private static async Task AdoptDatabaseCreatedBeforeMigrationsAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        await AddColumnsMissingFromTablesAsync(database, cancellationToken);
        await RecordInitialMigrationAsAppliedAsync(database, cancellationToken);
    }

    private static async Task AddColumnsMissingFromTablesAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        foreach (var table in ModelTables(database))
        {
            var columns = await ColumnNamesAsync(database, table.Name, cancellationToken);
            if (columns.Count == 0)
            {
                continue;
            }

            foreach (var column in table.Columns.Where(column => !columns.Contains(column.Name)))
            {
                await ExecuteAsync(
                    database,
                    AddColumnStatement(table.Name, column),
                    cancellationToken
                );
            }
        }
    }

    private static async Task RecordInitialMigrationAsAppliedAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        var history = database.GetService<IHistoryRepository>();
        var initialMigration = database.GetService<IMigrationsAssembly>().Migrations.Keys.First();

        await ExecuteAsync(database, history.GetCreateIfNotExistsScript(), cancellationToken);
        await ExecuteAsync(
            database,
            history.GetInsertScript(new HistoryRow(initialMigration, ProductInfo.GetVersion())),
            cancellationToken
        );
    }

    private static string AddColumnStatement(string table, IColumn column)
    {
        var nullability = column.IsNullable
            ? string.Empty
            : $" NOT NULL DEFAULT {EmptyValueLiteral(column)}";

        return $"ALTER TABLE \"{table}\" ADD COLUMN \"{column.Name}\" {column.StoreType}{nullability}";
    }

    private static string EmptyValueLiteral(IColumn column)
    {
        return column.StoreType.Equals("TEXT", StringComparison.OrdinalIgnoreCase) ? "''" : "0";
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

    private static Task<List<string>> ColumnNamesAsync(
        WorkshopDbContext database,
        string table,
        CancellationToken cancellationToken
    )
    {
        return database
            .Database.SqlQuery<string>($"SELECT name AS \"Value\" FROM pragma_table_info({table})")
            .ToListAsync(cancellationToken);
    }

    private static Task ExecuteAsync(
        WorkshopDbContext database,
        string sql,
        CancellationToken cancellationToken
    )
    {
        return database.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }
}
