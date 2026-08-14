namespace ValuesWorkshop.Domain.Tests;

public class SessionQuizWalkTests
{
    private const int QuestionCount = 5;

    private static readonly CallerSubject Stranger = new("not-the-facilitator");

    [Fact]
    public void Entering_the_quiz_phase_poses_the_first_question()
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Join);

        session.AdvancePhase(TestSessions.CallerOf(session), PhaseExitGuards.None, []);

        session.Quiz.CurrentQuestionIndex.ShouldBe(0);
        session.Quiz.IsRevealed.ShouldBeFalse();
        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void The_facilitator_reveals_the_answer_of_the_posed_question()
    {
        var session = QuizSession(QuizProgress.Restore(0, false, false, []));

        session.RevealAnswer(TestSessions.CallerOf(session));

        session.Quiz.IsRevealed.ShouldBeTrue();
        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void Revealing_an_already_revealed_answer_changes_nothing()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, false, []));

        session.RevealAnswer(TestSessions.CallerOf(session));

        session.Quiz.IsRevealed.ShouldBeTrue();
        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void Nothing_can_be_revealed_while_no_question_is_posed()
    {
        var session = QuizSession(QuizProgress.Restore(null, false, false, []));

        Should.Throw<WrongPhaseException>(() =>
            session.RevealAnswer(TestSessions.CallerOf(session))
        );
    }

    [Fact]
    public void Nothing_can_be_revealed_outside_the_quiz_phase()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.ValueSelection,
            QuizProgress.Restore(4, true, true, [])
        );

        Should.Throw<WrongPhaseException>(() =>
            session.RevealAnswer(TestSessions.CallerOf(session))
        );
    }

    [Fact]
    public void Only_the_facilitator_reveals_the_answer()
    {
        var session = QuizSession(QuizProgress.Restore(0, false, false, []));

        Should.Throw<NotAuthorizedException>(() => session.RevealAnswer(Stranger));

        session.Quiz.IsRevealed.ShouldBeFalse();
    }

    [Fact]
    public void The_facilitator_shows_the_learning_text_once_the_answer_is_revealed()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, false, []));

        session.ShowLearningText(TestSessions.CallerOf(session));

        session.Quiz.IsLearningTextShown.ShouldBeTrue();
    }

    [Fact]
    public void The_learning_text_stays_hidden_while_the_answer_is_unrevealed()
    {
        var session = QuizSession(QuizProgress.Restore(0, false, false, []));

        Should.Throw<WrongPhaseException>(() =>
            session.ShowLearningText(TestSessions.CallerOf(session))
        );

        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void Showing_an_already_shown_learning_text_changes_nothing()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, true, []));

        session.ShowLearningText(TestSessions.CallerOf(session));

        session.Quiz.IsLearningTextShown.ShouldBeTrue();
    }

    [Fact]
    public void Only_the_facilitator_shows_the_learning_text()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, false, []));

        Should.Throw<NotAuthorizedException>(() => session.ShowLearningText(Stranger));

        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void The_facilitator_poses_the_next_question_once_the_learning_text_was_shown()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, true, []));

        session.PoseNextQuestion(TestSessions.CallerOf(session), QuestionCount);

        session.Quiz.CurrentQuestionIndex.ShouldBe(1);
        session.Quiz.IsRevealed.ShouldBeFalse();
        session.Quiz.IsLearningTextShown.ShouldBeFalse();
    }

    [Fact]
    public void The_next_question_waits_until_the_learning_text_was_shown()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, false, []));

        Should.Throw<WrongPhaseException>(() =>
            session.PoseNextQuestion(TestSessions.CallerOf(session), QuestionCount)
        );

        session.Quiz.CurrentQuestionIndex.ShouldBe(0);
        session.Quiz.IsRevealed.ShouldBeTrue();
    }

    [Fact]
    public void No_question_can_be_posed_beyond_the_last_one()
    {
        var session = QuizSession(QuizProgress.Restore(QuestionCount - 1, true, true, []));

        Should.Throw<WrongPhaseException>(() =>
            session.PoseNextQuestion(TestSessions.CallerOf(session), QuestionCount)
        );

        session.Quiz.CurrentQuestionIndex.ShouldBe(QuestionCount - 1);
        session.Quiz.IsLearningTextShown.ShouldBeTrue();
    }

    [Fact]
    public void Only_the_facilitator_poses_the_next_question()
    {
        var session = QuizSession(QuizProgress.Restore(0, true, true, []));

        Should.Throw<NotAuthorizedException>(() =>
            session.PoseNextQuestion(Stranger, QuestionCount)
        );

        session.Quiz.CurrentQuestionIndex.ShouldBe(0);
    }

    private static Session QuizSession(QuizProgress quiz)
    {
        return TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Quiz, quiz);
    }
}
