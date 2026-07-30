using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class ParticipantWorkshopStateMapperTests
{
    [Fact]
    public void Envelope_carries_revision_phase_and_participant_count()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join), revision: 7);

        state.Revision.ShouldBe(7);
        state.Phase.ShouldBe(Phase.Join);
        state.ParticipantCount.ShouldBe(3);
    }

    [Fact]
    public void Blocks_of_phases_not_yet_reached_are_absent()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join));

        state.Quiz.ShouldBeNull();
        state.Selection.ShouldBeNull();
        state.OwnGroup.ShouldBeNull();
        state.Presentation.ShouldBeNull();
        state.Voting.ShouldBeNull();
        state.Conclusion.ShouldBeNull();
    }

    [Fact]
    public void Quiz_block_reports_the_posed_question_and_its_sub_state()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(2, true, false)
        );

        var quiz = Map(session).Quiz.ShouldNotBeNull();

        quiz.QuestionNumber.ShouldBe(2);
        quiz.SubState.ShouldBe(QuizSubState.Revealed);
    }

    [Theory]
    [InlineData(false, false, QuizSubState.Answering)]
    [InlineData(true, false, QuizSubState.Revealed)]
    [InlineData(true, true, QuizSubState.LearningTextShown)]
    public void Quiz_sub_state_follows_the_forward_walk(
        bool isRevealed,
        bool isLearningTextShown,
        QuizSubState expected
    )
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(1, isRevealed, isLearningTextShown)
        );

        Map(session).Quiz.ShouldNotBeNull().SubState.ShouldBe(expected);
    }

    [Fact]
    public void Selection_block_reports_the_callers_own_submission_and_the_top_values()
    {
        var session = SessionFixtures.InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore([SessionFixtures.Anna], [new ValueId("honesty")])
        );

        var selection = Map(session, caller: SessionFixtures.Anna).Selection.ShouldNotBeNull();

        selection.IsOwnSubmitted.ShouldBeTrue();
        selection.TopValueIds.ShouldBe(["honesty"]);
        Map(session, caller: SessionFixtures.Ben)
            .Selection.ShouldNotBeNull()
            .IsOwnSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void Own_group_block_describes_only_the_callers_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Ben).OwnGroup.ShouldNotBeNull();

        ownGroup.Name.ShouldBe("fox");
        ownGroup.MemberCount.ShouldBe(2);
        ownGroup.AssignedValueIds.ShouldBe(["honesty"]);
        ownGroup.IsCallerScribe.ShouldBeFalse();
        ownGroup.WorkStatus.ShouldBe(GroupWorkStatus.Editing);
    }

    [Fact]
    public void Own_group_block_marks_the_caller_as_scribe_and_reports_submitted_work()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var ownGroup = Map(session, caller: SessionFixtures.Chris).OwnGroup.ShouldNotBeNull();

        ownGroup.Name.ShouldBe("owl");
        ownGroup.IsCallerScribe.ShouldBeTrue();
        ownGroup.WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
    }

    [Fact]
    public void A_caller_who_is_in_no_group_gets_no_own_group_block()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        Map(session, caller: new ParticipantId(Guid.NewGuid())).OwnGroup.ShouldBeNull();
    }

    [Fact]
    public void Presentation_block_reports_the_presenting_group_and_value()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("fox", new ValueId("honesty"))
        );

        var presentation = Map(session).Presentation.ShouldNotBeNull();

        presentation.PresentingGroupName.ShouldBe("fox");
        presentation.PresentedValueId.ShouldBe("honesty");
    }

    [Fact]
    public void Voting_block_reports_the_round_and_whether_it_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(true, 2, [])
        );

        var voting = Map(session).Voting.ShouldNotBeNull();

        voting.RoundNumber.ShouldBe(2);
        voting.IsRoundOpen.ShouldBeTrue();
    }

    [Fact]
    public void Conclusion_block_appears_once_winners_stand()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: VotingRounds.Restore(false, 2, [new ValueId("honesty"), new ValueId("courage")])
        );

        Map(session).Conclusion.ShouldNotBeNull().WinningValueIds.ShouldBe(["honesty", "courage"]);
    }

    private static ParticipantWorkshopState Map(
        Session session,
        ParticipantId? caller = null,
        long revision = 1
    )
    {
        return ParticipantWorkshopStateMapper.MapFor(
            session,
            caller ?? SessionFixtures.Anna,
            revision
        );
    }
}
