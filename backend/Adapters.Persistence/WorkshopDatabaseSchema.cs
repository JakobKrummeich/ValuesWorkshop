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
            await AdoptDatabaseCreatedBeforeMigrationsAsync(database, tables, cancellationToken);
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

    private static async Task AdoptDatabaseCreatedBeforeMigrationsAsync(
        WorkshopDbContext database,
        IReadOnlyCollection<string> tables,
        CancellationToken cancellationToken
    )
    {
        RefuseSchemaMissingTables(database, tables);
        await AddColumnsMissingFromTablesAsync(database, cancellationToken);
        await RecordInitialMigrationAsAppliedAsync(database, cancellationToken);
    }

    private static void RefuseSchemaMissingTables(
        WorkshopDbContext database,
        IReadOnlyCollection<string> tables
    )
    {
        var missing = ModelTables(database)
            .Select(table => table.Name)
            .Where(name => !tables.Contains(name))
            .ToList();

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"This database was created before migrations existed and is missing the tables "
                    + $"{string.Join(", ", missing)}. It is too old to adopt: delete the database "
                    + "file and start again."
            );
        }
    }

    private static async Task AddColumnsMissingFromTablesAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken
    )
    {
        foreach (var table in ModelTables(database))
        {
            var columns = await ColumnNamesAsync(database, table.Name, cancellationToken);

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
