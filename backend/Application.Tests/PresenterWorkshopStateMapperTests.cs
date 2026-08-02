using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class PresenterWorkshopStateMapperTests
{
    [Fact]
    public void Envelope_carries_revision_phase_and_participant_count()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join), revision: 4);

        state.Revision.ShouldBe(4);
        state.Phase.ShouldBe(Phase.Join);
        state.ParticipantCount.ShouldBe(3);
    }

    [Theory]
    [InlineData(Phase.Join, typeof(PresenterJoinState))]
    [InlineData(Phase.Quiz, typeof(PresenterQuizState))]
    [InlineData(Phase.ValueSelection, typeof(PresenterValueSelectionState))]
    [InlineData(Phase.SelectionResults, typeof(PresenterSelectionResultsState))]
    [InlineData(Phase.GroupFormation, typeof(PresenterGroupFormationState))]
    [InlineData(Phase.GroupWork, typeof(PresenterGroupWorkState))]
    [InlineData(Phase.ValuePresentation, typeof(PresenterValuePresentationState))]
    [InlineData(Phase.FinalVoting, typeof(PresenterFinalVotingState))]
    [InlineData(Phase.FinalPresentation, typeof(PresenterFinalPresentationState))]
    public void Every_phase_maps_to_the_state_variant_that_carries_only_its_own_blocks(
        Phase phase,
        Type expectedVariant
    )
    {
        var state = Map(SessionFixtures.InPhase(phase));

        state.ShouldBeOfType(expectedVariant);
        state.Phase.ShouldBe(phase);
    }

    [Fact]
    public void Quiz_state_reports_the_posed_question_and_its_sub_state()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(1, false, false)
        );

        var quiz = Map(session).ShouldBeOfType<PresenterQuizState>().Quiz;

        quiz.QuestionIndex.ShouldBe(1);
        quiz.SubState.ShouldBe(QuizSubState.Answering);
    }

    [Fact]
    public void Value_selection_state_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore([SessionFixtures.Chris], [])
        );

        var selection = Map(session).ShouldBeOfType<PresenterValueSelectionState>().Selection;

        selection.SubmittedCount.ShouldBe(1);
        selection.TopValueIds.ShouldBeEmpty();
    }

    [Fact]
    public void Group_work_state_counts_members_instead_of_identifying_them()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session).ShouldBeOfType<PresenterGroupWorkState>().Groups;

        groups.Count.ShouldBe(2);
        groups[0].Name.ShouldBe("fox");
        groups[0].MemberCount.ShouldBe(2);
        groups[0].AssignedValueIds.ShouldBe(["honesty"]);
        groups[0].WorkStatus.ShouldBe(GroupWorkStatus.Editing);
        groups[1].WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
    }

    [Fact]
    public void Groups_are_empty_until_the_formation_has_run()
    {
        var state = Map(SessionFixtures.InPhase(Phase.GroupFormation));

        state.ShouldBeOfType<PresenterGroupFormationState>().Groups.ShouldBeEmpty();
    }

    [Fact]
    public void Value_presentation_state_reports_the_presented_value_without_naming_the_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("fox", new ValueId("honesty"), 1)
        );

        Map(session)
            .ShouldBeOfType<PresenterValuePresentationState>()
            .Presentation.PresentedValueId.ShouldBe("honesty");
    }

    [Fact]
    public void Final_voting_state_reveals_only_that_a_round_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(true, 2, [])
        );

        Map(session).ShouldBeOfType<PresenterFinalVotingState>().Voting.IsRoundOpen.ShouldBeTrue();
    }

    [Fact]
    public void Final_presentation_state_carries_the_winning_values()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: VotingRounds.Restore(false, 2, [new ValueId("honesty")])
        );

        Map(session)
            .ShouldBeOfType<PresenterFinalPresentationState>()
            .Conclusion.WinningValueIds.ShouldBe(["honesty"]);
    }

    private static PresenterWorkshopState Map(Session session, long revision = 1)
    {
        return PresenterWorkshopStateMapper.Map(session, revision);
    }
}
