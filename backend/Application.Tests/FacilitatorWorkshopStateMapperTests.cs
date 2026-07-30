using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorWorkshopStateMapperTests
{
    [Fact]
    public void Envelope_and_roster_carry_revision_phase_and_every_participant()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join), revision: 12);

        state.Revision.ShouldBe(12);
        state.Phase.ShouldBe(Phase.Join);
        state.Roster.ParticipantIds.ShouldBe([
            SessionFixtures.Anna.Value,
            SessionFixtures.Ben.Value,
            SessionFixtures.Chris.Value,
        ]);
        state.Roster.ParticipantCount.ShouldBe(3);
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
            quiz: QuizProgress.Restore(3, true, true)
        );

        var quiz = Map(session).Quiz.ShouldNotBeNull();

        quiz.QuestionNumber.ShouldBe(3);
        quiz.SubState.ShouldBe(QuizSubState.LearningTextShown);
    }

    [Fact]
    public void Selection_block_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [SessionFixtures.Anna, SessionFixtures.Ben],
                [new ValueId("honesty")]
            )
        );

        var selection = Map(session).Selection.ShouldNotBeNull();

        selection.SubmittedCount.ShouldBe(2);
        selection.TopValueIds.ShouldBe(["honesty"]);
    }

    [Fact]
    public void Groups_block_names_members_and_scribes_of_every_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session).Groups.ShouldNotBeNull();

        groups.Count.ShouldBe(2);
        groups[0].Name.ShouldBe("fox");
        groups[0]
            .MemberParticipantIds.ShouldBe([SessionFixtures.Anna.Value, SessionFixtures.Ben.Value]);
        groups[0].AssignedValueIds.ShouldBe(["honesty"]);
        groups[0].ScribeParticipantId.ShouldBe(SessionFixtures.Anna.Value);
        groups[0].WorkStatus.ShouldBe(GroupWorkStatus.Editing);
        groups[1].WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
    }

    [Fact]
    public void Presentation_block_reports_the_presenting_group_and_value()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("owl", new ValueId("courage"))
        );

        var presentation = Map(session).Presentation.ShouldNotBeNull();

        presentation.PresentingGroupName.ShouldBe("owl");
        presentation.PresentedValueId.ShouldBe("courage");
    }

    [Fact]
    public void Voting_block_reports_the_round_and_whether_it_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(true, 1, [])
        );

        var voting = Map(session).Voting.ShouldNotBeNull();

        voting.RoundNumber.ShouldBe(1);
        voting.IsRoundOpen.ShouldBeTrue();
    }

    [Fact]
    public void Conclusion_block_appears_once_winners_stand()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: VotingRounds.Restore(false, 1, [new ValueId("courage")])
        );

        Map(session).Conclusion.ShouldNotBeNull().WinningValueIds.ShouldBe(["courage"]);
    }

    private static FacilitatorWorkshopState Map(Session session, long revision = 1)
    {
        return FacilitatorWorkshopStateMapper.Map(session, revision);
    }
}
