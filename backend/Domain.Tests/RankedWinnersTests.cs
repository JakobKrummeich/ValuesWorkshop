namespace ValuesWorkshop.Domain.Tests;

public class RankedWinnersTests
{
    private static readonly ValueId Honesty = new("honesty");
    private static readonly ValueId Courage = new("courage");
    private static readonly ValueId Trust = new("trust");
    private static readonly ValueId Openness = new("openness");
    private static readonly ValueId Respect = new("respect");
    private static readonly ValueId Curiosity = new("curiosity");

    private static readonly IReadOnlyList<ValueId> CatalogOrder =
    [
        Honesty,
        Courage,
        Trust,
        Openness,
        Respect,
        Curiosity,
    ];

    [Fact]
    public void Without_a_closed_round_no_winner_is_ranked()
    {
        var voting = new VotingRounds();

        voting.RankedWinners(CatalogOrder).ShouldBeEmpty();
    }

    [Fact]
    public void A_single_rounds_winners_rank_by_tally_descending()
    {
        var voting = VotingRounds.Restore(
            [
                new ClosedVotingRound(
                    1,
                    5,
                    [Honesty, Courage, Trust, Openness, Respect, Curiosity],
                    new Dictionary<ValueId, int>
                    {
                        [Honesty] = 4,
                        [Courage] = 9,
                        [Trust] = 6,
                        [Openness] = 7,
                        [Respect] = 3,
                        [Curiosity] = 1,
                    },
                    6,
                    [Honesty, Courage, Trust, Openness, Respect],
                    []
                ),
            ],
            null
        );

        voting
            .RankedWinners(CatalogOrder)
            .ShouldBe([
                new RankedWinner(1, Courage, 9),
                new RankedWinner(2, Openness, 7),
                new RankedWinner(3, Trust, 6),
                new RankedWinner(4, Honesty, 4),
                new RankedWinner(5, Respect, 3),
            ]);
    }

    [Fact]
    public void A_tally_tie_within_a_round_ranks_by_catalog_order()
    {
        var voting = VotingRounds.Restore(
            [
                new ClosedVotingRound(
                    1,
                    5,
                    [Respect, Openness, Trust, Courage, Honesty],
                    new Dictionary<ValueId, int>
                    {
                        [Honesty] = 5,
                        [Courage] = 5,
                        [Trust] = 5,
                        [Openness] = 5,
                        [Respect] = 5,
                    },
                    5,
                    [Respect, Openness, Trust, Courage, Honesty],
                    []
                ),
            ],
            null
        );

        voting
            .RankedWinners(CatalogOrder)
            .Select(winner => winner.ValueId)
            .ShouldBe([Honesty, Courage, Trust, Openness, Respect]);
    }

    [Fact]
    public void A_tiebreak_lock_ranks_below_the_first_rounds_locks_and_shows_the_first_rounds_tally()
    {
        var voting = VotingRounds.Restore(
            [
                new ClosedVotingRound(
                    1,
                    5,
                    [Honesty, Courage, Trust, Openness, Respect, Curiosity],
                    new Dictionary<ValueId, int>
                    {
                        [Honesty] = 8,
                        [Courage] = 6,
                        [Trust] = 5,
                        [Openness] = 4,
                        [Respect] = 2,
                        [Curiosity] = 2,
                    },
                    5,
                    [Honesty, Courage, Trust, Openness],
                    [Respect, Curiosity]
                ),
                new ClosedVotingRound(
                    2,
                    1,
                    [Respect, Curiosity],
                    new Dictionary<ValueId, int> { [Respect] = 1, [Curiosity] = 3 },
                    4,
                    [Curiosity],
                    []
                ),
            ],
            null
        );

        voting
            .RankedWinners(CatalogOrder)
            .ShouldBe([
                new RankedWinner(1, Honesty, 8),
                new RankedWinner(2, Courage, 6),
                new RankedWinner(3, Trust, 5),
                new RankedWinner(4, Openness, 4),
                new RankedWinner(5, Curiosity, 2),
            ]);
    }
}
