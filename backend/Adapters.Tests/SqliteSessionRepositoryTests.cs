using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;
using ValuesWorkshop.Domain.Ports;

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
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = new Session(identity);

        await SaveSession(session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Identity.ShouldBe(identity);
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Join);
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
        loaded.Revision.ShouldBe(0);
    }

    [Fact]
    public async Task Round_trip_preserves_the_revision()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var session = new Session(identity);
        session.BumpRevision();
        session.BumpRevision();
        session.BumpRevision();

        await SaveSession(session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Revision.ShouldBe(3);
    }

    [Fact]
    public async Task Round_trip_session_with_roster()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var participantOne = new ParticipantId(Guid.NewGuid());
        var participantTwo = new ParticipantId(Guid.NewGuid());
        var session = Session.Restore(
            identity,
            Roster.Restore([participantOne, participantTwo]),
            PhaseProgress.Restore(Phase.Quiz),
            QuizProgress.Restore(2, true, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );

        await SaveSession(session);
        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.Identity.ShouldBe(identity);
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
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
        var identity = new SessionIdentity(Guid.NewGuid());
        var participant = new ParticipantId(Guid.NewGuid());
        var topValueOne = new ValueId("trust");
        var topValueTwo = new ValueId("respect");
        var session = Session.Restore(
            identity,
            Roster.Restore([participant]),
            PhaseProgress.Restore(Phase.SelectionResults),
            QuizProgress.Restore(4, true, true),
            SelectionRound.Restore([participant], [topValueOne, topValueTwo]),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );

        await SaveSession(session);
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
        var identity = new SessionIdentity(Guid.NewGuid());
        var memberOne = new ParticipantId(Guid.NewGuid());
        var memberTwo = new ParticipantId(Guid.NewGuid());
        var value = new ValueId("honesty");
        var group = Group.Restore("Otter", [memberOne, memberTwo], [value], memberOne, true);

        var session = Session.Restore(
            identity,
            Roster.Restore([memberOne, memberTwo]),
            PhaseProgress.Restore(Phase.GroupWork),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(true, [group]),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );

        await SaveSession(session);
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
        var identity = new SessionIdentity(Guid.NewGuid());
        var winnerOne = new ValueId("courage");
        var winnerTwo = new ValueId("integrity");
        var session = Session.Restore(
            identity,
            Roster.Restore([]),
            PhaseProgress.Restore(Phase.FinalPresentation),
            QuizProgress.Restore(null, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore("Eagle", new ValueId("courage")),
            VotingRounds.Restore(false, 2, [winnerOne, winnerTwo]),
            revision: 0
        );

        await SaveSession(session);
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
        var session = new Session(identity);
        await SaveSession(session);

        var updatedSession = Session.Restore(
            identity,
            Roster.Restore([new ParticipantId(Guid.NewGuid())]),
            PhaseProgress.Restore(Phase.Quiz),
            QuizProgress.Restore(1, false, false),
            SelectionRound.Restore([], []),
            FormationRecord.Restore(false, []),
            PresentationWalk.Restore(null, null),
            VotingRounds.Restore(false, 0, []),
            revision: 0
        );
        await SaveSession(updatedSession);

        var loaded = await LoadSession(identity);

        loaded.ShouldNotBeNull();
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Roster.Participants.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Save_with_the_matching_expected_revision_round_trips()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(PhasedSession(identity, Phase.Join, revision: 4), expectedRevision: 0);

        await SaveSession(PhasedSession(identity, Phase.Quiz, revision: 5), expectedRevision: 4);

        var loaded = await LoadSession(identity);
        loaded.ShouldNotBeNull();
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Revision.ShouldBe(5);
    }

    [Fact]
    public async Task Save_with_a_stale_expected_revision_leaves_the_stored_session_untouched()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        var survivor = new ParticipantId(Guid.NewGuid());
        await SaveSession(
            PhasedSession(identity, Phase.Quiz, revision: 4, survivor),
            expectedRevision: 0
        );

        var staleSession = PhasedSession(identity, Phase.GroupWork, revision: 5);

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            SaveSession(staleSession, expectedRevision: 3)
        );

        var loaded = await LoadSession(identity);
        loaded.ShouldNotBeNull();
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Roster.Participants.ShouldBe([survivor]);
        loaded.Revision.ShouldBe(4);
    }

    [Fact]
    public async Task Save_of_an_unknown_session_with_expected_revision_zero_inserts_it()
    {
        var identity = new SessionIdentity(Guid.NewGuid());

        await SaveSession(PhasedSession(identity, Phase.Quiz, revision: 1), expectedRevision: 0);

        var loaded = await LoadSession(identity);
        loaded.ShouldNotBeNull();
        loaded.Revision.ShouldBe(1);
    }

    [Fact]
    public async Task Save_of_an_unknown_session_with_a_nonzero_expected_revision_conflicts()
    {
        var identity = new SessionIdentity(Guid.NewGuid());

        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            SaveSession(PhasedSession(identity, Phase.Quiz, revision: 8), expectedRevision: 7)
        );

        (await LoadSession(identity)).ShouldBeNull();
    }

    [Fact]
    public async Task Only_one_of_two_contexts_that_loaded_the_same_revision_can_save()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(PhasedSession(identity, Phase.Join, revision: 4), expectedRevision: 0);

        using var contextOne = new WorkshopDbContext(_options);
        using var contextTwo = new WorkshopDbContext(_options);
        var repositoryOne = new SqliteSessionRepository(contextOne);
        var repositoryTwo = new SqliteSessionRepository(contextTwo);

        var joiner = new ParticipantId(Guid.NewGuid());
        var sessionForJoin = (await repositoryOne.LoadAsync(identity)).ShouldNotBeNull();
        var sessionForAdvance = (await repositoryTwo.LoadAsync(identity)).ShouldNotBeNull();
        sessionForJoin.Join(joiner, new FixedRandomness(0));
        sessionForJoin.BumpRevision();
        sessionForAdvance.AdvancePhase();
        sessionForAdvance.BumpRevision();

        await repositoryOne.SaveAsync(sessionForJoin, expectedRevision: 4);
        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            repositoryTwo.SaveAsync(sessionForAdvance, expectedRevision: 4)
        );

        var loaded = await LoadSession(identity);
        loaded.ShouldNotBeNull();
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Join);
        loaded.Roster.Participants.ShouldBe([joiner]);
        loaded.Revision.ShouldBe(5);
    }

    [Fact]
    public async Task A_reload_after_a_conflict_sees_what_the_winning_writer_stored()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(PhasedSession(identity, Phase.Join, revision: 4), expectedRevision: 0);

        using var contextOne = new WorkshopDbContext(_options);
        using var contextTwo = new WorkshopDbContext(_options);
        var repositoryOne = new SqliteSessionRepository(contextOne);
        var repositoryTwo = new SqliteSessionRepository(contextTwo);

        var joiner = new ParticipantId(Guid.NewGuid());
        var sessionForJoin = (await repositoryOne.LoadAsync(identity)).ShouldNotBeNull();
        var sessionForAdvance = (await repositoryTwo.LoadAsync(identity)).ShouldNotBeNull();
        sessionForJoin.Join(joiner, new FixedRandomness(0));
        sessionForJoin.BumpRevision();
        await repositoryOne.SaveAsync(sessionForJoin, expectedRevision: 4);
        sessionForAdvance.AdvancePhase();
        sessionForAdvance.BumpRevision();
        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            repositoryTwo.SaveAsync(sessionForAdvance, expectedRevision: 4)
        );

        var reloaded = (await repositoryTwo.LoadAsync(identity)).ShouldNotBeNull();

        reloaded.Revision.ShouldBe(5);
        reloaded.Roster.Participants.ShouldBe([joiner]);
    }

    [Fact]
    public async Task A_retried_save_after_a_conflict_keeps_both_writers_changes()
    {
        var identity = new SessionIdentity(Guid.NewGuid());
        await SaveSession(PhasedSession(identity, Phase.Join, revision: 4), expectedRevision: 0);

        using var contextOne = new WorkshopDbContext(_options);
        using var contextTwo = new WorkshopDbContext(_options);
        var repositoryOne = new SqliteSessionRepository(contextOne);
        var repositoryTwo = new SqliteSessionRepository(contextTwo);

        var joiner = new ParticipantId(Guid.NewGuid());
        var sessionForJoin = (await repositoryOne.LoadAsync(identity)).ShouldNotBeNull();
        var sessionForAdvance = (await repositoryTwo.LoadAsync(identity)).ShouldNotBeNull();
        sessionForJoin.Join(joiner, new FixedRandomness(0));
        sessionForJoin.BumpRevision();
        await repositoryOne.SaveAsync(sessionForJoin, expectedRevision: 4);
        sessionForAdvance.AdvancePhase();
        sessionForAdvance.BumpRevision();
        await Should.ThrowAsync<ConcurrencyConflictException>(() =>
            repositoryTwo.SaveAsync(sessionForAdvance, expectedRevision: 4)
        );

        var retried = (await repositoryTwo.LoadAsync(identity)).ShouldNotBeNull();
        retried.AdvancePhase();
        retried.BumpRevision();
        await repositoryTwo.SaveAsync(retried, expectedRevision: 5);

        var loaded = (await LoadSession(identity)).ShouldNotBeNull();
        loaded.Revision.ShouldBe(6);
        loaded.PhaseProgress.CurrentPhase.ShouldBe(Phase.Quiz);
        loaded.Roster.Participants.ShouldBe([joiner]);
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
        await SaveSession(new Session(identityA));
        await SaveSession(
            Session.Restore(
                identityB,
                Roster.Restore([new ParticipantId(Guid.NewGuid())]),
                PhaseProgress.Restore(Phase.ValueSelection),
                QuizProgress.Restore(null, false, false),
                SelectionRound.Restore([], []),
                FormationRecord.Restore(false, []),
                PresentationWalk.Restore(null, null),
                VotingRounds.Restore(false, 0, []),
                revision: 0
            )
        );

        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        var allSessions = await repository.LoadAllAsync();

        allSessions.Count.ShouldBe(2);
        allSessions.ShouldContain(session => session.Identity == identityA);
        allSessions.ShouldContain(session => session.Identity == identityB);
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

    private static Session PhasedSession(
        SessionIdentity identity,
        Phase phase,
        long revision,
        params ParticipantId[] participants
    )
    {
        return Session.Restore(
            identity,
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

    private async Task SaveSession(Session session, long expectedRevision = 0)
    {
        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        await repository.SaveAsync(session, expectedRevision);
    }

    private async Task<Session?> LoadSession(SessionIdentity identity)
    {
        using var context = new WorkshopDbContext(_options);
        var repository = new SqliteSessionRepository(context);
        return await repository.LoadAsync(identity);
    }
}
