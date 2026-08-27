namespace ValuesWorkshop.Domain.Tests;

public class VotingRoundsTests
{
    private static readonly IReadOnlyList<ValueId> TenValues = Enumerable
        .Range(1, 10)
        .Select(number => new ValueId($"wert-{number}"))
        .ToList();

    private static readonly ParticipantId Anna = new(
        Guid.Parse("a0000000-0000-0000-0000-000000000001")
    );
    private static readonly ParticipantId Ben = new(
        Guid.Parse("b0000000-0000-0000-0000-000000000002")
    );

    [Fact]
    public void Initially_no_round_is_open_and_no_winners_exist()
    {
        var voting = new VotingRounds();

        voting.RoundOpen.ShouldBeFalse();
        voting.RoundNumber.ShouldBe(0);
        voting.Allotment.ShouldBe(0);
        voting.EligibleValues.ShouldBeEmpty();
        voting.WinningValues.ShouldBeEmpty();
        voting.WinnersStand.ShouldBeFalse();
        voting.TiebreakPending.ShouldBeFalse();
    }

    [Fact]
    public void Opening_starts_the_main_round_over_the_eligible_values()
    {
        var voting = new VotingRounds();

        voting.OpenRound(VotingRounds.RequiredWinningValueCount, TenValues);

        voting.RoundOpen.ShouldBeTrue();
        voting.RoundNumber.ShouldBe(1);
        voting.Allotment.ShouldBe(5);
        voting.EligibleValues.ShouldBe(TenValues);
        voting.VotedCount.ShouldBe(0);
    }

    [Fact]
    public void Reopening_an_opened_voting_changes_nothing()
    {
        var voting = new VotingRounds();
        voting.OpenRound(VotingRounds.RequiredWinningValueCount, TenValues);
        voting.RecordBallot(Anna, Votes((1, 5)));

        voting.OpenRound(VotingRounds.RequiredWinningValueCount, TenValues.Take(6).ToList());

        voting.EligibleValues.ShouldBe(TenValues);
        voting.VotedCount.ShouldBe(1);
    }

    [Fact]
    public void Opening_without_eligible_values_leaves_voting_unopened()
    {
        var voting = new VotingRounds();

        voting.OpenRound(VotingRounds.RequiredWinningValueCount, []);

        voting.RoundOpen.ShouldBeFalse();
    }

    [Fact]
    public void A_ballot_adds_to_the_tallies_and_marks_only_that_the_caller_voted()
    {
        var voting = OpenedMainRound();

        voting.RecordBallot(Anna, Votes((1, 3), (2, 2)));

        voting.OpenRoundTallies[TenValues[0]].ShouldBe(3);
        voting.OpenRoundTallies[TenValues[1]].ShouldBe(2);
        voting.OpenRoundTallies[TenValues[2]].ShouldBe(0);
        voting.HasVoted(Anna).ShouldBeTrue();
        voting.HasVoted(Ben).ShouldBeFalse();
        voting.VotedCount.ShouldBe(1);
    }

    [Fact]
    public void The_full_allotment_may_stack_on_a_single_value()
    {
        var voting = OpenedMainRound();

        voting.RecordBallot(Anna, Votes((7, 5)));

        voting.OpenRoundTallies[TenValues[6]].ShouldBe(5);
    }

    [Fact]
    public void A_second_ballot_of_the_same_participant_is_refused()
    {
        var voting = OpenedMainRound();
        voting.RecordBallot(Anna, Votes((1, 5)));

        var refusal = Should.Throw<InvariantViolationException>(() =>
            voting.RecordBallot(Anna, Votes((2, 5)))
        );

        refusal.Message.ShouldContain("once per round");
        voting.OpenRoundTallies[TenValues[1]].ShouldBe(0);
    }

    [Fact]
    public void A_ballot_missing_part_of_the_allotment_is_refused()
    {
        var voting = OpenedMainRound();

        Should.Throw<InvariantViolationException>(() => voting.RecordBallot(Anna, Votes((1, 4))));

        voting.HasVoted(Anna).ShouldBeFalse();
        voting.OpenRoundTallies[TenValues[0]].ShouldBe(0);
    }

    [Fact]
    public void A_ballot_overspending_the_allotment_is_refused()
    {
        var voting = OpenedMainRound();

        Should.Throw<InvariantViolationException>(() =>
            voting.RecordBallot(Anna, Votes((1, 3), (2, 3)))
        );
    }

