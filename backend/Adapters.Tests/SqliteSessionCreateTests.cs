using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteSessionCreateTests : IAsyncLifetime, IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<WorkshopDbContext> _options;

    public SqliteSessionCreateTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<WorkshopDbContext>().UseSqlite(_connection).Options;
    }

    public async Task InitializeAsync()
    {
        using var context = new WorkshopDbContext(_options);
        await WorkshopDatabaseSchema.ApplyAsync(context);
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    [Fact]
    public async Task Create_persists_the_facilitator_and_the_name()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var facilitator = new FacilitatorSubject("auth0|facilitator");

        await CreateSession(Session.Open(identity, facilitator, new SessionName("Monday")));

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Facilitator.ShouldBe(facilitator);
        loaded.Name.ShouldBe(new SessionName("Monday"));
        loaded.Revision.ShouldBe(0);
    }

    [Fact]
    public async Task Create_of_an_identity_that_already_exists_conflicts()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await CreateSession(TestSessions.Open(identity));

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            CreateSession(
                Session.Open(
                    identity,
                    new FacilitatorSubject("auth0|other"),
                    new SessionName("Second attempt")
                )
            )
        );

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Facilitator.ShouldBe(TestSessions.Facilitator);
        loaded.Name.ShouldBe(TestSessions.Name);
    }

    [Fact]
    public async Task Save_of_a_session_that_was_never_created_conflicts()
    {
        var identity = new SessionIdentity(Guid.NewGuid());

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            SaveSession(TestSessions.Open(identity), expectedRevision: 0)
        );

        (await LoadSession(identity)).ShouldBeNull();
    }

    [Fact]
    public async Task Create_then_save_then_load_keeps_the_facilitator_and_the_name()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var facilitator = new FacilitatorSubject("auth0|facilitator");
        var session = Session.Open(identity, facilitator, new SessionName("Monday"));
        await CreateSession(session);

        TestSessions.AdvanceToNextPhase(session);
        session.BumpRevision();
        await SaveSession(session, expectedRevision: 0);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Facilitator.ShouldBe(facilitator);
        loaded.Name.ShouldBe(new SessionName("Monday"));
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Revision.ShouldBe(1);
    }

    private async Task CreateSession(Session session)
    {
        using var context = new WorkshopDbContext(_options);
        await new SqliteSessionRepository(context).CreateAsync(session);
    }

    private async Task SaveSession(Session session, long expectedRevision)
    {
        using var context = new WorkshopDbContext(_options);
        await new SqliteSessionRepository(context).SaveAsync(session, expectedRevision);
    }

    private async Task<Session?> LoadSession(SessionIdentity identity)
    {
        using var context = new WorkshopDbContext(_options);
        return await new SqliteSessionRepository(context).LoadAsync(identity);
    }
}
