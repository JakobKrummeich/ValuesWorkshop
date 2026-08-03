using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using ValuesWorkshop.Adapters.Persistence;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class MigrationsDriftTests
{
    [Fact]
    public void Every_model_change_is_captured_in_a_migration()
    {
        using var context = new WorkshopDbContextDesignTimeFactory().CreateDbContext([]);

        var differences = ModelDifferencesAgainstMigrations(context);

        differences.ShouldBeEmpty(
            "The EF model has changes that no migration captures. Create one with: "
                + "dotnet tool run dotnet-ef migrations add <Name> "
                + "--project backend/Adapters.Persistence "
                + "--startup-project backend/Adapters.Persistence"
        );
    }

    private static IReadOnlyList<string> ModelDifferencesAgainstMigrations(
        WorkshopDbContext context
    )
    {
        var migrationsAssembly = context.GetService<IMigrationsAssembly>();
        var snapshotModel = migrationsAssembly.ModelSnapshot?.Model;
        snapshotModel.ShouldNotBeNull("No migrations snapshot exists yet.");

        var initializer = context.GetService<IModelRuntimeInitializer>();
        var initializedSnapshotModel = initializer.Initialize(
            ((IMutableModel)snapshotModel!).FinalizeModel(),
            designTime: true
        );

        return context
            .GetService<IMigrationsModelDiffer>()
            .GetDifferences(
                initializedSnapshotModel.GetRelationalModel(),
                context.GetService<IDesignTimeModel>().Model.GetRelationalModel()
            )
            .Select(Describe)
            .ToList();
    }

    private static string Describe(MigrationOperation operation)
    {
        return operation switch
        {
            ColumnOperation column => $"{operation.GetType().Name} {column.Table}.{column.Name}",
            TableOperation table => $"{operation.GetType().Name} {table.Name}",
            _ => operation.GetType().Name,
        };
    }
}
