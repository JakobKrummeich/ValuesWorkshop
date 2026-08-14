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
    public void Join_state_lists_everyone_who_already_joined_by_name()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join)).ShouldBeOfType<PresenterJoinState>();

        state.ParticipantDisplayNames.ShouldBe(["Anna Schmidt", "Ben", "#c3c3c3"]);
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
            quiz: QuizProgress.Restore(1, false, false, [])
        );

        var quiz = Map(session).ShouldBeOfType<PresenterQuizState>().Quiz;

        quiz.QuestionIndex.ShouldBe(1);
        quiz.QuestionCount.ShouldBe(5);
        quiz.SubState.ShouldBe(QuizSubState.Answering);
    }

    [Fact]
    public void Quiz_state_reports_tallies_but_hides_the_correct_answer_until_revealed()
    {
        var unrevealed = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(
                0,
                false,
                false,
                [new CastAnswer(0, SessionFixtures.Anna, 1)]
            )
        );
        var revealed = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [new CastAnswer(0, SessionFixtures.Anna, 1)])
        );

        var quiz = Map(unrevealed).ShouldBeOfType<PresenterQuizState>().Quiz;

        quiz.Question.ShouldBe(new LocalizedTextView("Frage 0", "Question 0"));
        quiz.AnswerTallies.ShouldBe([0, 1, 0]);
        quiz.CorrectAnswerIndex.ShouldBeNull();
        Map(revealed)
            .ShouldBeOfType<PresenterQuizState>()
            .Quiz.CorrectAnswerIndex.ShouldBe(TestQuizCatalog.CorrectAnswerIndex);
    }

    [Fact]
    public void Quiz_state_hides_the_learning_text_until_it_is_shown()
    {
        var revealed = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );
        var shown = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, true, [])
        );

        Map(revealed).ShouldBeOfType<PresenterQuizState>().Quiz.LearningText.ShouldBeNull();
        Map(shown)
            .ShouldBeOfType<PresenterQuizState>()
            .Quiz.LearningText.ShouldBe(new LocalizedTextView("Lerntext 0", "Learning text 0"));
    }

    [Fact]
    public void Value_selection_state_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [new SelectedValue(SessionFixtures.Chris, new ValueId("wert-4"))],
                []
            )
        );

        var selection = Map(session).ShouldBeOfType<PresenterValueSelectionState>().Selection;

        selection.SubmittedCount.ShouldBe(1);
        selection.Values.Count.ShouldBe(50);
        selection
            .Values[0]
            .ShouldBe(new WorkshopValueView("wert-1", new LocalizedTextView("Wert 1", "Value 1")));
        selection.SelectionTallies.ShouldBeNull();
        selection.TopValueIds.ShouldBeNull();
    }

    [Fact]
    public void Selection_results_state_carries_tallies_and_top_values_in_result_order()
    {
        var selection = Map(SessionFixtures.InSelectionResults())
            .ShouldBeOfType<PresenterSelectionResultsState>()
            .Selection;

        var tallies = selection.SelectionTallies.ShouldNotBeNull();
        tallies.Count.ShouldBe(4);
        tallies["wert-9"].ShouldBe(2);
        selection.TopValueIds.ShouldBe(["wert-5", "wert-2", "wert-9", "wert-1"]);
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
        return new PresenterWorkshopStateMapper(
            new TestQuizCatalog(5),
            new TestValuesCatalog(50)
        ).Map(session, revision);
    }
}
