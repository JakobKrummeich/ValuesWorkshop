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
    public void A_blocked_exit_guard_enables_nothing()
    {
        var session = SessionFixtures.InPhase(
            Phase.GroupWork,
            formation: SessionFixtures.TwoGroups()
        );

        Map(session).EnabledIntents.ShouldBeEmpty();
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
                        "fox",
                        [SessionFixtures.Anna],
                        [new ValueId("honesty")],
                        SessionFixtures.Anna,
                        true
                    ),
                ]
            )
        );

        Map(session).EnabledIntents.ShouldBe([FacilitatorIntent.AdvancePhase]);
    }

    [Fact]
    public void The_final_phase_enables_nothing_because_no_phase_follows()
    {
        var session = SessionFixtures.InPhase(Phase.FinalPresentation);

        Map(session).EnabledIntents.ShouldBeEmpty();
    }

    private static FacilitatorWorkshopState Map(Session session)
    {
        var catalog = new TestQuizCatalog(QuestionCount);

        return new FacilitatorWorkshopStateMapper(
            catalog,
            TestExitGuards.RegisteredFor(catalog)
        ).Map(session, 1);
    }
}
