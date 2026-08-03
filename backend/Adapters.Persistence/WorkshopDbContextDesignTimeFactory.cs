using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ValuesWorkshop.Adapters.Persistence;

public sealed class WorkshopDbContextDesignTimeFactory
    : IDesignTimeDbContextFactory<WorkshopDbContext>
{
    public WorkshopDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<WorkshopDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        return new WorkshopDbContext(options);
    }
}
