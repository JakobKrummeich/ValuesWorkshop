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
    public void Join_state_carries_the_callers_own_name_and_nobody_elses()
    {
        var state = Map(SessionFixtures.InPhase(Phase.Join), caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantJoinState>();

        state.OwnDisplayName.ShouldBe("Anna Schmidt");
    }

    [Fact]
    public void A_caller_the_roster_does_not_know_yet_gets_the_fallback_label()
    {
        var caller = new ParticipantId(Guid.Parse("abcdef12-0000-4000-8000-000000000009"));

        var state = Map(SessionFixtures.InPhase(Phase.Join), caller)
            .ShouldBeOfType<ParticipantJoinState>();

        state.OwnDisplayName.ShouldBe("#abcdef");
    }

    [Theory]
    [InlineData(Phase.Join, typeof(ParticipantJoinState))]
    [InlineData(Phase.Quiz, typeof(ParticipantQuizState))]
    [InlineData(Phase.ValueSelection, typeof(ParticipantValueSelectionState))]
    [InlineData(Phase.SelectionResults, typeof(ParticipantSelectionResultsState))]
    [InlineData(Phase.GroupFormation, typeof(ParticipantGroupFormationState))]
    [InlineData(Phase.GroupWork, typeof(ParticipantGroupWorkState))]
    [InlineData(Phase.ValuePresentation, typeof(ParticipantValuePresentationState))]
    [InlineData(Phase.FinalVoting, typeof(ParticipantFinalVotingState))]
    [InlineData(Phase.FinalPresentation, typeof(ParticipantFinalPresentationState))]
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
            quiz: QuizProgress.Restore(2, true, false, [])
        );

        var quiz = Map(session).ShouldBeOfType<ParticipantQuizState>().Quiz;

        quiz.QuestionIndex.ShouldBe(2);
        quiz.QuestionCount.ShouldBe(5);
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
            quiz: QuizProgress.Restore(1, isRevealed, isLearningTextShown, [])
        );

        Map(session).ShouldBeOfType<ParticipantQuizState>().Quiz.SubState.ShouldBe(expected);
    }

    [Fact]
    public void Quiz_state_carries_the_bilingual_content_of_the_posed_question()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(2, false, false, [])
        );

        var quiz = Map(session).ShouldBeOfType<ParticipantQuizState>().Quiz;

        quiz.Question.ShouldBe(new LocalizedTextView("Frage 2", "Question 2"));
        quiz.Answers.ShouldBe([
            new LocalizedTextView("Falsch 2", "Wrong 2"),
            new LocalizedTextView("Richtig 2", "Right 2"),
            new LocalizedTextView("Witzig 2", "Funny 2"),
        ]);
    }

    [Fact]
    public void Quiz_state_carries_the_callers_own_answer_and_nobody_elses()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(
                0,
                false,
                false,
                [
                    new CastAnswer(0, SessionFixtures.Anna, 2),
                    new CastAnswer(0, SessionFixtures.Ben, 0),
                ]
            )
        );

        Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantQuizState>()
            .Quiz.OwnAnswerIndex.ShouldBe(2);
        Map(session, caller: SessionFixtures.Chris)
            .ShouldBeOfType<ParticipantQuizState>()
            .Quiz.OwnAnswerIndex.ShouldBeNull();
    }

    [Fact]
    public void Value_selection_state_carries_the_full_catalog_in_config_order()
    {
        var selection = Map(SessionFixtures.InPhase(Phase.ValueSelection))
            .ShouldBeOfType<ParticipantValueSelectionState>()
            .Selection;

        selection.Values.Count.ShouldBe(50);
        selection
            .Values[0]
            .ShouldBe(new WorkshopValueView("wert-1", new LocalizedTextView("Wert 1", "Value 1")));
        selection.Values[49].ValueId.ShouldBe("wert-50");
    }

    [Fact]
    public void Value_selection_state_reports_the_callers_own_selection_and_nobody_elses()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(SessionFixtures.Anna, new ValueId("wert-3")),
                    new SelectedValue(SessionFixtures.Anna, new ValueId("wert-1")),
                    new SelectedValue(SessionFixtures.Ben, new ValueId("wert-2")),
                ],
                []
            )
        );

        var annaSelection = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantValueSelectionState>()
            .Selection;
        annaSelection.OwnSelectedValueIds.ShouldBe(["wert-3", "wert-1"]);
        annaSelection.IsSubmitted.ShouldBeTrue();

        var chrisSelection = Map(session, caller: SessionFixtures.Chris)
            .ShouldBeOfType<ParticipantValueSelectionState>()
            .Selection;
        chrisSelection.OwnSelectedValueIds.ShouldBeEmpty();
        chrisSelection.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void Value_selection_state_carries_no_tallies_and_no_top_values()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [new SelectedValue(SessionFixtures.Anna, new ValueId("wert-1"))],
                []
            )
        );

        var selection = Map(session).ShouldBeOfType<ParticipantValueSelectionState>().Selection;

        selection.SelectionTallies.ShouldBeNull();
        selection.TopValueIds.ShouldBeNull();
    }

    [Fact]
    public void Selection_results_state_reports_the_callers_own_submission()
    {
        var session = SessionFixtures.InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [new SelectedValue(SessionFixtures.Anna, new ValueId("wert-7"))],
                [new ValueId("wert-7")]
            )
        );

        var selection = Map(session, caller: SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantSelectionResultsState>()
            .Selection;

        selection.IsSubmitted.ShouldBeTrue();
        selection.OwnSelectedValueIds.ShouldBe(["wert-7"]);
        Map(session, caller: SessionFixtures.Ben)
            .ShouldBeOfType<ParticipantSelectionResultsState>()
            .Selection.IsSubmitted.ShouldBeFalse();
    }

    [Fact]
    public void Selection_results_state_tallies_every_submitted_value()
    {
        var selection = Map(SessionFixtures.InSelectionResults())
            .ShouldBeOfType<ParticipantSelectionResultsState>()
            .Selection;

        var tallies = selection.SelectionTallies.ShouldNotBeNull();
        tallies.Count.ShouldBe(4);
        tallies["wert-5"].ShouldBe(3);
        tallies["wert-2"].ShouldBe(2);
        tallies["wert-9"].ShouldBe(2);
        tallies["wert-1"].ShouldBe(1);
    }

    [Fact]
    public void Selection_results_state_orders_top_values_by_count_then_config_order_whatever_the_stored_order()
    {
        var selection = Map(SessionFixtures.InSelectionResults())
            .ShouldBeOfType<ParticipantSelectionResultsState>()
            .Selection;

        selection.TopValueIds.ShouldBe(["wert-5", "wert-2", "wert-9", "wert-1"]);
    }

    [Fact]
    public void Selection_results_state_without_submissions_carries_empty_tallies_and_top_values()
    {
        var selection = Map(SessionFixtures.InPhase(Phase.SelectionResults))
            .ShouldBeOfType<ParticipantSelectionResultsState>()
            .Selection;

        selection.SelectionTallies.ShouldNotBeNull().ShouldBeEmpty();
        selection.TopValueIds.ShouldNotBeNull().ShouldBeEmpty();
    }

    [Fact]
    public void No_group_travels_while_the_formation_is_still_running()
    {
        Map(SessionFixtures.InPhase(Phase.GroupFormation))
            .ShouldBeOfType<ParticipantGroupFormationState>()
            .Formation.ShouldBeOfType<ParticipantFormingView>()
            .Progress.ShouldBe(0.25);
    }

    [Fact]
    public void Value_presentation_state_reports_the_presenting_group_and_value()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(Guid.NewGuid()),
                    new ValueId("wert-1"),
                    GroupActionText.Of("We start meetings on time")
                )
            ),
            presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
        );

        var presentation = Map(session)
            .ShouldBeOfType<ParticipantValuePresentationState>()
            .Presentation;

        presentation.PresentingGroupName.ShouldBe("tier-1");
        presentation.PresentedValueId.ShouldBe("wert-1");
        presentation
            .PresentedActions.ShouldHaveSingleItem()
            .Text.ShouldBe("We start meetings on time");
    }

    [Fact]
    public void Final_voting_state_carries_the_open_round_without_any_tallies()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            formation: SessionFixtures.TwoGroups(),
            voting: TestVoting.TiebreakOpen(2, TestValueIds.Numbered(1, 2), allotment: 2)
        );

        var voting = Map(session).ShouldBeOfType<ParticipantFinalVotingState>().Voting;

        voting.RoundNumber.ShouldBe(2);
        voting.Allotment.ShouldBe(2);
        voting.EligibleValues.Select(value => value.ValueId).ShouldBe(["wert-1", "wert-2"]);
        voting.IsRoundOpen.ShouldBeTrue();
        voting.HasVotedThisRound.ShouldBeFalse();
    }

    [Fact]
    public void Final_voting_state_embeds_the_value_texts_and_the_submitted_group_actions()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(Guid.NewGuid()),
                    new ValueId("wert-1"),
                    GroupActionText.Of("We start meetings on time")
                ),
                new GroupAction(
                    new ActionId(Guid.NewGuid()),
                    new ValueId("wert-1"),
                    GroupActionText.Of("We share mistakes openly")
                )
            ),
            voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 2))
        );

        var voting = Map(session).ShouldBeOfType<ParticipantFinalVotingState>().Voting;

        voting.EligibleValues.Count.ShouldBe(2);
        voting.EligibleValues[0].ValueId.ShouldBe("wert-1");
        voting.EligibleValues[0].Text.ShouldBe(new LocalizedTextView("Wert 1", "Value 1"));
        voting
            .EligibleValues[0]
            .Actions.ShouldBe(["We start meetings on time", "We share mistakes openly"]);
        voting.EligibleValues[1].ValueId.ShouldBe("wert-2");
        voting.EligibleValues[1].Text.ShouldBe(new LocalizedTextView("Wert 2", "Value 2"));
        voting.EligibleValues[1].Actions.ShouldBeEmpty();
    }

    [Fact]
    public void Final_voting_state_tells_the_caller_whether_they_voted_this_round()
    {
        var voting = TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 10));
        voting.RecordBallot(
            SessionFixtures.Anna,
            new Dictionary<ValueId, int> { [new ValueId("wert-1")] = 5 }
        );
        var session = SessionFixtures.InPhase(Phase.FinalVoting, voting: voting);

        Map(session, SessionFixtures.Anna)
            .ShouldBeOfType<ParticipantFinalVotingState>()
            .Voting.HasVotedThisRound.ShouldBeTrue();
        Map(session, SessionFixtures.Ben)
            .ShouldBeOfType<ParticipantFinalVotingState>()
            .Voting.HasVotedThisRound.ShouldBeFalse();
    }

    [Fact]
    public void Final_presentation_state_carries_the_pending_conclusion()
    {
        var session = SessionFixtures.InPhase(Phase.FinalPresentation);

        var conclusion = Map(session)
            .ShouldBeOfType<ParticipantFinalPresentationState>()
            .Conclusion;
        conclusion.IsConcluded.ShouldBeFalse();
        conclusion.Record.ShouldBeNull();
    }

    private static ParticipantWorkshopState Map(
        Session session,
        ParticipantId? caller = null,
        long revision = 1
    )
    {
        return TestMappers
            .Participant(formationProgress: 0.25)
            .MapFor(session, caller ?? SessionFixtures.Anna, revision);
    }
}
