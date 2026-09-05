namespace ValuesWorkshop.Domain.Tests;

public class SessionChooseQuizAnswerTests
{
    private static readonly ParticipantId Anna = new(Guid.NewGuid());
    private static readonly ParticipantId Ben = new(Guid.NewGuid());

    [Fact]
    public void A_participant_answers_the_current_question()
    {
        var session = QuizSessionWith(Anna);

        session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 1);

        session.Quiz.CastAnswers.ShouldBe([new CastAnswer(0, Anna, 1)]);
        session.Quiz.AnsweredCount.ShouldBe(1);
        session.Quiz.AnswerTallies.ShouldBe([0, 1, 0]);
    }

    [Fact]
    public void The_tallies_count_every_participant_of_the_current_question()
    {
        var session = QuizSessionWith(Anna, Ben);

        session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 0);
        session.ChooseQuizAnswer(Ben, questionIndex: 0, answerIndex: 2);

        session.Quiz.AnswerTallies.ShouldBe([1, 0, 1]);
        session.Quiz.AnsweredCount.ShouldBe(2);
    }

    [Fact]
    public void Answers_to_an_earlier_question_stay_out_of_the_current_tallies()
    {
        var session = QuizSessionWith(Anna);
        session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 2);
        session.RevealAnswer();
        session.ShowLearningText();
        session.PoseNextQuestion();

        session.Quiz.AnswerTallies.ShouldBe([0, 0, 0]);
        session.Quiz.AnsweredCount.ShouldBe(0);
        session.Quiz.CastAnswers.ShouldBe([new CastAnswer(0, Anna, 2)]);
    }

    [Fact]
    public void A_second_answer_by_the_same_participant_is_refused()
    {
        var session = QuizSessionWith(Anna);
        session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 1);

        Should.Throw<InvariantViolationException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 2)
        );

        session.Quiz.CastAnswers.ShouldBe([new CastAnswer(0, Anna, 1)]);
        session.Quiz.AnswerTallies.ShouldBe([0, 1, 0]);
    }

    [Fact]
    public void An_answer_for_a_question_that_is_not_current_is_refused()
    {
        var session = QuizSessionWith(Anna);

        Should.Throw<WrongPhaseException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 1, answerIndex: 0)
        );

        session.Quiz.CastAnswers.ShouldBeEmpty();
    }

    [Fact]
    public void An_answer_after_the_reveal_is_refused()
    {
        var session = QuizSessionWith(Anna);
        session.RevealAnswer();

        Should.Throw<WrongPhaseException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 0)
        );

        session.Quiz.CastAnswers.ShouldBeEmpty();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(3)]
    public void An_answer_index_outside_the_three_answers_is_refused(int answerIndex)
    {
        var session = QuizSessionWith(Anna);

        Should.Throw<MalformedPayloadException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: answerIndex)
        );

        session.Quiz.CastAnswers.ShouldBeEmpty();
    }

    [Fact]
    public void A_caller_off_the_roster_cannot_answer()
    {
        var session = QuizSessionWith(Anna);

        Should.Throw<NotAuthorizedException>(() =>
            session.ChooseQuizAnswer(Ben, questionIndex: 0, answerIndex: 0)
        );

        session.Quiz.CastAnswers.ShouldBeEmpty();
    }

    [Fact]
    public void Answers_exist_only_during_the_quiz_phase()
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Join);
        session.Join(TestParticipants.Named(Anna, "Anna"), new FixedRandomness(0));

        Should.Throw<WrongPhaseException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 0)
        );
    }

    [Fact]
    public void Answers_stop_once_the_quiz_phase_is_left_behind()
    {
        var session = TestSessions.InPhase(
            new SessionIdentity(Guid.NewGuid()),
            Phase.ValueSelection,
            QuizProgress.Restore(0, false, false, []),
            roster: [TestParticipants.Named(Anna, "Anna")]
        );

        Should.Throw<WrongPhaseException>(() =>
            session.ChooseQuizAnswer(Anna, questionIndex: 0, answerIndex: 0)
        );

        session.Quiz.CastAnswers.ShouldBeEmpty();
    }

    private static Session QuizSessionWith(params ParticipantId[] participants)
    {
        var session = TestSessions.InPhase(new SessionIdentity(Guid.NewGuid()), Phase.Join);

        foreach (var participant in participants)
        {
            session.Join(TestParticipants.Named(participant, "Anna"), new FixedRandomness(0));
        }

        session.AdvancePhase();

        return session;
    }
}
