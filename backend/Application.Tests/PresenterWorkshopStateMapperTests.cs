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

    [Fact]
    public void Blocks_of_phases_not_yet_reached_are_absent()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join));

        state.Quiz.ShouldBeNull();
        state.Selection.ShouldBeNull();
        state.Groups.ShouldBeNull();
        state.Presentation.ShouldBeNull();
        state.Voting.ShouldBeNull();
        state.Conclusion.ShouldBeNull();
    }

    [Fact]
    public void Quiz_block_reports_the_posed_question_and_its_sub_state()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(1, false, false)
        );

        var quiz = Map(session).Quiz.ShouldNotBeNull();

        quiz.QuestionNumber.ShouldBe(1);
        quiz.SubState.ShouldBe(QuizSubState.Answering);
    }

    [Fact]
    public void Selection_block_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore([SessionFixtures.Chris], [])
        );

        var selection = Map(session).Selection.ShouldNotBeNull();

        selection.SubmittedCount.ShouldBe(1);
        selection.TopValueIds.ShouldBeEmpty();
    }

    [Fact]
    public void Groups_block_counts_members_instead_of_identifying_them()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session).Groups.ShouldNotBeNull();

        groups.Count.ShouldBe(2);
        groups[0].Name.ShouldBe("fox");
        groups[0].MemberCount.ShouldBe(2);
        groups[0].AssignedValueIds.ShouldBe(["honesty"]);
        groups[0].WorkStatus.ShouldBe(GroupWorkStatus.Editing);
        groups[1].WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
    }

    [Fact]
    public void Presentation_block_reports_the_presented_value_without_naming_the_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("fox", new ValueId("honesty"))
        );

        Map(session).Presentation.ShouldNotBeNull().PresentedValueId.ShouldBe("honesty");
    }

    [Fact]
    public void Voting_block_reveals_only_that_a_round_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(true, 2, [])
        );

        Map(session).Voting.ShouldNotBeNull().IsRoundOpen.ShouldBeTrue();
    }

    [Fact]
    public void Conclusion_block_appears_once_winners_stand()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: VotingRounds.Restore(false, 2, [new ValueId("honesty")])
        );

        Map(session).Conclusion.ShouldNotBeNull().WinningValueIds.ShouldBe(["honesty"]);
    }

    private static PresenterWorkshopState Map(Session session, long revision = 1)
    {
        return PresenterWorkshopStateMapper.Map(session, revision);
    }
}
