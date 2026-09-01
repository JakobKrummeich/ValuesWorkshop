using ValuesWorkshop.Application;
using ValuesWorkshop.Application.State;
using ValuesWorkshop.Domain;

namespace ValuesWorkshop.Application.Tests;

public class FacilitatorEnabledIntentsTests
{
    private const int QuestionCount = 5;
    private const int LastQuestionIndex = QuestionCount - 1;

    [Fact]
    public void An_unrevealed_quiz_question_enables_exactly_the_reveal()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, false, false, [])
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.RevealAnswer]);
    }

    [Fact]
    public void A_revealed_question_enables_exactly_the_learning_text_because_a_repeat_reveal_would_change_nothing()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(0, true, false, [])
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.ShowLearningText]);
    }

    [Fact]
    public void A_shown_learning_text_enables_exactly_the_next_question_while_questions_remain()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(LastQuestionIndex - 1, true, true, [])
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.PoseNextQuestion]);
    }

    [Fact]
    public void The_last_shown_learning_text_enables_exactly_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(
            Phase.Quiz,
            quiz: QuizProgress.Restore(LastQuestionIndex, true, true, [])
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.AdvancePhase]);
    }

    [Fact]
    public void A_phase_without_an_exit_guard_enables_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(Phase.Join);

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.AdvancePhase]);
    }

    [Fact]
    public void A_blocked_exit_guard_withholds_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.ReassignScribe]);
    }

    [Theory]
    [InlineData(Phase.Join)]
    [InlineData(Phase.Quiz)]
    [InlineData(Phase.ValueSelection)]
    [InlineData(Phase.SelectionResults)]
    [InlineData(Phase.GroupFormation)]
    public void Scribe_reassignment_is_absent_before_the_group_work_phase(Phase phase)
    {
        var session = SessionFixtures.InPhase(phase);

        Map(session).EnabledIntents.ShouldNotContain(FacilitatorIntent.ReassignScribe);
    }

    [Fact]
    public void Scribe_reassignment_is_enabled_during_the_group_work_phase()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        Map(session).EnabledIntents.ShouldContain(FacilitatorIntent.ReassignScribe);
    }

    [Theory]
    [InlineData(Phase.GroupFormation)]
    [InlineData(Phase.ValuePresentation)]
    [InlineData(Phase.FinalVoting)]
    [InlineData(Phase.FinalPresentation)]
    public void Scribe_reassignment_is_withheld_outside_the_group_work_phase(Phase phase)
    {
        var session = SessionFixtures.InPhase(phase, formation: SessionFixtures.TwoGroups());

        Map(session).EnabledIntents.ShouldNotContain(FacilitatorIntent.ReassignScribe);
    }

    [Fact]
    public void A_satisfied_exit_guard_enables_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: FormationRecord.Restore(
                true,
                [
                    Group.Restore(
                        "tier-1",
                        [SessionFixtures.Anna],
                        [new ValueId("wert-1")],
                        SessionFixtures.Anna,
                        true,
                        []
                    ),
                ]
            )
        );

        Map(session)
            .EnabledIntents.ShouldBe([
                FacilitatorIntent.ReassignScribe,
                FacilitatorIntent.AdvancePhase,
            ]);
    }

    [Fact]
    public void A_group_intro_enables_exactly_the_next_value_step()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(),
            presentation: PresentationWalk.Restore("tier-1", null, 0)
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.GoToNextValue]);
    }

    [Fact]
    public void A_presented_value_enables_the_wording_correction_alongside_the_next_step()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(),
            presentation: PresentationWalk.Restore("tier-1", new ValueId("wert-1"), 1)
        );

        Map(session)
            .EnabledIntents.ShouldBe([
                FacilitatorIntent.GoToNextValue,
                FacilitatorIntent.CorrectActionWording,
            ]);
    }

    [Fact]
    public void The_last_presented_value_swaps_the_next_step_for_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(
            Phase.ValuePresentation,
            formation: SessionFixtures.TwoGroups(),
            presentation: PresentationWalk.Restore("tier-2", new ValueId("wert-2"), 2)
        );

        Map(session)
            .EnabledIntents.ShouldBe([
                FacilitatorIntent.CorrectActionWording,
                FacilitatorIntent.AdvancePhase,
            ]);
    }

    [Fact]
    public void An_open_voting_round_enables_exactly_the_close()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: TestVoting.MainRoundOpen(TestValueIds.Numbered(1, 10))
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.CloseVoting]);
    }

    [Fact]
    public void A_closed_round_with_a_tie_enables_exactly_the_tiebreak_start()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: TestVoting.AfterLocking(TestValueIds.Numbered(1, 4))
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.StartTiebreakRound]);
    }

    [Fact]
    public void Standing_winners_enable_exactly_the_phase_advance()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalVoting,
            voting: TestVoting.AfterLocking(TestValueIds.Numbered(1, 5))
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.AdvancePhase]);
    }

    [Fact]
    public void The_final_phase_enables_no_phase_advance_because_no_phase_follows()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            )
        );

        Map(session).EnabledIntents.ShouldNotContain(FacilitatorIntent.AdvancePhase);
    }

    [Fact]
    public void Unrevealed_winners_enable_exactly_the_next_reveal()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            ),
            reveal: WinnerReveal.Restore(VotingRounds.RequiredWinningValueCount - 1)
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.RevealNextValue]);
    }

    [Fact]
    public void The_last_revealed_winner_leaves_nothing_enabled()
    {
        var session = SessionFixtures.InPhase(
            Phase.FinalPresentation,
            voting: TestVoting.AfterLocking(
                TestValueIds.Numbered(1, VotingRounds.RequiredWinningValueCount)
            ),
            reveal: WinnerReveal.Restore(VotingRounds.RequiredWinningValueCount)
        );

        Map(session).EnabledIntents.ShouldBeEmpty();
    }

    private static FacilitatorWorkshopState Map(Session session)
    {
        return TestMappers.Facilitator().Map(session, 1);
    }
}
