namespace ValuesWorkshop.Domain.Tests;

public class QuizProgressTests
{
    private static readonly ParticipantId Anna = new(
        Guid.Parse("00000000-0000-0000-0000-0000000000a1")
    );

    [Fact]
    public void Initially_no_question_is_posed()
    {
        new QuizProgress().CurrentQuestionIndex.ShouldBeNull();
    }

    [Fact]
    public void A_participant_sees_their_own_answer_to_the_current_question()
    {
        var quiz = QuizProgress.Restore(1, false, false, [new CastAnswer(1, Anna, 2)]);

        quiz.AnswerIndexOf(Anna).ShouldBe(2);
    }

    [Fact]
    public void An_answer_to_an_earlier_question_is_not_the_own_answer_of_the_current_one()
    {
        var quiz = QuizProgress.Restore(1, false, false, [new CastAnswer(0, Anna, 2)]);

        quiz.AnswerIndexOf(Anna).ShouldBeNull();
    }

    [Fact]
    public void A_participant_who_has_not_answered_yet_has_no_own_answer()
    {
        var quiz = QuizProgress.Restore(1, false, false, []);

        quiz.AnswerIndexOf(Anna).ShouldBeNull();
    }
}
