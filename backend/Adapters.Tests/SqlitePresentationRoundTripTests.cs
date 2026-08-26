using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqlitePresentationRoundTripTests : IAsyncLifetime, IDisposable
{
    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqlitePresentationRoundTripTests()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        options = new DbContextOptionsBuilder<WorkshopDbContext>().UseSqlite(connection).Options;
    }

    public async Task InitializeAsync()
    {
        using var context = new WorkshopDbContext(options);
        await WorkshopDatabaseSchema.ApplyAsync(context);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        connection.Dispose();
    }

    [Fact]
    public async Task Round_trip_preserves_a_group_intro_position_of_the_presentation_walk()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = Session.Restore(
            identity,
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([]),
            PhaseProgress.Restore(Phase.ValuePresentation),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore("Eagle", null, 2),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.Presentation.PresentingGroup.ShouldBe("Eagle");
        loaded.Presentation.PresentedValue.ShouldBeNull();
        loaded.Presentation.ShownValueCount.ShouldBe(2);
    }

    private async Task CreateSession(Session session)
    {
        using var context = new WorkshopDbContext(options);
        await new SqliteSessionRepository(context).CreateAsync(session);
    }

    private async Task<Session?> LoadSession(SessionIdentity identity)
    {
        using var context = new WorkshopDbContext(options);
        return await new SqliteSessionRepository(context).LoadAsync(identity);
    }
}
