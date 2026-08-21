using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteGroupWorkRoundTripTests : IAsyncLifetime, IDisposable
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());
    private static readonly ParticipantId Chris = new(Guid.NewGuid());
    private static readonly ValueId Trust = new("vertrauen");
    private static readonly ValueId Courage = new("mut");

    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteGroupWorkRoundTripTests()
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
    public async Task Round_trip_preserves_scribes_actions_and_submitted_states()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = SessionWithGroupWork(identity);

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupWork);
        ShouldHoldIdenticalGroupWork(loaded, session);
    }

    [Fact]
    public async Task A_re_save_keeps_every_action_identity_and_order()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await CreateSession(SessionWithGroupWork(identity));

        var reloaded = (await LoadSession(identity)).ShouldNotBeNull();
        var editingGroup = reloaded.Formation.Groups.Single(group => !group.IsSubmitted);
        var addedActionId = new ActionId(Guid.NewGuid());
        editingGroup.AddAction(Anna, addedActionId, Courage, GroupActionText.Of("Dare more"));
        reloaded.BumpRevision();
        await SaveSession(reloaded, expectedRevision: 0);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        ShouldHoldIdenticalGroupWork(loaded, reloaded);
        loaded
            .Formation.Groups.Single(group => !group.IsSubmitted)
            .Actions.Select(action => action.ActionId)
            .ShouldContain(addedActionId);
    }

    private static void ShouldHoldIdenticalGroupWork(Session actual, Session expected)
    {
        actual.Formation.Groups.Count.ShouldBe(expected.Formation.Groups.Count);

        foreach (
            var (actualGroup, expectedGroup) in actual.Formation.Groups.Zip(
                expected.Formation.Groups
            )
        )
        {
            actualGroup.Name.ShouldBe(expectedGroup.Name);
            actualGroup.Scribe.ShouldBe(expectedGroup.Scribe);
            actualGroup.IsSubmitted.ShouldBe(expectedGroup.IsSubmitted);
            actualGroup.Actions.ShouldBe(expectedGroup.Actions);
        }
    }

    private static Session SessionWithGroupWork(SessionIdentity identity)
    {
        var session = TestSessions.InPhase(
            identity,
            Phase.GroupWork,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore("fox", [Anna, Chris], [Trust, Courage], null, false, []),
                    Group.Restore("owl", [Ben], [Trust], null, false, []),
                ]
            )
        );

        new ScribeAppointment(new FixedRandomness(0)).ExecuteFor(session);

        var fox = session.Formation.Groups[0];
        fox.AddAction(Anna, new ActionId(Guid.NewGuid()), Trust, GroupActionText.Of("Talk openly"));
        fox.AddAction(
            Anna,
            new ActionId(Guid.NewGuid()),
            Courage,
            GroupActionText.Of("Name hard truths")
        );
        fox.AddAction(
            Anna,
            new ActionId(Guid.NewGuid()),
            Trust,
            GroupActionText.Of("Keep promises")
        );

        var owl = session.Formation.Groups[1];
        owl.AddAction(Ben, new ActionId(Guid.NewGuid()), Trust, GroupActionText.Of("Listen first"));
        owl.Submit(Ben);

        return session;
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
