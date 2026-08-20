using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteQuizRoundTripTests : IAsyncLifetime, IDisposable
{
    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteQuizRoundTripTests()
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
    public async Task Round_trip_preserves_a_quiz_walked_with_the_domain_mutators()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var anna = new ParticipantId(Guid.NewGuid());
        var ben = new ParticipantId(Guid.NewGuid());
        var session = TestSessions.InPhase(identity, Phase.Join);
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        session.Join(TestParticipants.Named(ben, "Ben"), new FixedRandomness(0));
        TestSessions.AdvanceToNextPhase(session);
        session.ChooseQuizAnswer(anna, questionIndex: 0, answerIndex: 1);
        session.RevealAnswer();
        session.ShowLearningText();
        session.PoseNextQuestion(questionCount: 5);
        session.ChooseQuizAnswer(ben, questionIndex: 1, answerIndex: 2);
        session.ChooseQuizAnswer(anna, questionIndex: 1, answerIndex: 2);
        session.RevealAnswer();

        await CreateSession(session);
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Quiz.CurrentQuestionIndex.ShouldBe(1);
        loaded.Quiz.IsRevealed.ShouldBeTrue();
        loaded.Quiz.IsLearningTextShown.ShouldBeFalse();
        loaded.Quiz.CastAnswers.ShouldBe(
            [new CastAnswer(0, anna, 1), new CastAnswer(1, ben, 2), new CastAnswer(1, anna, 2)],
            ignoreOrder: true
        );
        loaded.Quiz.AnswerTallies.ShouldBe([0, 0, 2]);
        loaded.Quiz.AnsweredCount.ShouldBe(2);
    }

    [Fact]
    public async Task Saving_again_replaces_the_stored_answers_instead_of_duplicating_them()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var anna = new ParticipantId(Guid.NewGuid());
        var session = TestSessions.InPhase(identity, Phase.Join);
        session.Join(TestParticipants.Named(anna, "Anna"), new FixedRandomness(0));
        TestSessions.AdvanceToNextPhase(session);
        session.ChooseQuizAnswer(anna, questionIndex: 0, answerIndex: 0);
        await CreateSession(session);

        var reloaded = (await LoadSession(identity)).ShouldNotBeNull();
        reloaded.BumpRevision();
        await SaveSession(reloaded, expectedRevision: 0);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Quiz.CastAnswers.ShouldBe([new CastAnswer(0, anna, 0)]);
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