    [Fact]
    public void A_ballot_on_an_ineligible_value_is_refused()
    {
        var voting = OpenedMainRound();

        Should.Throw<InvariantViolationException>(() =>
            voting.RecordBallot(Anna, new Dictionary<ValueId, int> { [new ValueId("other")] = 5 })
        );
    }

    [Fact]
    public void A_ballot_with_a_zero_count_is_refused()
    {
        var voting = OpenedMainRound();

        Should.Throw<InvariantViolationException>(() =>
            voting.RecordBallot(Anna, Votes((1, 5), (2, 0)))
        );
    }

    [Fact]
    public void A_ballot_outside_an_open_round_is_refused()
    {
        var voting = new VotingRounds();

        Should.Throw<InvariantViolationException>(() => voting.RecordBallot(Anna, Votes((1, 5))));
    }

    [Fact]
    public void Closing_a_round_with_a_clear_top_five_makes_the_winners_stand()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 6, 5, 0, 0, 0, 0, 0);

        voting.CloseRound();

        voting.RoundOpen.ShouldBeFalse();
        voting.WinnersStand.ShouldBeTrue();
        voting.WinningValues.ShouldBe(TenValues.Take(5));
        voting.TiebreakPending.ShouldBeFalse();
    }

    [Fact]
    public void A_tie_above_the_boundary_does_not_call_for_a_tiebreak()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 9, 7, 6, 5, 4, 0, 0, 0, 0);

        voting.CloseRound();

        voting.WinnersStand.ShouldBeTrue();
        voting.TiebreakPending.ShouldBeFalse();
    }

    [Fact]
    public void A_tie_across_the_boundary_locks_the_clear_values_and_records_the_tie()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 2, 2, 2, 0, 0, 0, 0);

        voting.CloseRound();

        voting.WinnersStand.ShouldBeFalse();
        voting.WinningValues.ShouldBe(TenValues.Take(3));
        voting.TiebreakPending.ShouldBeTrue();
        voting.LastClosedRound.ShouldNotBeNull().TiedValues.ShouldBe(TenValues.Skip(3).Take(3));
    }

    [Fact]
    public void Locked_winners_of_one_round_rank_by_their_vote_counts()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 5, 6, 9, 7, 8, 0, 0, 0, 0, 0);

        voting.CloseRound();

        voting.WinningValues.ShouldBe([
            TenValues[2],
            TenValues[4],
            TenValues[3],
            TenValues[1],
            TenValues[0],
        ]);
    }

    [Fact]
    public void Closing_an_all_zero_round_ties_every_eligible_value()
    {
        var voting = OpenedMainRound();

        voting.CloseRound();

        voting.WinningValues.ShouldBeEmpty();
        voting.TiebreakPending.ShouldBeTrue();
        voting.LastClosedRound.ShouldNotBeNull().TiedValues.ShouldBe(TenValues);
    }

    [Fact]
    public void Closing_a_closed_round_again_changes_nothing()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 6, 5, 0, 0, 0, 0, 0);
        voting.CloseRound();

        voting.CloseRound();

        voting.ClosedRounds.Count.ShouldBe(1);
        voting.WinnersStand.ShouldBeTrue();
    }

    [Fact]
    public void A_closed_round_keeps_its_final_shape_visible()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 2, 2, 2, 0, 0, 0, 0);

        voting.CloseRound();

        voting.RoundNumber.ShouldBe(1);
        voting.Allotment.ShouldBe(5);
        voting.EligibleValues.ShouldBe(TenValues);
        voting.VotedCount.ShouldBe(6);
        voting.LastClosedRound.ShouldNotBeNull().VotedCount.ShouldBe(6);
        voting.LastClosedRound.ShouldNotBeNull().Tallies[TenValues[0]].ShouldBe(9);
    }

    [Fact]
    public void Closing_a_round_forgets_who_voted()
    {
        var voting = OpenedMainRound();
        voting.RecordBallot(Anna, Votes((1, 5)));

        voting.CloseRound();

        voting.HasVoted(Anna).ShouldBeFalse();
        voting.VotedCount.ShouldBe(1);
    }

    [Fact]
    public void The_tiebreak_round_offers_one_vote_per_open_winner_place()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 2, 2, 2, 0, 0, 0, 0);
        voting.CloseRound();

        voting.StartTiebreak();

        voting.RoundOpen.ShouldBeTrue();
        voting.RoundNumber.ShouldBe(2);
        voting.Allotment.ShouldBe(2);
        voting.EligibleValues.ShouldBe(TenValues.Skip(3).Take(3));
        voting.VotedCount.ShouldBe(0);
        voting.HasVoted(Anna).ShouldBeFalse();
    }

    [Fact]
    public void The_tiebreak_ranks_only_its_own_tallies()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 2, 2, 2, 0, 0, 0, 0);
        voting.CloseRound();
        voting.StartTiebreak();

        Cast(voting, (TenValues[4], 1), (TenValues[5], 3));
        voting.CloseRound();

        voting.WinnersStand.ShouldBeTrue();
        voting.WinningValues.ShouldBe([
            TenValues[0],
            TenValues[1],
            TenValues[2],
            TenValues[5],
            TenValues[4],
        ]);
    }

    [Fact]
    public void Repeated_ties_loop_until_exactly_five_winners_stand()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 6, 5, 5, 5, 0, 0, 0);
        voting.CloseRound();
        voting.TiebreakPending.ShouldBeTrue();

        voting.StartTiebreak();
        voting.Allotment.ShouldBe(1);
        voting.CloseRound();
        voting.WinnersStand.ShouldBeFalse();
        voting.TiebreakPending.ShouldBeTrue();
        voting.LastClosedRound.ShouldNotBeNull().TiedValues.ShouldBe(TenValues.Skip(4).Take(3));

        voting.StartTiebreak();
        voting.RoundNumber.ShouldBe(3);
        Cast(voting, (TenValues[5], 1));
        voting.CloseRound();

        voting.WinnersStand.ShouldBeTrue();
        voting.WinningValues[4].ShouldBe(TenValues[5]);
    }

    [Fact]
    public void A_tiebreak_without_a_pending_tie_is_refused()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 6, 5, 0, 0, 0, 0, 0);
        voting.CloseRound();

        Should.Throw<InvariantViolationException>(voting.StartTiebreak);
    }

    [Fact]
    public void A_tiebreak_while_the_main_round_runs_is_refused()
    {
        var voting = OpenedMainRound();

        Should.Throw<InvariantViolationException>(voting.StartTiebreak);
    }

    [Fact]
    public void Restarting_a_running_tiebreak_changes_nothing()
    {
        var voting = OpenedMainRound();
        CastCounts(voting, 9, 8, 7, 2, 2, 2, 0, 0, 0, 0);
        voting.CloseRound();
        voting.StartTiebreak();
        voting.RecordBallot(Anna, new Dictionary<ValueId, int> { [TenValues[3]] = 2 });

        voting.StartTiebreak();

        voting.RoundNumber.ShouldBe(2);
        voting.VotedCount.ShouldBe(1);
    }

    [Fact]
    public void Restore_rebuilds_the_history_and_the_open_round()
    {
        var closedRound = new ClosedVotingRound(
            1,
            5,
            TenValues,
            TenValues.ToDictionary(value => value, _ => 0),
            1,
            [],
            TenValues
        );
        var voting = VotingRounds.Restore(
            [closedRound],
            new OpenVotingRound(
                2,
                5,
                TenValues,
                TenValues.ToDictionary(value => value, _ => 1),
                new HashSet<ParticipantId> { Ben }
            )
        );

        voting.RoundOpen.ShouldBeTrue();
        voting.RoundNumber.ShouldBe(2);
        voting.ClosedRounds.ShouldHaveSingleItem().ShouldBe(closedRound);
        voting.HasVoted(Ben).ShouldBeTrue();
        voting.OpenRoundTallies[TenValues[9]].ShouldBe(1);
    }

    private static VotingRounds OpenedMainRound()
    {
        var voting = new VotingRounds();
        voting.OpenRound(VotingRounds.RequiredWinningValueCount, TenValues);
        return voting;
    }

    private static Dictionary<ValueId, int> Votes(params (int ValueNumber, int VoteCount)[] votes)
    {
        return votes.ToDictionary(
            vote => new ValueId($"wert-{vote.ValueNumber}"),
            vote => vote.VoteCount
        );
    }

    private static void CastCounts(VotingRounds voting, params int[] countPerValue)
    {
        Cast(voting, countPerValue.Select((count, index) => (TenValues[index], count)).ToArray());
    }

    private static void Cast(VotingRounds voting, params (ValueId Value, int Count)[] counts)
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

            if (spend > 0)
            {
                throw new InvalidOperationException(
                    "The test counts must sum to a multiple of the allotment."
                );
            }

            voting.RecordBallot(new ParticipantId(Guid.NewGuid()), ballot);
        }
    }
}
