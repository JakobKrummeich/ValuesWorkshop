using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteSelectionRoundTripTests : IAsyncLifetime, IDisposable
{
    private static readonly IReadOnlySet<ValueId> ValidValueIds = ValueIdsNumbered(1, 12)
        .ToHashSet();

    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteSelectionRoundTripTests()
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
    public async Task Round_trip_preserves_selections_submitted_with_the_domain_mutators()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var anna = new ParticipantId(Guid.NewGuid());
        var ben = new ParticipantId(Guid.NewGuid());
        var session = TestSessions.InPhase(identity, Phase.Join);
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        session.Join(TestParticipants.Named(ben, "Ben"), new FixedRandomness(0));
        TestSessions.AdvanceToNextPhase(session);
        TestSessions.AdvanceToNextPhase(session);
        session.SubmitValueSelection(anna, ValueIdsNumbered(1, 10), ValidValueIds);
        session.SubmitValueSelection(ben, ValueIdsNumbered(3, 10), ValidValueIds);

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.ValueSelection);
        loaded.Selection.SubmittedBy.ShouldBe([anna, ben], ignoreOrder: true);
        loaded.Selection.SelectedValues.ShouldBe(
            ValueIdsNumbered(1, 10)
                .Select(valueId => new SelectedValue(anna, valueId))
                .Concat(ValueIdsNumbered(3, 10).Select(valueId => new SelectedValue(ben, valueId)))
                .ToList(),
            ignoreOrder: true
        );
        loaded.Selection.SelectionTallies[new ValueId("wert-1")].ShouldBe(1);
        loaded.Selection.SelectionTallies[new ValueId("wert-3")].ShouldBe(2);
        loaded.Selection.SelectionTallies[new ValueId("wert-12")].ShouldBe(1);
        loaded.Selection.TopValues.ShouldBeEmpty();
    }

    [Fact]
    public async Task Round_trip_preserves_the_top_values_fixed_on_entering_the_results_phase()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var anna = new ParticipantId(Guid.NewGuid());
        var ben = new ParticipantId(Guid.NewGuid());
        var session = TestSessions.InPhase(identity, Phase.Join);
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        session.Join(TestParticipants.Named(ben, "Ben"), new FixedRandomness(0));
        TestSessions.AdvanceToNextPhase(session);
        TestSessions.AdvanceToNextPhase(session);
        session.SubmitValueSelection(anna, ValueIdsNumbered(1, 10), ValidValueIds);
        session.SubmitValueSelection(ben, ValueIdsNumbered(3, 10), ValidValueIds);
        TestSessions.AdvanceToNextPhase(session, ValueIdsNumbered(1, 12));
        session.Selection.TopValues.Count.ShouldBe(12);

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        loaded.Selection.TopValues.ShouldBe(session.Selection.TopValues, ignoreOrder: true);
    }

    [Fact]
    public async Task Saving_again_replaces_the_stored_selections_instead_of_duplicating_them()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var anna = new ParticipantId(Guid.NewGuid());
        var session = TestSessions.InPhase(identity, Phase.Join);
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        TestSessions.AdvanceToNextPhase(session);
        TestSessions.AdvanceToNextPhase(session);
        session.SubmitValueSelection(anna, ValueIdsNumbered(1, 10), ValidValueIds);
        await CreateSession(session);

        var reloaded = (await LoadSession(identity)).ShouldNotBeNull();
        reloaded.BumpRevision();
        await SaveSession(reloaded, expectedRevision: 0);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Selection.SubmittedBy.ShouldBe([anna]);
        loaded.Selection.SelectedValues.ShouldBe(
            ValueIdsNumbered(1, 10).Select(valueId => new SelectedValue(anna, valueId)).ToList(),
            ignoreOrder: true
        );
    }

    private static IReadOnlyList<ValueId> ValueIdsNumbered(int firstNumber, int valueCount)
    {
        return Enumerable
            .Range(firstNumber, valueCount)
            .Select(valueNumber => new ValueId($"wert-{valueNumber}"))
            .ToList();
    }

    private async Task CreateSession(Session session)
    {
        using var context = new WorkshopDbContext(options);
        await new SqliteSessionRepository(context).CreateAsync(session);
    }

    private async Task SaveSession(Session session, long expectedRevision)
    {
        using var context = new WorkshopDbContext(options);
        await new SqliteSessionRepository(context).SaveAsync(session, expectedRevision);
    }

    private async Task<Session?> LoadSession(SessionIdentity identity)
    {
        using var context = new WorkshopDbContext(options);
        return await new SqliteSessionRepository(context).LoadAsync(identity);
    }
}
