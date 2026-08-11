namespace ValuesWorkshop.Domain.Tests;

public class SessionSubmitValueSelectionTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());

    private static readonly IReadOnlySet<ValueId> ValidValueIds = TestValueIds
        .Numbered(1, 12)
        .ToHashSet();

    [Fact]
    public void A_participant_submits_ten_distinct_values()
    {
        var session = SelectionSessionWith(Anna);

        session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds);

        session.Selection.SubmittedBy.ShouldBe([Anna]);
        session.Selection.SelectedValues.ShouldBe(
            TestValueIds
                .Numbered(1, 10)
                .Select(valueId => new SelectedValue(Anna, valueId))
                .ToList()
        );
    }

    [Fact]
    public void The_tallies_count_every_submitted_selection()
    {
        var session = SelectionSessionWith(Anna, Ben);

        session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds);
        session.SubmitValueSelection(Ben, TestValueIds.Numbered(3, 10), ValidValueIds);

        session.Selection.SubmittedBy.ShouldBe([Anna, Ben], ignoreOrder: true);
        session.Selection.SelectionTallies[new ValueId("wert-1")].ShouldBe(1);
        session.Selection.SelectionTallies[new ValueId("wert-3")].ShouldBe(2);
        session.Selection.SelectionTallies[new ValueId("wert-12")].ShouldBe(1);
        session.Selection.SelectionTallies.ContainsKey(new ValueId("wert-13")).ShouldBeFalse();
    }

    [Theory]
    [InlineData(9)]
    [InlineData(11)]
    public void A_selection_without_exactly_ten_values_is_refused(int valueCount)
    {
        var session = SelectionSessionWith(Anna);

        Should.Throw<MalformedPayloadException>(() =>
            session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, valueCount), ValidValueIds)
        );

        session.Selection.SubmittedBy.ShouldBeEmpty();
        session.Selection.SelectedValues.ShouldBeEmpty();
    }

    [Fact]
    public void A_selection_with_a_duplicate_value_is_refused()
    {
        var session = SelectionSessionWith(Anna);
        var valueIds = TestValueIds.Numbered(1, 9).Append(new ValueId("wert-1")).ToList();

        Should.Throw<MalformedPayloadException>(() =>
            session.SubmitValueSelection(Anna, valueIds, ValidValueIds)
        );

        session.Selection.SelectedValues.ShouldBeEmpty();
    }

    [Fact]
    public void A_selection_with_an_unknown_value_id_is_refused()
    {
        var session = SelectionSessionWith(Anna);
        var valueIds = TestValueIds.Numbered(1, 9).Append(new ValueId("wert-99")).ToList();

        Should.Throw<MalformedPayloadException>(() =>
            session.SubmitValueSelection(Anna, valueIds, ValidValueIds)
        );

        session.Selection.SelectedValues.ShouldBeEmpty();
    }

    [Fact]
    public void A_second_submission_by_the_same_participant_is_refused()
    {
        var session = SelectionSessionWith(Anna);
        session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds);

        Should.Throw<InvariantViolationException>(() =>
            session.SubmitValueSelection(Anna, TestValueIds.Numbered(3, 10), ValidValueIds)
        );

        session.Selection.SelectedValues.ShouldBe(
            TestValueIds
                .Numbered(1, 10)
                .Select(valueId => new SelectedValue(Anna, valueId))
                .ToList()
        );
    }

    [Fact]
    public void A_caller_off_the_roster_cannot_submit()
    {
        var session = SelectionSessionWith(Anna);

        Should.Throw<NotAuthorizedException>(() =>
            session.SubmitValueSelection(Ben, TestValueIds.Numbered(1, 10), ValidValueIds)
        );

        session.Selection.SelectedValues.ShouldBeEmpty();
    }

    [Fact]
    public void Submissions_exist_only_during_the_value_selection_phase()
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Join);
        session.Join(TestParticipants.Named(Anna, "Anna"), Randomness.Fixed(0));
        TestSessions.AdvanceToNextPhase(session);

        Should.Throw<WrongPhaseException>(() =>
            session.SubmitValueSelection(Anna, TestValueIds.Numbered(1, 10), ValidValueIds)
        );

        session.Selection.SelectedValues.ShouldBeEmpty();
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
