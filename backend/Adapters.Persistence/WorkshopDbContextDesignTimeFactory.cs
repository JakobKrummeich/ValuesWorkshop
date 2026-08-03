using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ValuesWorkshop.Adapters.Persistence;

public sealed class WorkshopDbContextDesignTimeFactory
    : IDesignTimeDbContextFactory<WorkshopDbContext>
{
    private const string DatabaseTheMigrationToolingNeverConnectsTo =
        "Data Source=design-time-only-never-connected.db";

    public WorkshopDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<WorkshopDbContext>()
            .UseSqlite(DatabaseTheMigrationToolingNeverConnectsTo)
            .Options;

        return new WorkshopDbContext(options);
    }
}
