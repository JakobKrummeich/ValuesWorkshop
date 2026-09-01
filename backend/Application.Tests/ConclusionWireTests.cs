using System.Text.Json;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class ConclusionWireTests
{
    private static readonly JsonSerializerOptions WireOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public void A_participant_sees_nothing_but_the_pending_conclusion_while_winners_are_revealed()
    {
        var conclusion = ParticipantConclusion(RevealingSession(revealedCount: 2));

        conclusion.IsConcluded.ShouldBeFalse();
        conclusion.Record.ShouldBeNull();
    }

    [Fact]
    public void A_revealing_participant_state_carries_no_record_field_on_the_wire()
    {
        var state = TestMappers
            .Participant()
            .MapFor(RevealingSession(revealedCount: 2), SessionFixtures.Anna, 1);

        JsonSerializer.Serialize(state, WireOptions).ShouldNotContain("record");
    }

    [Fact]
    public void A_concluded_participant_state_carries_the_ranked_winners_with_their_actions()
    {
        var record = ConcludedRecord();

        record
            .Winners.Select(winner => (winner.ValueId, winner.Place, winner.VoteCount))
            .ShouldBe([
                ("wert-2", 1, 6),
                ("wert-4", 2, 5),
                ("wert-5", 3, 4),
                ("wert-3", 4, 3),
                ("wert-1", 5, 2),
            ]);
        record.Winners[0].Text.De.ShouldBe("Wert 2");
        record.Winners[0].Text.En.ShouldBe("Value 2");
        record.Winners[0].Actions.ShouldBe(["We listen before we answer"]);
        record.Winners[4].Actions.ShouldBe(["We name mistakes early", "We ask for help"]);
    }

    [Fact]
    public void A_concluded_participant_state_carries_every_presented_value_in_deal_order()
    {
        var record = ConcludedRecord();

        record
            .Values.Select(value => value.ValueId)
            .ShouldBe(["wert-1", "wert-2", "wert-3", "wert-4", "wert-5"]);
        record.Values[0].Actions.ShouldBe(["We name mistakes early", "We ask for help"]);
        record.Values[2].Actions.ShouldBeEmpty();
    }

    [Fact]
    public void A_concluded_participant_state_carries_every_rounds_anonymous_tallies()
    {
        var round = ConcludedRecord().Rounds.ShouldHaveSingleItem();

        round.RoundNumber.ShouldBe(1);
        round.Allotment.ShouldBe(5);
        round
            .Tallies.Select(tally => (tally.ValueId, tally.Count))
            .ShouldBe([("wert-1", 2), ("wert-2", 6), ("wert-3", 3), ("wert-4", 5), ("wert-5", 4)]);
    }

    [Fact]
    public void The_facilitator_sees_only_the_reveal_progress_while_winners_are_revealed()
    {
        var conclusion = FacilitatorConclusion(RevealingSession(revealedCount: 2));

        conclusion.RevealedCount.ShouldBe(2);
        conclusion.WinnerCount.ShouldBe(VotingRounds.RequiredWinningValueCount);
        conclusion.IsConcluded.ShouldBeFalse();
    }

    [Fact]
    public void The_facilitator_sees_the_conclusion_once_every_winner_is_revealed()
    {
        var conclusion = FacilitatorConclusion(
            RevealingSession(VotingRounds.RequiredWinningValueCount)
        );

        conclusion.RevealedCount.ShouldBe(VotingRounds.RequiredWinningValueCount);
        conclusion.IsConcluded.ShouldBeTrue();
    }

    [Fact]
    public void The_presenter_shows_the_revealed_winners_least_voted_first()
    {
        var conclusion = PresenterConclusion(RevealingSession(revealedCount: 2));

        conclusion
            .RevealedWinners.Select(winner => (winner.ValueId, winner.Place, winner.VoteCount))
            .ShouldBe([("wert-1", 5, 2), ("wert-3", 4, 3)]);
        conclusion
            .RevealedWinners[0]
            .Actions.ShouldBe(["We name mistakes early", "We ask for help"]);
        conclusion.IsConcluded.ShouldBeFalse();
    }

    [Fact]
    public void The_presenter_shows_all_five_winners_once_the_workshop_is_concluded()
    {
        var conclusion = PresenterConclusion(
            RevealingSession(VotingRounds.RequiredWinningValueCount)
        );

        conclusion.RevealedWinners.Select(winner => winner.Place).ShouldBe([5, 4, 3, 2, 1]);
        conclusion.IsConcluded.ShouldBeTrue();
    }

    private static WorkshopRecordView ConcludedRecord()
    {
        var conclusion = ParticipantConclusion(
            RevealingSession(VotingRounds.RequiredWinningValueCount)
        );

        conclusion.IsConcluded.ShouldBeTrue();

        return conclusion.Record.ShouldNotBeNull();
    }

    private static ParticipantConclusionView ParticipantConclusion(Session session)
    {
        return TestMappers
            .Participant()
            .MapFor(session, SessionFixtures.Anna, 1)
            .ShouldBeOfType<ParticipantFinalPresentationState>()
            .Conclusion;
    }

    private static FacilitatorConclusionView FacilitatorConclusion(Session session)
    {
        return TestMappers
            .Facilitator()
            .Map(session, 1)
            .ShouldBeOfType<FacilitatorFinalPresentationState>()
            .Conclusion;
    }

    private static PresenterConclusionView PresenterConclusion(Session session)
    {
        return TestMappers
            .Presenter()
            .Map(session, 1)
            .ShouldBeOfType<PresenterFinalPresentationState>()
            .Conclusion;
    }

    private static Session RevealingSession(int revealedCount)
    {
        return SessionFixtures.InPhase(
            Phase.FinalPresentation,
            formation: PresentedGroups(),
            voting: ClosedMainRound(),
            reveal: WinnerReveal.Restore(revealedCount)
        );
    }

    private static FormationRecord PresentedGroups()
    {
        return FormationRecord.Restore(
            true,
            [
                Group.Restore(
                    "tier-1",
                    [SessionFixtures.Anna, SessionFixtures.Ben],
                    [new ValueId("wert-1"), new ValueId("wert-2"), new ValueId("wert-3")],
                    SessionFixtures.Anna,
                    true,
                    [
                        ActionOn("wert-1", "We name mistakes early"),
                        ActionOn("wert-1", "We ask for help"),
                        ActionOn("wert-2", "We listen before we answer"),
                    ]
                ),
                Group.Restore(
                    "tier-2",
                    [SessionFixtures.Chris],
                    [new ValueId("wert-4"), new ValueId("wert-5")],
                    SessionFixtures.Chris,
                    true,
                    [ActionOn("wert-4", "We share what we learn")]
                ),
            ]
        );
    }

    private static GroupAction ActionOn(string valueId, string text)
    {
        return new GroupAction(
            new ActionId(Guid.NewGuid()),
            new ValueId(valueId),
            GroupActionText.Of(text)
        );
    }

    private static VotingRounds ClosedMainRound()
    {
        var eligibleValues = TestValueIds.Numbered(1, 5);
        var tallies = new Dictionary<ValueId, int>
        {
            [eligibleValues[0]] = 2,
            [eligibleValues[1]] = 6,
            [eligibleValues[2]] = 3,
            [eligibleValues[3]] = 5,
            [eligibleValues[4]] = 4,
        };

        return VotingRounds.Restore(
            [new ClosedVotingRound(1, 5, eligibleValues, tallies, 4, eligibleValues, [])],
            null
        );
    }
}
