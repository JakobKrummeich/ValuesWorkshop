using ValuesWorkshop.Application.Ports.Driven;

namespace ValuesWorkshop.TestSupport;

public sealed class TestQuizCatalog(int questionCount) : IQuizCatalog
{
    public const int CorrectAnswerIndex = 1;

    public IReadOnlyList<QuizQuestion> Questions { get; } =
        Enumerable.Range(0, questionCount).Select(QuestionNumbered).ToList();

    private static QuizQuestion QuestionNumbered(int questionIndex)
    {
        return new QuizQuestion(
            new LocalizedText($"Frage {questionIndex}", $"Question {questionIndex}"),
            [
                new QuizAnswer(
                    QuizAnswerKind.Wrong,
                    new LocalizedText($"Falsch {questionIndex}", $"Wrong {questionIndex}")
                ),
                new QuizAnswer(
                    QuizAnswerKind.Correct,
                    new LocalizedText($"Richtig {questionIndex}", $"Right {questionIndex}")
                ),
                new QuizAnswer(
                    QuizAnswerKind.FunnyWrong,
                    new LocalizedText($"Witzig {questionIndex}", $"Funny {questionIndex}")
                ),
            ],
            new LocalizedText($"Lerntext {questionIndex}", $"Learning text {questionIndex}")
        );
    }
}
