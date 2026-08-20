using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteGroupFormationRoundTripTests : IAsyncLifetime, IDisposable
{
    private static readonly IReadOnlySet<ValueId> ValidValueIds = TestValueIds
        .Numbered(1, 12)
        .ToHashSet();

    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteGroupFormationRoundTripTests()
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
    public async Task Round_trip_preserves_the_formed_groups()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = SessionWithFormedGroups(identity);
        session.Formation.Groups.Count.ShouldBe(2);

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.GroupFormation);
        loaded.Formation.IsFormed.ShouldBeTrue();
        ShouldHoldIdenticalGroups(loaded, session);
    }

    [Fact]
    public async Task Loading_twice_yields_the_identical_assignment()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await CreateSession(SessionWithFormedGroups(identity));

        var firstLoad = (await LoadSession(identity)).ShouldNotBeNull();
        var secondLoad = (await LoadSession(identity)).ShouldNotBeNull();

        ShouldHoldIdenticalGroups(secondLoad, firstLoad);
    }

    [Fact]
    public async Task A_late_joiner_placed_into_a_group_survives_the_re_save()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var latecomer = new ParticipantId(Guid.NewGuid());
        await CreateSession(SessionWithFormedGroups(identity));

        var reloaded = (await LoadSession(identity)).ShouldNotBeNull();
        reloaded.Join(TestParticipants.Named(latecomer, "Late Lucy"), new FixedRandomness(0));
        reloaded.BumpRevision();
        await SaveSession(reloaded, expectedRevision: 0);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        ShouldHoldIdenticalGroups(loaded, reloaded);
        loaded.Formation.Groups.SelectMany(group => group.Members).ShouldContain(latecomer);
    }

    private static void ShouldHoldIdenticalGroups(Session actual, Session expected)
    {
        actual.Formation.IsFormed.ShouldBe(expected.Formation.IsFormed);
        actual.Formation.Groups.Count.ShouldBe(expected.Formation.Groups.Count);

        foreach (
            var (actualGroup, expectedGroup) in actual.Formation.Groups.Zip(
                expected.Formation.Groups
            )
        )
        {
            actualGroup.Name.ShouldBe(expectedGroup.Name);
            actualGroup.Members.ShouldBe(expectedGroup.Members);
            actualGroup.AssignedValues.ShouldBe(expectedGroup.AssignedValues);
            actualGroup.Scribe.ShouldBe(expectedGroup.Scribe);
            actualGroup.IsSubmitted.ShouldBe(expectedGroup.IsSubmitted);
        }
    }

    private static Session SessionWithFormedGroups(SessionIdentity identity)
    {
        var session = TestSessions.InPhase(identity, Phase.Join);

        var participants = Enumerable
            .Range(1, 9)
            .Select(number => new ParticipantId(Guid.NewGuid()))
            .ToList();
        foreach (
            var (participantId, number) in participants.Select(
                (participantId, index) => (participantId, index + 1)
            )
        )
        {
            session.Join(
                TestParticipants.Named(participantId, $"Person {number}"),
                new FixedRandomness(0)
            );
        }

        session.AdvancePhase();
        TestSessions.WalkQuizToCompletion(session);
        session.AdvancePhase();
        foreach (var participantId in participants)
        {
            session.SubmitValueSelection(
                participantId,
                TestValueIds.Numbered(1, 10),
                ValidValueIds
            );
        }
        session.AdvancePhase();
        session.AdvancePhase();
        new GroupFormation(new TestGroupSolver(), new TestGroupNames(8)).EnsureFormedFor(session);

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
