using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using ValuesWorkshop.Adapters.Persistence;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class DatabaseDiagramTests
{
    [Fact]
    public void The_checked_in_diagram_draws_the_model_EF_Core_builds()
    {
        using var database = new WorkshopDbContext(
            new DbContextOptionsBuilder<WorkshopDbContext>()
                .UseSqlite("Data Source=:memory:")
                .Options
        );

        GeneratedDiagram.ShouldMatchCheckedInFile(
            DatabaseDiagram.Render(database.Model),
            "database.mmd"
        );
    }

    [Fact]
    public void Every_table_the_context_maps_is_drawn()
    {
        using var database = new WorkshopDbContext(
            new DbContextOptionsBuilder<WorkshopDbContext>()
                .UseSqlite("Data Source=:memory:")
                .Options
        );

        var diagram = DatabaseDiagram.Render(database.Model);

        foreach (var entityType in database.Model.GetEntityTypes())
        {
            diagram.ShouldContain($"    {entityType.GetTableName()} {{");
        }
    }

    [Fact]
    public void A_column_carries_its_store_type_its_keys_and_whether_it_may_be_missing()
    {
        var diagram = DatabaseDiagram.Render(CatalogueModel());

        diagram.ShouldContain("        TEXT identity PK");
        diagram.ShouldContain("        TEXT title UK");
        diagram.ShouldContain("        TEXT shelf_identity FK \"nullable\"");
    }

    [Fact]
    public void A_relationship_carries_the_cardinality_the_foreign_key_states()
    {
        var diagram = DatabaseDiagram.Render(CatalogueModel());

        diagram.ShouldContain("    shelves |o--o{ books : \"shelf_identity\"");
        diagram.ShouldContain("    books ||--o| book_covers : \"book_identity\"");
    }

    private static IModel CatalogueModel()
    {
        using var catalogue = new CatalogueDbContext(
            new DbContextOptionsBuilder<CatalogueDbContext>()
                .UseSqlite("Data Source=:memory:")
                .Options
        );

        return catalogue.Model;
    }
}
