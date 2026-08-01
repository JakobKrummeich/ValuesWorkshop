using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteFileDatabaseConcurrencyTests : IDisposable
{
    private readonly string _databaseFile = Path.GetTempFileName();

    public SqliteFileDatabaseConcurrencyTests()
    {
        using var context = new WorkshopDbContext(OptionsFor(waitForTheWriteLock: true));
        context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        File.Delete(_databaseFile);
    }

    [Fact]
    public async Task Two_overlapping_saves_of_the_same_revision_leave_exactly_one_winner()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await CreateThrough(
            OptionsFor(waitForTheWriteLock: true),
            PhasedSession(identity, Phase.Join, revision: 4)
        );

        var joiner = new ParticipantId(Guid.NewGuid());
        using var startLine = new Barrier(2);
        var joining = SaveOnceEveryoneIsReady(
            startLine,
            PhasedSession(identity, Phase.Join, revision: 5, joiner)
        );
        var advancing = SaveOnceEveryoneIsReady(
            startLine,
            PhasedSession(identity, Phase.Quiz, revision: 5)
        );

        var outcomes = await Task.WhenAll(joining, advancing);

        outcomes.Count(outcome => outcome is null).ShouldBe(1);
        outcomes.Count(outcome => outcome is ConcurrencyConflictException).ShouldBe(1);
        var stored = await LoadThrough(identity);
        stored.ShouldNotBeNull();
        stored.Revision.ShouldBe(5);
        var storedJoiners = stored.PhaseProgress.CurrentPhase == Phase.Join ? new[] { joiner } : [];
        stored.Roster.Participants.ShouldBe(storedJoiners);
    }

    [Fact]
    public async Task Two_concurrent_creates_of_the_same_identity_leave_exactly_one_winner()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        using var startLine = new Barrier(2);

        var outcomes = await Task.WhenAll(
            CreateOnceEveryoneIsReady(startLine, TestSessions.Open(identity)),
            CreateOnceEveryoneIsReady(startLine, TestSessions.Open(identity))
        );

        outcomes.Count(outcome => outcome is null).ShouldBe(1);
        var conflict = outcomes.OfType<ConcurrencyConflictException>().ShouldHaveSingleItem();
        conflict.Message.ShouldContain("already exists");
        (await LoadThrough(identity)).ShouldNotBeNull();
    }

    [Fact]
    public async Task A_save_that_cannot_take_the_write_lock_is_reported_as_a_conflict()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await CreateThrough(
            OptionsFor(waitForTheWriteLock: true),
            PhasedSession(identity, Phase.Join, revision: 4)
        );

        await using var lockHolder = new SqliteConnection(ConnectionString());
        await lockHolder.OpenAsync();
        await using var writeLock = await lockHolder.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable
        );
        await using var claim = lockHolder.CreateCommand();
        claim.CommandText = "UPDATE sessions SET revision = revision";
        await claim.ExecuteNonQueryAsync();

        var conflict = await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            SaveThrough(
                OptionsFor(waitForTheWriteLock: false),
                PhasedSession(identity, Phase.Quiz, revision: 5),
                expectedRevision: 4
            )
        );

        conflict.Message.ShouldContain("write lock");
        conflict.Message.ShouldContain("expected revision 4");
    }

    [Fact]
    public async Task A_create_that_cannot_take_the_write_lock_never_claims_an_expected_revision()
    {
        var identity = new SessionIdentity(Guid.NewGuid());

        await using var lockHolder = new SqliteConnection(ConnectionString());
        await lockHolder.OpenAsync();
        await using var writeLock = await lockHolder.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable
        );
        await using var claim = lockHolder.CreateCommand();
        claim.CommandText = "UPDATE sessions SET revision = revision";
        await claim.ExecuteNonQueryAsync();

        var conflict = await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            CreateThrough(OptionsFor(waitForTheWriteLock: false), TestSessions.Open(identity))
        );

        conflict.Message.ShouldContain("write lock");
        conflict.Message.ShouldNotContain("expected revision");
    }

    private async Task<Exception?> CreateOnceEveryoneIsReady(Barrier startLine, Session session)
    {
        return await Task.Run(async () =>
        {
            startLine.SignalAndWait();

            try
            {
                await CreateThrough(OptionsFor(waitForTheWriteLock: true), session);

                return null;
            }
            catch (Exception exception)
            {
                return exception;
            }
        });
    }

    private async Task<Exception?> SaveOnceEveryoneIsReady(Barrier startLine, Session session)
    {
        return await Task.Run(async () =>
        {
            startLine.SignalAndWait();

            try
            {
                await SaveThrough(
                    OptionsFor(waitForTheWriteLock: true),
                    session,
                    expectedRevision: 4
                );

                return null;
            }
            catch (Exception exception)
            {
                return exception;
            }
        });
    }

    private static async Task CreateThrough(
        DbContextOptions<WorkshopDbContext> options,
        Session session
    )
    {
        await using var context = new WorkshopDbContext(options);
        await new SqliteSessionRepository(context).CreateAsync(session);
    }

    private static async Task SaveThrough(
        DbContextOptions<WorkshopDbContext> options,
        Session session,
        long expectedRevision
    )
    {
        await using var context = new WorkshopDbContext(options);
        await new SqliteSessionRepository(context).SaveAsync(session, expectedRevision);
    }

    private async Task<Session?> LoadThrough(SessionIdentity identity)
    {
        await using var context = new WorkshopDbContext(OptionsFor(waitForTheWriteLock: true));

        return await new SqliteSessionRepository(context).LoadAsync(identity);
    }

    private DbContextOptions<WorkshopDbContext> OptionsFor(bool waitForTheWriteLock)
    {
        return new DbContextOptionsBuilder<WorkshopDbContext>()
            .UseSqlite(ConnectionString(waitForTheWriteLock))
            .Options;
    }

    private string ConnectionString(bool waitForTheWriteLock = true)
    {
        return new SqliteConnectionStringBuilder
        {
            DataSource = _databaseFile,
            DefaultTimeout = waitForTheWriteLock ? 30 : 1,
        }.ToString();
    }

    private static Session PhasedSession(
        SessionIdentity identity,
        Phase phase,
        long revision,
        params ParticipantId[] participants
    )
    {
        return Session.Restore(
            identity,
            TestSessions.Facilitator,
            TestSessions.Name,
            Roster.Restore(participants),
            PhaseProgress.Restore(phase),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision
        );
    }
}
