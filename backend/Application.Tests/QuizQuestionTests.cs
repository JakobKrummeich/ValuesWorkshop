using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.Application.Tests;

public class QuizQuestionTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void The_correct_answer_index_points_at_the_answer_marked_correct(int correctPosition)
    {
        var question = QuestionWithCorrectAnswerAt(correctPosition);

        question.CorrectAnswerIndex.ShouldBe(correctPosition);
    }

    [Fact]
    public void A_question_without_a_correct_answer_is_refused_rather_than_guessed()
    {
        var question = QuestionWithCorrectAnswerAt(null);

        Should.Throw<InvalidOperationException>(() => question.CorrectAnswerIndex);
    }

    private static QuizQuestion QuestionWithCorrectAnswerAt(int? correctPosition)
    {
        var answers = Enumerable
            .Range(0, 3)
            .Select(position => new QuizAnswer(
                position == correctPosition ? QuizAnswerKind.Correct : QuizAnswerKind.Wrong,
                new LocalizedText($"Antwort {position}", $"Answer {position}")
            ))
            .ToList();

        return new QuizQuestion(
            new LocalizedText("Frage", "Question"),
            answers,
            new LocalizedText("Lerntext", "Learning text")
        );
    }
}
