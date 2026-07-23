using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteSessionRepositoryTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<WorkshopDbContext> _options;

    public SqliteSessionRepositoryTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<WorkshopDbContext>().UseSqlite(_connection).Options;

        using var context = new WorkshopDbContext(_options);
        context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    [Fact]
    public async Task Round_trip_empty_session()
    {
        var session = new Session();

        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identity, session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.State.CurrentPhase.ShouldBe(Phase.Join);
        loaded.Roster.Participants.ShouldBeEmpty();
        loaded.Quiz.CurrentQuestion.ShouldBeNull();
        loaded.Quiz.IsRevealed.ShouldBeFalse();
        loaded.Quiz.IsLearningTextShown.ShouldBeFalse();
        loaded.Selection.SubmittedBy.ShouldBeEmpty();
        loaded.Selection.TopValues.ShouldBeEmpty();
        loaded.Formation.IsFormed.ShouldBeFalse();
        loaded.Formation.Groups.ShouldBeEmpty();
        loaded.Presentation.PresentingGroup.ShouldBeNull();
        loaded.Presentation.PresentedValue.ShouldBeNull();
        loaded.Voting.RoundOpen.ShouldBeFalse();
        loaded.Voting.RoundNumber.ShouldBe(0);
        loaded.Voting.WinningValues.ShouldBeEmpty();
    }

    [Fact]
    public async Task Round_trip_session_with_roster()
    {
        var participantOne = new ParticipantId(Guid.NewGuid());
        var participantTwo = new ParticipantId(Guid.NewGuid());
        var session = Session.Restore(
            Roster.Restore([participantOne, participantTwo]),
            WorkshopState.Restore(Phase.Quiz),
            QuizProgress.Restore(2, true, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, [])
        );

        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identity, session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.State.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Roster.Participants.Count.ShouldBe(2);
        loaded.Roster.Participants.ShouldContain(participantOne);
        loaded.Roster.Participants.ShouldContain(participantTwo);
        loaded.Quiz.CurrentQuestion.ShouldBe(2);
        loaded.Quiz.IsRevealed.ShouldBeTrue();
        loaded.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public async Task Round_trip_session_with_selections_and_top_values()
    {
        var participant = new ParticipantId(Guid.NewGuid());
        var topValueOne = new ValueId("trust");
        var topValueTwo = new ValueId("respect");
        var session = Session.Restore(
            Roster.Restore([participant]),
            WorkshopState.Restore(Phase.SelectionResults),
            QuizProgress.Restore(4, true, true),
            SelectionRound.Restore([participant], [topValueOne, topValueTwo]),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, [])
        );

        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identity, session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Selection.SubmittedBy.Count.ShouldBe(1);
        loaded.Selection.SubmittedBy.ShouldContain(participant);
        loaded.Selection.TopValues.Count.ShouldBe(2);
        loaded.Selection.TopValues.ShouldContain(topValueOne);
        loaded.Selection.TopValues.ShouldContain(topValueTwo);
    }

    [Fact]
    public async Task Round_trip_session_with_groups()
    {
        var memberOne = new ParticipantId(Guid.NewGuid());
        var memberTwo = new ParticipantId(Guid.NewGuid());
        var value = new ValueId("honesty");
        var group = Group.Restore("Otter", [memberOne, memberTwo], [value], memberOne, true);

        var session = Session.Restore(
            Roster.Restore([memberOne, memberTwo]),
            WorkshopState.Restore(Phase.GroupWork),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(true, [group]),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, [])
        );

        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identity, session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Formation.IsFormed.ShouldBeTrue();
        loaded.Formation.Groups.Count.ShouldBe(1);

        var loadedGroup = loaded.Formation.Groups[0];
        loadedGroup.Name.ShouldBe("Otter");
        loadedGroup.Members.Count.ShouldBe(2);
        loadedGroup.Members.ShouldContain(memberOne);
        loadedGroup.Members.ShouldContain(memberTwo);
        loadedGroup.AssignedValues.Count.ShouldBe(1);
        loadedGroup.AssignedValues.ShouldContain(value);
        loadedGroup.Scribe.ShouldBe(memberOne);
        loadedGroup.IsSubmitted.ShouldBeTrue();
    }

    [Fact]
    public async Task Round_trip_session_with_presentation_and_voting()
    {
        var winnerOne = new ValueId("courage");
        var winnerTwo = new ValueId("integrity");
        var session = Session.Restore(
            Roster.Restore([]),
            WorkshopState.Restore(Phase.FinalPresentation),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore("Eagle", new ValueId("courage")),
            VotingRounds.Restore(false, 2, [winnerOne, winnerTwo])
        );

        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identity, session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Presentation.PresentingGroup.ShouldBe("Eagle");
        loaded.Presentation.PresentedValue.ShouldBe(new ValueId("courage"));
        loaded.Voting.RoundOpen.ShouldBeFalse();
        loaded.Voting.RoundNumber.ShouldBe(2);
        loaded.Voting.WinningValues.Count.ShouldBe(2);
        loaded.Voting.WinningValues[0].ShouldBe(winnerOne);
        loaded.Voting.WinningValues[1].ShouldBe(winnerTwo);
    }

    [Fact]
    public async Task Save_overwrites_existing_session()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = new Session();
        await SaveSession(identity, session);

        var updatedSession = Session.Restore(
            Roster.Restore([new ParticipantId(Guid.NewGuid())]),
            WorkshopState.Restore(Phase.Quiz),
            QuizProgress.Restore(1, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, [])
        );
        await SaveSession(identity, updatedSession);

        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.State.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Roster.Participants.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Load_returns_null_for_nonexistent_session()
    {
        var loaded = await LoadSession(new SessionIdentity(Guid.NewGuid()));
        loaded.ShouldBeNull();
    }

    [Fact]
    public async Task Load_all_returns_all_sessions()
    {
        var identityA = new SessionIdentity(Guid.NewGuid());
        var identityB = new SessionIdentity(Guid.NewGuid());
        await SaveSession(identityA, new Session());
        await SaveSession(
            identityB,
            Session.Restore(
                Roster.Restore([new ParticipantId(Guid.NewGuid())]),
                WorkshopState.Restore(Phase.ValueSelection),
                QuizProgress.Restore(null, false, false),
                SelectionRound.Restore([], []),
                FormationRecord.Restore(false, []),
                PresentationWalk.Restore(null, null),
                VotingRounds.Restore(false, 0, [])
            )
        );

        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        var allSessions = await repository.LoadAllAsync();

        allSessions.Count.ShouldBe(2);
        allSessions.ShouldContain(pair => pair.Identity == identityA);
        allSessions.ShouldContain(pair => pair.Identity == identityB);
    }

    [Fact]
    public void Anonymity_vote_tallies_has_no_participant_column()
    {
        using var context = new WorkshopDbContext(_options);
        var entityType = context.Model.FindEntityType(typeof(Persistence.Entities.VoteTallyEntity));

        entityType.ShouldNotBeNull();
        var propertyNames = entityType.GetProperties().Select(property => property.Name);
        propertyNames.ShouldNotContain("ParticipantId");

        var columnNames = entityType.GetProperties().Select(property => property.GetColumnName());
        columnNames.ShouldNotContain("participant_id");
    }

    [Fact]
    public void Anonymity_voted_participants_has_no_value_or_count_column()
    {
        using var context = new WorkshopDbContext(_options);
        var entityType = context.Model.FindEntityType(
            typeof(Persistence.Entities.VotedParticipantEntity)
        );

        entityType.ShouldNotBeNull();
        var propertyNames = entityType.GetProperties().Select(property => property.Name).ToList();
        propertyNames.ShouldNotContain("ValueId");
        propertyNames.ShouldNotContain("VoteCount");

        var columnNames = entityType
            .GetProperties()
            .Select(property => property.GetColumnName())
            .ToList();
        columnNames.ShouldNotContain("value_id");
        columnNames.ShouldNotContain("vote_count");
    }

    private async Task SaveSession(SessionIdentity identity, Session session)
    {
        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        await repository.SaveAsync(identity, session);
    }

    private async Task<Session?> LoadSession(SessionIdentity identity)
    {
        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        return await repository.LoadAsync(identity);
    }
}
