using ValuesWorkshop.Application;
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
    public void Value_selection_state_reports_progress_and_carries_the_catalog()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValueSelection,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(SessionFixtures.Anna, new ValueId("wert-1")),
                    new SelectedValue(SessionFixtures.Ben, new ValueId("wert-1")),
                ],
                []
            )
        );

        var selection = Map(session).ShouldBeOfType<FacilitatorValueSelectionState>().Selection;

        selection.SubmittedCount.ShouldBe(2);
        selection.Values.Count.ShouldBe(50);
        selection
            .Values[0]
            .ShouldBe(new WorkshopValueView("wert-1", new LocalizedTextView("Wert 1", "Value 1")));
        selection.SelectionTallies.ShouldBeNull();
        selection.TopValueIds.ShouldBeNull();
    }

    [Fact]
    public void Selection_results_state_reports_how_many_participants_submitted()
    {
        var session = SessionFixtures.InPhase(
            Phase.SelectionResults,
            selection: SelectionRound.Restore(
                [
                    new SelectedValue(SessionFixtures.Anna, new ValueId("wert-1")),
                    new SelectedValue(SessionFixtures.Ben, new ValueId("wert-2")),
                ],
                [new ValueId("wert-1")]
            )
        );

        var selection = Map(session).ShouldBeOfType<FacilitatorSelectionResultsState>().Selection;

        selection.SubmittedCount.ShouldBe(2);
        selection.Values.Count.ShouldBe(50);
    }

    [Fact]
    public void Selection_results_state_carries_tallies_and_top_values_in_result_order()
    {
        var selection = Map(SessionFixtures.InSelectionResults())
            .ShouldBeOfType<FacilitatorSelectionResultsState>()
            .Selection;

        var tallies = selection.SelectionTallies.ShouldNotBeNull();
        tallies.Count.ShouldBe(4);
        tallies["wert-5"].ShouldBe(3);
        selection.TopValueIds.ShouldBe(["wert-5", "wert-2", "wert-9", "wert-1"]);
    }

    [Fact]
    public void Groups_carry_animal_names_members_in_formation_order_and_value_texts()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session)
            .ShouldBeOfType<FacilitatorGroupFormationState>()
            .Formation.ShouldBeOfType<FacilitatorFormedView>()
            .Groups;

        groups.Count.ShouldBe(2);
        groups[0]
            .Name.ShouldBe(
                new GroupNameView("tier-1", new LocalizedTextView("Tier 1", "Animal 1"))
            );
        groups[0]
            .Members.ShouldBe([
                new RosterParticipantView(SessionFixtures.Ben.Value, "Ben"),
                new RosterParticipantView(SessionFixtures.Anna.Value, "Anna Schmidt"),
            ]);
        groups[0]
            .AssignedValues.ShouldBe([
                new WorkshopValueView("wert-1", new LocalizedTextView("Wert 1", "Value 1")),
            ]);
        groups[1].Name.AnimalId.ShouldBe("tier-2");
        groups[1]
            .Members.ShouldBe([new RosterParticipantView(SessionFixtures.Chris.Value, "#c3c3c3")]);
    }

    [Fact]
    public void A_group_without_members_still_carries_its_name_and_values()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: FormationRecord.Restore(
                true,
                [Group.Restore("tier-1", [], [new ValueId("wert-1")], null, false, [])]
            )
        );

        var groups = Map(session)
            .ShouldBeOfType<FacilitatorGroupFormationState>()
            .Formation.ShouldBeOfType<FacilitatorFormedView>()
            .Groups;

        groups.Count.ShouldBe(1);
        groups[0].Members.ShouldBeEmpty();
        groups[0].AssignedValues.Count.ShouldBe(1);
    }

    [Fact]
    public void Groups_carry_no_group_work_fields_before_the_group_work_phase()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupFormation,
            formation: SessionFixtures.TwoGroups()
        );

        var groups = Map(session)
            .ShouldBeOfType<FacilitatorGroupFormationState>()
            .Formation.ShouldBeOfType<FacilitatorFormedView>()
            .Groups;

        groups[0].ScribeParticipantId.ShouldBeNull();
        groups[0].WorkStatus.ShouldBeNull();
        groups[0].ActionCountPerValue.ShouldBeNull();
    }

    [Fact]
    public void Groups_carry_scribe_work_status_and_action_counts_during_group_work()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac01")),
                    new ValueId("wert-1"),
                    GroupActionText.Of("Talk")
                ),
                new GroupAction(
                    new ActionId(Guid.Parse("00000000-0000-0000-0000-00000000ac02")),
                    new ValueId("wert-1"),
                    GroupActionText.Of("Listen")
                )
            )
        );

        var groups = Map(session).ShouldBeOfType<FacilitatorGroupWorkState>().Groups;

        groups[0].ScribeParticipantId.ShouldBe(SessionFixtures.Anna.Value);
        groups[0].WorkStatus.ShouldBe(GroupWorkStatus.Editing);
        groups[0]
            .ActionCountPerValue.ShouldNotBeNull()
            .ShouldBe(new Dictionary<string, int> { ["wert-1"] = 2 });
        groups[1].ScribeParticipantId.ShouldBe(SessionFixtures.Chris.Value);
        groups[1].WorkStatus.ShouldBe(GroupWorkStatus.Submitted);
        groups[1]
            .ActionCountPerValue.ShouldNotBeNull()
            .ShouldBe(new Dictionary<string, int> { ["wert-2"] = 0 });
    }

    [Fact]
    public void Group_formation_state_keeps_the_selection_progress_without_tallies()
    {
        var state = Map(SessionFixtures.InPhase(Phase.GroupFormation))
            .ShouldBeOfType<FacilitatorGroupFormationState>();

        state.Selection.Values.Count.ShouldBe(50);
        state.Selection.SelectionTallies.ShouldBeNull();
        state.Selection.TopValueIds.ShouldBeNull();
    }

    [Fact]
    public void No_group_travels_while_the_formation_is_still_running()
    {
        var state = Map(SessionFixtures.InPhase(Phase.GroupFormation));

        state
            .ShouldBeOfType<FacilitatorGroupFormationState>()
            .Formation.ShouldBeOfType<FacilitatorFormingView>()
            .Progress.ShouldBe(0.25);
    }

    [Fact]
    public void Value_presentation_state_reports_the_presenting_position_with_its_actions()
    {
        var actionId = Guid.NewGuid();
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(
                new GroupAction(
                    new ActionId(actionId),
                    new ValueId("wert-1"),
                    GroupActionText.Of("We start meetings on time")
                )
            ),
            presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
        );

        var presentation = Map(session)
            .ShouldBeOfType<FacilitatorValuePresentationState>()
            .Presentation;

        presentation.PresentingGroupName.ShouldBe("tier-1");
        presentation.PresentedValueId.ShouldBe("wert-1");
        var presentedAction = presentation.PresentedActions.ShouldHaveSingleItem();
        presentedAction.ActionId.ShouldBe(actionId);
        presentedAction.Text.ShouldBe("We start meetings on time");
    }

    [Fact]
    public void A_group_intro_presents_the_group_without_a_value_or_actions()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(),
            presentation: PresentationWalk.Restore("tier-1", null, 0)
        );

        var presentation = Map(session)
            .ShouldBeOfType<FacilitatorValuePresentationState>()
            .Presentation;

        presentation.PresentingGroupName.ShouldBe("tier-1");
        presentation.PresentedValueId.ShouldBeNull();
        presentation.PresentedActions.ShouldBeEmpty();
    }

    [Fact]
    public void Final_voting_state_reports_the_round_and_whether_it_is_open()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 10))
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
            voting: TestVoting.AfterLocking([new ValueId("courage")])
        );

        Map(session)
            .ShouldBeOfType<FacilitatorFinalPresentationState>()
            .Conclusion.WinningValueIds.ShouldBe(["courage"]);
    }

    private static FacilitatorWorkshopState Map(Session session, long revision = 1)
    {
        return TestMappers.Facilitator(formationProgress: 0.25).Map(session, revision);
    }
}
