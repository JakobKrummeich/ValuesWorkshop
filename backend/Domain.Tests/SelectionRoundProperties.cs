using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace ValuesWorkshop.Domain.Tests;

public class SelectionRoundProperties
{
    private static readonly SessionIdentity Identity = new(
        Guid.Parse("00000000-0000-0000-0000-00000000f00d")
    );
    private static readonly IReadOnlyList<ValueId> Catalog = TestValueIds.Numbered(1, 50);
    private static readonly IReadOnlySet<ValueId> CatalogValueIds = Catalog.ToHashSet();

    private static readonly Gen<IReadOnlyList<ValueId>> WellFormedSelection =
        WorkshopGenerators.DistinctValuesFrom(Catalog, SelectionRound.ValuesPerSelection);

    private static readonly Arbitrary<IReadOnlyList<ValueId>> WellFormedSelections = Arb.From(
        WellFormedSelection
    );

    private static readonly Arbitrary<IReadOnlyList<ValueId>> MalformedSelections = Arb.From(
        Gen.ListOf(Gen.Elements<ValueId>(Catalog))
            .Select(picks => (IReadOnlyList<ValueId>)picks.ToList())
            .Where(picks =>
                picks.Count != SelectionRound.ValuesPerSelection
                || picks.Distinct().Count() != SelectionRound.ValuesPerSelection
            ),
        WorkshopGenerators.ListsWithOneItemDropped
    );

    private static readonly Arbitrary<IReadOnlyList<IReadOnlyList<ValueId>>> SelectionRosters =
        Arb.From(
            WorkshopGenerators
                .CountBetween(1, 12)
                .Generator.SelectMany(participantCount =>
                    Gen.ListOf(WellFormedSelection, participantCount)
                )
                .Select(selections => (IReadOnlyList<IReadOnlyList<ValueId>>)selections.ToList()),
            WorkshopGenerators.ListsWithOneItemDropped
        );

    [Property]
    public Property Exactly_ten_values_survive_a_selection_whatever_order_they_arrive_in()
    {
        return Prop.ForAll(
            WellFormedSelections,
            selection =>
            {
                var session = SessionWith([selection]);

                var survivors = session.Selection.SelectedValuesOf(ParticipantNumbered(1));
                survivors.Count.ShouldBe(SelectionRound.ValuesPerSelection);
                survivors.ShouldBe(selection, ignoreOrder: true);
                session.Selection.HasSubmitted(ParticipantNumbered(1)).ShouldBeTrue();
            }
        );
    }

    [Property]
    public Property A_selection_that_is_not_ten_distinct_values_is_refused_and_changes_nothing()
    {
        return Prop.ForAll(
            MalformedSelections,
            picks =>
            {
                var session = SessionWith([]);

                Should.Throw<MalformedPayloadException>(() =>
                    session.SubmitValueSelection(ParticipantNumbered(1), picks, CatalogValueIds)
                );
                session.Selection.SubmittedCount.ShouldBe(0);
                session.Selection.SelectedValues.ShouldBeEmpty();
            }
        );
    }

    [Property]
    public Property Every_participant_contributes_exactly_ten_values_to_the_tally()
    {
        return Prop.ForAll(
            SelectionRosters,
            selections =>
            {
                var session = SessionWith(selections);

                session.Selection.SubmittedCount.ShouldBe(selections.Count);
                session
                    .Selection.SelectionTallies.Values.Sum()
                    .ShouldBe(selections.Count * SelectionRound.ValuesPerSelection);
            }
        );
    }

    [Property]
    public Property The_tally_does_not_depend_on_the_order_the_selections_arrive_in()
    {
        return Prop.ForAll(
            SelectionRosters,
            selections =>
            {
                var forwards = SessionWith(selections).Selection.SelectionTallies;
                var backwards = SessionWith(
                    selections.Reverse().ToList()
                ).Selection.SelectionTallies;

                forwards.Keys.ShouldBe(backwards.Keys, ignoreOrder: true);
                forwards.ShouldAllBe(tally => backwards[tally.Key] == tally.Value);
            }
        );
    }

    [Property]
    public Property A_participant_hands_in_a_selection_at_most_once()
    {
        return Prop.ForAll(
            WellFormedSelections,
            WellFormedSelections,
            (firstSelection, secondSelection) =>
            {
                var session = SessionWith([firstSelection]);

                Should.Throw<InvariantViolationException>(() =>
                    session.SubmitValueSelection(
                        ParticipantNumbered(1),
                        secondSelection,
                        CatalogValueIds
                    )
                );
                session
                    .Selection.SelectedValuesOf(ParticipantNumbered(1))
                    .ShouldBe(firstSelection, ignoreOrder: true);
            }
        );
    }

    [Property]
    public Property Every_top_value_outpolls_every_value_that_missed_the_cut()
    {
        return Prop.ForAll(
            SelectionRosters,
            selections =>
            {
                var session = SessionWith(selections);
                session.AdvancePhase();

                var tallies = session.Selection.SelectionTallies;
                var topValues = session.Selection.TopValues;
                var missedTheCut = tallies.Keys.Except(topValues).ToList();

                topValues.ShouldAllBe(value => tallies.ContainsKey(value));
                missedTheCut.ShouldAllBe(missed =>
                    topValues.Min(top => tallies[top]) > tallies[missed]
                );
            }
        );
    }

    [Property]
    public Property The_top_values_widen_past_ten_only_to_take_in_a_tie_at_the_cut()
    {
        return Prop.ForAll(
            SelectionRosters,
            selections =>
            {
                var session = SessionWith(selections);
                session.AdvancePhase();

                var tallies = session.Selection.SelectionTallies;
                var topValues = session.Selection.TopValues;
                var cutoffCount = topValues.Min(value => tallies[value]);

                topValues.Count.ShouldBe(tallies.Count(tally => tally.Value >= cutoffCount));
                topValues.Count.ShouldBeGreaterThanOrEqualTo(
                    Math.Min(TopValueTargetCount, tallies.Count)
                );
            }
        );
    }

    private const int TopValueTargetCount = 10;

    private static Session SessionWith(IReadOnlyList<IReadOnlyList<ValueId>> selections)
    {
        var session = TestSessions.InPhase(
            Identity,
            Phase.ValueSelection,
            roster: WorkshopGenerators.ParticipantsNumbered(Math.Max(selections.Count, 1))
        );

        for (var participantNumber = 1; participantNumber <= selections.Count; participantNumber++)
        {
            session.SubmitValueSelection(
                ParticipantNumbered(participantNumber),
                selections[participantNumber - 1],
                CatalogValueIds
            );
        }

        return session;
    }

    private static ParticipantId ParticipantNumbered(int number) =>
        WorkshopGenerators.ParticipantNumbered(number);
}
