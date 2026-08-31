using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteWinnerRevealRoundTripTests : IAsyncLifetime, IDisposable
{
    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteWinnerRevealRoundTripTests()
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
    public async Task Round_trip_preserves_the_reveal_position_of_the_final_presentation()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = Session.Restore(
            identity,
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore([]),
            PhaseProgress.Restore(Phase.FinalPresentation),
            QuizProgress.Restore(null, false, false, []),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null, 0),
            TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            ),
            WinnerReveal.Restore(3),
            revision: 0
        );

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.Reveal.RevealedCount.ShouldBe(3);
        loaded.Reveal.IsConcluded.ShouldBeFalse();
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
