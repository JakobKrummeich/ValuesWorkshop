using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ValuesWorkshop.Adapters.Persistence;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Adapters.Tests;

public sealed class VotingAnonymityTests : IAsyncLifetime, IDisposable
{
    private static readonly IReadOnlyList<string> TablesWithoutParticipants =
    [
        "voting_state",
        "voting_rounds",
        "vote_tallies",
        "voting_round_ties",
        "winning_values",
    ];

    private readonly SqliteConnection connection;
    private readonly DbContextOptions<WorkshopDbContext> options;

    public VotingAnonymityTests()
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
    public async Task No_vote_table_carries_a_participant_column()
    {
        using var context = new WorkshopDbContext(options);

        foreach (var table in TablesWithoutParticipants)
        {
            var columns = await ColumnsOf(context, table);

            columns.ShouldNotBeEmpty($"table '{table}' should exist");
            columns.ShouldAllBe(
                column => !column.Contains("participant"),
                $"table '{table}' must not name a participant"
            );
        }
    }

    [Fact]
    public async Task The_voted_participants_table_remembers_only_that_someone_voted()
    {
        using var context = new WorkshopDbContext(options);

        var columns = await ColumnsOf(context, "voted_participants");

        columns.ShouldBe(["session_identity", "round_number", "participant_id"], ignoreOrder: true);
    }

    [Fact]
    public async Task A_stored_ballot_links_no_vote_row_to_its_voter()
    {
        var anna = new ParticipantId(Guid.NewGuid());
        var eligibleValues = TestValueIds.Numbered(1, 10);
        var voting = TestVoting.MainRoundOpen(eligibleValues);
        voting.RecordBallot(
            anna,
            new Dictionary<ValueId, int> { [eligibleValues[0]] = 4, [eligibleValues[1]] = 1 }
        );

        var identity = new SessionIdentity(Guid.NewGuid());
        using (var context = new WorkshopDbContext(options))
        {
            await new SqliteSessionRepository(context).CreateAsync(
                TestSessions.InPhase(identity, Phase.FinalVoting, voting: voting)
            );
        }

        foreach (var table in TablesWithoutParticipants)
        {
            RowsMentioning(table, anna.Value.ToString()).ShouldBe(0, $"table '{table}'");
        }

        RowsMentioning("voted_participants", anna.Value.ToString()).ShouldBe(1);
    }

    [Fact]
    public async Task Closed_rounds_keep_no_voter_rows()
    {
        var anna = new ParticipantId(Guid.NewGuid());
        var ben = new ParticipantId(Guid.NewGuid());
        var eligibleValues = TestValueIds.Numbered(1, 10);
        var voting = TestVoting.MainRoundOpen(eligibleValues);
        voting.RecordBallot(anna, new Dictionary<ValueId, int> { [eligibleValues[0]] = 5 });
        voting.CloseRound();
        voting.StartTiebreak();
        voting.RecordBallot(ben, new Dictionary<ValueId, int> { [voting.EligibleValues[0]] = 4 });

        var identity = new SessionIdentity(Guid.NewGuid());
        using (var context = new WorkshopDbContext(options))
        {
            await new SqliteSessionRepository(context).CreateAsync(
                TestSessions.InPhase(identity, Phase.FinalVoting, voting: voting)
            );
        }

        RowsMentioning("voted_participants", anna.Value.ToString()).ShouldBe(0);
        RowsMentioning("voted_participants", ben.Value.ToString()).ShouldBe(1);
    }

    private int RowsMentioning(string table, string text)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"SELECT * FROM {table}";

        using var reader = command.ExecuteReader();
        var mentioningRows = 0;

        while (reader.Read())
        {
            for (var column = 0; column < reader.FieldCount; column++)
            {
                if (reader.GetValue(column).ToString()?.Contains(text) == true)
                {
                    mentioningRows++;
                    break;
                }
            }
        }

        return mentioningRows;
    }

    private static Task<List<string>> ColumnsOf(WorkshopDbContext context, string table)
    {
        return context
            .Database.SqlQuery<string>($"SELECT name AS \"Value\" FROM pragma_table_info({table})")
            .ToListAsync();
    }
}
