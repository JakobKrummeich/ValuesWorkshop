namespace ValuesWorkshop.Domain.Tests;

public class SessionDetermineTopValuesTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());
    private static readonly ParticipantId Chris = new(Guid.NewGuid());

    private static readonly IReadOnlyList<ValueId> CatalogOrder = TestValueIds.Numbered(1, 12);
    private static readonly IReadOnlySet<ValueId> ValidValueIds = CatalogOrder.ToHashSet();

    [Fact]
    public void Entering_the_results_phase_fixes_the_ten_most_selected_values()
    {
        var session = SelectionSessionWith(Anna, Ben, Chris);
        session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds);
        session.SubmitValueSelection(Ben, TestValueIds.Numbered(3, 10), ValidValueIds);
        session.SubmitValueSelection(Chris, TestValueIds.Numbered(3, 10), ValidValueIds);

        TestSessions.AdvanceToNextPhase(session, CatalogOrder);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        session.Selection.TopValues.ShouldBe(TestValueIds.Numbered(3, 10), ignoreOrder: true);
    }

    [Fact]
    public void A_tie_at_tenth_place_widens_the_top_values_beyond_ten()
    {
        var session = SelectionSessionWith(Anna, Ben);
        session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds);
        session.SubmitValueSelection(Ben, TestValueIds.Numbered(3, 10), ValidValueIds);

        TestSessions.AdvanceToNextPhase(session, CatalogOrder);

        session.Selection.TopValues.ShouldBe(
            TestValueIds
                .Numbered(3, 8)
                .Concat([
                    new ValueId("wert-1"),
                    new ValueId("wert-2"),
                    new ValueId("wert-11"),
                    new ValueId("wert-12"),
                ])
                .ToList(),
            ignoreOrder: true
        );
    }

    [Fact]
    public void Fewer_than_ten_tallied_values_all_become_top_values()
    {
        var selection = SelectionRound.Restore(
            TestValueIds.Numbered(1, 3).Select(valueId => new SelectedValue(Anna, valueId)),
            []
        );
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.ValueSelection,
            selection: selection
        );

        TestSessions.AdvanceToNextPhase(session, CatalogOrder);

        session.Selection.TopValues.ShouldBe(TestValueIds.Numbered(1, 3), ignoreOrder: true);
    }

    [Fact]
    public void Advancing_without_any_submission_leaves_the_top_values_empty()
    {
        var session = SelectionSessionWith();

        TestSessions.AdvanceToNextPhase(session, CatalogOrder);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        session.Selection.TopValues.ShouldBeEmpty();
    }

    [Fact]
    public void Top_values_restored_from_storage_are_never_recomputed()
    {
        var restoredTopValues = new List<ValueId> { new("wert-9") };
        var selection = SelectionRound.Restore(
            TestValueIds.Numbered(1, 10).Select(valueId => new SelectedValue(Anna, valueId)),
            restoredTopValues
        );
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.ValueSelection,
            selection: selection
        );

        TestSessions.AdvanceToNextPhase(session, CatalogOrder);

        session.PhaseProgress.CurrentPhase.ShouldBe(Phase.SelectionResults);
        session.Selection.TopValues.ShouldBe(restoredTopValues);
    }

    private static Session SelectionSessionWith(params ParticipantId[] participants)
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Join);

        foreach (var participant in participants)
        {
            session.Join(TestParticipants.Named(participant, "Anna"), Randomness.Fixed(0));
        }

        TestSessions.AdvanceToNextPhase(session);
        TestSessions.AdvanceToNextPhase(session);

        return session;
    }
}
