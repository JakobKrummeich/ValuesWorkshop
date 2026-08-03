using Microsoft.EntityFrameworkCore;

namespace ValuesWorkshop.Adapters.Persistence;

public static class WorkshopDatabaseSchema
{
    public static async Task ApplyAsync(
        WorkshopDbContext database,
        CancellationToken cancellationToken = default
    )
    {
        await database.Database.MigrateAsync(cancellationToken);
    }
}
