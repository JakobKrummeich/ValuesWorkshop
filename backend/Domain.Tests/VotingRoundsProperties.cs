using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace ValuesWorkshop.Domain.Tests;

public class VotingRoundsProperties
{
    private const int Allotment = VotingRounds.RequiredWinningValueCount;

    private static readonly SessionIdentity Identity = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );

    private static readonly Arbitrary<VotingScenario> Scenarios = Arb.From(
        WorkshopGenerators
            .CountBetween(Allotment, 12)
            .Generator.SelectMany(eligibleCount =>
                BallotsOver(eligibleCount)
                    .Select(ballots => new VotingScenario(
                        TestValueIds.Numbered(1, eligibleCount),
                        ballots
                    ))
            ),
        scenario =>
            WorkshopGenerators
                .ListsWithOneItemDropped(scenario.Ballots)
                .Where(ballots => ballots.Count > 0)
                .Select(ballots => scenario with { Ballots = ballots })
    );

    private static readonly Arbitrary<int> WrongTotals = WorkshopGenerators.CountBetween(1, 12);

    [Property]
    public Property Every_ballot_spends_exactly_the_rounds_allotment()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var session = SessionAfter(scenario);

                session.Voting.VotedCount.ShouldBe(scenario.Ballots.Count);
                session
                    .Voting.OpenRoundTallies.Values.Sum()
                    .ShouldBe(scenario.Ballots.Count * Allotment);
            }
        );
    }

    [Property]
    public Property The_tally_of_every_value_sums_the_votes_that_were_cast_on_it()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var session = SessionAfter(scenario);

                var tallies = session.Voting.OpenRoundTallies;
                foreach (var (value, valueIndex) in scenario.EligibleValues.Select(Indexed))
                {
                    tallies[value].ShouldBe(scenario.Ballots.Sum(ballot => ballot[valueIndex]));
                }
            }
        );
    }

    [Property]
    public Property A_ballot_that_misspends_the_allotment_is_refused_and_changes_no_tally()
    {
        return Prop.ForAll(
            Scenarios,
            WrongTotals,
            (scenario, wrongTotal) =>
            {
                var session = SessionAfter(scenario);
                var talliesBefore = session.Voting.OpenRoundTallies.ToDictionary();
                var misspentBallot = new Dictionary<ValueId, int>
                {
                    [scenario.EligibleValues[0]] =
                        wrongTotal == Allotment ? wrongTotal + 1 : wrongTotal,
                };

                Should.Throw<InvariantViolationException>(() =>
                    FinalVoting.SubmitVotes(
                        session,
                        Voter(scenario.Ballots.Count + 1),
                        misspentBallot
                    )
                );
                session.Voting.OpenRoundTallies.ShouldAllBe(tally =>
                    talliesBefore[tally.Key] == tally.Value
                );
            }
        );
    }

    [Property]
    public Property A_vote_on_a_value_outside_the_round_is_refused()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var session = SessionAfter(scenario);
                var ineligibleBallot = new Dictionary<ValueId, int>
                {
                    [new ValueId("wert-not-in-this-round")] = Allotment,
                };

                Should.Throw<InvariantViolationException>(() =>
                    FinalVoting.SubmitVotes(
                        session,
                        Voter(scenario.Ballots.Count + 1),
                        ineligibleBallot
                    )
                );
            }
        );
    }

    [Property]
    public Property A_participant_casts_final_votes_at_most_once_per_round()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var session = SessionAfter(scenario);

                Should.Throw<InvariantViolationException>(() =>
                    FinalVoting.SubmitVotes(session, Voter(1), BallotOf(scenario, 0))
                );
                session.Voting.VotedCount.ShouldBe(scenario.Ballots.Count);
            }
        );
    }

    [Property]
    public Property The_winners_do_not_depend_on_the_order_of_the_values_or_the_ballots()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var asGiven = ClosedRoundOf(scenario);
                var reversed = ClosedRoundOf(scenario.Reversed());

                asGiven.LockedValues.ShouldBe(reversed.LockedValues, ignoreOrder: true);
                asGiven.TiedValues.ShouldBe(reversed.TiedValues, ignoreOrder: true);
            }
        );
    }

    [Property]
    public Property A_closed_round_locks_the_allotment_or_leaves_the_open_places_tied()
    {
        return Prop.ForAll(
            Scenarios,
            scenario =>
            {
                var round = ClosedRoundOf(scenario);

                if (round.TiedValues.Count == 0)
                {
                    round.LockedValues.Count.ShouldBe(Allotment);
                    return;
                }

                round.LockedValues.Count.ShouldBeLessThan(Allotment);
                (round.LockedValues.Count + round.TiedValues.Count).ShouldBeGreaterThan(Allotment);
                round.LockedValues.ShouldAllBe(locked =>
                    round.TiedValues.All(tied => round.Tallies[locked] > round.Tallies[tied])
                );
            }
        );
    }

    private static ClosedVotingRound ClosedRoundOf(VotingScenario scenario)
    {
        var session = SessionAfter(scenario);
        FinalVoting.CloseVoting(session);

        return session.Voting.LastClosedRound.ShouldNotBeNull();
    }

    private static Session SessionAfter(VotingScenario scenario)
    {
        var session = TestSessions.InPhase(
            Identity,
            Phase.FinalVoting,
            voting: TestVoting.MainRoundOpen(scenario.EligibleValues),
            roster: WorkshopGenerators.ParticipantsNumbered(scenario.Ballots.Count + 1)
        );

        for (var ballotNumber = 1; ballotNumber <= scenario.Ballots.Count; ballotNumber++)
        {
            FinalVoting.SubmitVotes(
                session,
                Voter(ballotNumber),
                BallotOf(scenario, ballotNumber - 1)
            );
        }

        return session;
    }

    private static IReadOnlyDictionary<ValueId, int> BallotOf(VotingScenario scenario, int index)
    {
        return scenario
            .EligibleValues.Select(Indexed)
            .Where(entry => scenario.Ballots[index][entry.Index] > 0)
            .ToDictionary(entry => entry.Value, entry => scenario.Ballots[index][entry.Index]);
    }

    private static Gen<IReadOnlyList<int[]>> BallotsOver(int eligibleCount)
    {
        return WorkshopGenerators
            .CountBetween(1, 15)
            .Generator.SelectMany(ballotCount =>
                Gen.ListOf(Gen.Piles(eligibleCount, Allotment), ballotCount)
            )
            .Select(ballots => (IReadOnlyList<int[]>)ballots.ToList());
    }

    private static (ValueId Value, int Index) Indexed(ValueId value, int index) => (value, index);

    private static ParticipantId Voter(int number) =>
        WorkshopGenerators.ParticipantNumbered(number);

    public sealed record VotingScenario(
        IReadOnlyList<ValueId> EligibleValues,
        IReadOnlyList<int[]> Ballots
    )
    {
        public VotingScenario Reversed()
        {
            var reversedIndices = Enumerable.Range(0, EligibleValues.Count).Reverse().ToList();

            return new VotingScenario(
                EligibleValues.Reverse().ToList(),
                Ballots
                    .Reverse()
                    .Select(ballot => reversedIndices.Select(index => ballot[index]).ToArray())
                    .ToList()
            );
        }

        public override string ToString() =>
            $"{EligibleValues.Count} values, ballots "
            + string.Join(" | ", Ballots.Select(ballot => string.Join(",", ballot)));
    }
}
