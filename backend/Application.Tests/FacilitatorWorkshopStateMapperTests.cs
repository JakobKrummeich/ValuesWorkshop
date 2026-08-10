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
        state.Roster.Participants.ShouldBe([
            new RosterParticipantView(SessionFixtures.Anna.Value, "Anna Schmidt"),
            new RosterParticipantView(SessionFixtures.Ben.Value, "Ben"),
            new RosterParticipantView(SessionFixtures.Chris.Value, "#c3c3c3"),
        ]);
        state.Roster.ParticipantCount.ShouldBe(3);
    }

    [Theory]
    [InlineData(Phase.Join, typeof(FacilitatorJoinState))]
    [InlineData(Phase.Quiz, typeof(FacilitatorQuizState))]
    [InlineData(Phase.ValueSelection, typeof(FacilitatorValueSelectionState))]
    [InlineData(Phase.SelectionResults, typeof(FacilitatorSelectionResultsState))]
    [InlineData(Phase.GroupFormation, typeof(FacilitatorGroupFormationState))]
    [InlineData(Phase.GroupWork, typeof(FacilitatorGroupWorkState))]
    [InlineData(Phase.ValuePresentation, typeof(FacilitatorValuePresentationState))]
    [InlineData(Phase.FinalVoting, typeof(FacilitatorFinalVotingState))]
    [InlineData(Phase.FinalPresentation, typeof(FacilitatorFinalPresentationState))]
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
            quiz: QuizProgress.Restore(3, true, true, [])
        );

        var quiz = Map(session).ShouldBeOfType<FacilitatorQuizState>().Quiz;

        quiz.QuestionIndex.ShouldBe(3);
        quiz.QuestionCount.ShouldBe(5);
        quiz.SubState.ShouldBe(QuizSubState.LearningTextShown);
    }

    [Fact]
    public void Quiz_state_reports_tallies_answered_count_and_always_the_correct_answer()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(
                1,
                false,
                false,
                [
                    new CastAnswer(1, SessionFixtures.Anna, 0),
                    new CastAnswer(1, SessionFixtures.Ben, 0),
                    new CastAnswer(0, SessionFixtures.Chris, 2),
                ]
            )
        );

        var quiz = Map(session).ShouldBeOfType<FacilitatorQuizState>().Quiz;

        quiz.Question.ShouldBe(new LocalizedTextView("Frage 1", "Question 1"));
        quiz.AnswerTallies.ShouldBe([2, 0, 0]);
        quiz.AnsweredCount.ShouldBe(2);
        quiz.CorrectAnswerIndex.ShouldBe(TestQuizCatalog.CorrectAnswerIndex);
        quiz.LearningText.ShouldBe(new LocalizedTextView("Lerntext 1", "Learning text 1"));
    }

    [Fact]
    public void Selection_results_state_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [SessionFixtures.Anna, SessionFixtures.Ben],
                [new ValueId("honesty")]
            )
        );

        var selection = Map(session).ShouldBeOfType<FacilitatorSelectionResultsState>().Selection;

        selection.SubmittedCount.ShouldBe(2);
        selection.TopValueIds.ShouldBe(["honesty"]);
    }

    [Fact]
    public void Group_work_state_names_members_and_scribes_of_every_group()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session).ShouldBeOfType<FacilitatorGroupWorkState>().Groups;

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
    public void Groups_are_empty_until_the_formation_has_run()
    {
        var state = Map(SessionFixtures.InPhase(Phase.GroupFormation));

        state.ShouldBeOfType<FacilitatorGroupFormationState>().Groups.ShouldBeEmpty();
    }

    [Fact]
    public void Value_presentation_state_reports_the_presenting_group_and_value()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            presentation: PresentationWalk.Restore("owl", new ValueId("courage"), 1)
        );

        var presentation = Map(session)
            .ShouldBeOfType<FacilitatorValuePresentationState>()
            .Presentation;

        presentation.PresentingGroupName.ShouldBe("owl");
        presentation.PresentedValueId.ShouldBe("courage");
    }

    [Fact]
    public void Final_voting_state_reports_the_round_and_whether_it_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: VotingRounds.Restore(true, 1, [])
        );

        var voting = Map(session).ShouldBeOfType<FacilitatorFinalVotingState>().Voting;

        voting.RoundNumber.ShouldBe(1);
        voting.IsRoundOpen.ShouldBeTrue();
    }

    [Fact]
    public void Final_presentation_state_carries_the_winning_values()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: VotingRounds.Restore(false, 1, [new ValueId("courage")])
        );

        Map(session)
            .ShouldBeOfType<FacilitatorFinalPresentationState>()
            .Conclusion.WinningValueIds.ShouldBe(["courage"]);
    }

    private static FacilitatorWorkshopState Map(Session session, long revision = 1)
    {
        return new FacilitatorWorkshopStateMapper(new TestQuizCatalog(5)).Map(session, revision);
    }
}
