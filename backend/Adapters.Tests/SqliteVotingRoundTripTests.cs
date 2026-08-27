using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class SqliteVotingRoundTripTests : IAsyncLifetime, IDisposable
{
    private static readonly IReadOnlyList<ValueId> TenValues = TestValueIds.Numbered(1, 10);
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());

    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public SqliteVotingRoundTripTests()
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
    public async Task Round_trip_preserves_the_open_main_round_with_tallies_and_voters()
    {
        var voting = TestVoting.MainRoundOpen(TenValues);
        voting.RecordBallot(
            Anna,
            new Dictionary<ValueId, int> { [TenValues[0]] = 3, [TenValues[1]] = 2 }
        );
        var identity = new SessionIdentity(Guid.NewGuid());

        await CreateSession(SessionWith(identity, voting));
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.Voting.RoundOpen.ShouldBeTrue();
        loaded.Voting.RoundNumber.ShouldBe(1);
        loaded.Voting.Allotment.ShouldBe(5);
        loaded.Voting.EligibleValues.ShouldBe(TenValues);
        loaded.Voting.OpenRoundTallies[TenValues[0]].ShouldBe(3);
        loaded.Voting.OpenRoundTallies[TenValues[1]].ShouldBe(2);
        loaded.Voting.OpenRoundTallies[TenValues[9]].ShouldBe(0);
        loaded.Voting.VotedCount.ShouldBe(1);
        loaded.Voting.HasVoted(Anna).ShouldBeTrue();
        loaded.Voting.HasVoted(Ben).ShouldBeFalse();
        loaded.Voting.ClosedRounds.ShouldBeEmpty();
    }

    [Fact]
    public async Task Round_trip_preserves_the_closed_round_history_and_the_open_tiebreak()
    {
        var voting = VotingAfterTiedMainRound();
        voting.StartTiebreak();
        voting.RecordBallot(Ben, new Dictionary<ValueId, int> { [TenValues[3]] = 2 });
        var identity = new SessionIdentity(Guid.NewGuid());

        await CreateSession(SessionWith(identity, voting));
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        var closedRound = loaded.Voting.ClosedRounds.ShouldHaveSingleItem();
        closedRound.RoundNumber.ShouldBe(1);
        closedRound.Allotment.ShouldBe(5);
        closedRound.EligibleValues.ShouldBe(TenValues);
        closedRound.Tallies[TenValues[0]].ShouldBe(9);
        closedRound.Tallies[TenValues[5]].ShouldBe(2);
        closedRound.LockedValues.ShouldBe(TenValues.Take(3));
        closedRound.TiedValues.ShouldBe(TenValues.Skip(3).Take(3));
        closedRound.VotedCount.ShouldBe(6);

        loaded.Voting.RoundOpen.ShouldBeTrue();
        loaded.Voting.RoundNumber.ShouldBe(2);
        loaded.Voting.Allotment.ShouldBe(2);
        loaded.Voting.EligibleValues.ShouldBe(TenValues.Skip(3).Take(3));
        loaded.Voting.VotedCount.ShouldBe(1);
        loaded.Voting.HasVoted(Ben).ShouldBeTrue();
        loaded.Voting.WinningValues.ShouldBe(TenValues.Take(3));
    }

    [Fact]
    public async Task Round_trip_preserves_standing_winners_won_across_rounds()
    {
        var voting = VotingAfterTiedMainRound();
        voting.StartTiebreak();
        voting.RecordBallot(
            Anna,
            new Dictionary<ValueId, int> { [TenValues[4]] = 1, [TenValues[5]] = 1 }
        );
        voting.CloseRound();
        var identity = new SessionIdentity(Guid.NewGuid());

        await CreateSession(SessionWith(identity, voting));
        var loaded = (await LoadSession(identity)).ShouldNotBeNull();

        loaded.Voting.WinnersStand.ShouldBeTrue();
        loaded.Voting.WinningValues.ShouldBe([
            TenValues[0],
            TenValues[1],
            TenValues[2],
            TenValues[4],
            TenValues[5],
        ]);
        loaded.Voting.ClosedRounds.Count.ShouldBe(2);
        loaded.Voting.ClosedRounds[1].Allotment.ShouldBe(2);
        loaded.Voting.RoundOpen.ShouldBeFalse();
        loaded.Voting.VotedCount.ShouldBe(1);
        loaded.Voting.HasVoted(Anna).ShouldBeFalse();
        loaded.Voting.TiebreakPending.ShouldBeFalse();
        loaded.Voting.LastClosedRound.ShouldNotBeNull().RoundNumber.ShouldBe(2);
    }

    private static VotingRounds VotingAfterTiedMainRound()
    {
        var voting = TestVoting.MainRoundOpen(TenValues);

        CastBallots(
            voting,
            (TenValues[0], 9),
            (TenValues[1], 8),
            (TenValues[2], 7),
            (TenValues[3], 2),
            (TenValues[4], 2),
            (TenValues[5], 2)
        );
        voting.CloseRound();

        return voting;
    }

    private static void CastBallots(VotingRounds voting, params (ValueId Value, int Count)[] counts)
    {
        var remainingCounts = counts.Select(count => count.Count).ToArray();

        while (remainingCounts.Any(count => count > 0))
        {
            var ballot = new Dictionary<ValueId, int>();
            var spend = voting.Allotment;

            for (var index = 0; index < remainingCounts.Length && spend > 0; index++)
            {
                var portion = Math.Min(remainingCounts[index], spend);
                if (portion > 0)
                {
                    ballot[counts[index].Value] = portion;
                    remainingCounts[index] -= portion;
                    spend -= portion;
                }
            }

            voting.RecordBallot(new ParticipantId(Guid.NewGuid()), ballot);
        }
    }

    private static Session SessionWith(SessionIdentity identity, VotingRounds voting)
    {
        return TestSessions.InPhase(identity, Phase.FinalVoting, voting: voting);
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
