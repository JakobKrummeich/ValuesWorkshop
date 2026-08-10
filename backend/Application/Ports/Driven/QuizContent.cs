namespace ValuesWorkshop.Application.Ports.Driven;

public sealed record LocalizedText(string German, string English);

public enum QuizAnswerKind
{
    Correct = 1,
    Wrong = 2,
    FunnyWrong = 3,
}

public sealed record QuizAnswer(QuizAnswerKind Kind, LocalizedText Text);

public sealed record QuizQuestion(
    LocalizedText Question,
    IReadOnlyList<QuizAnswer> Answers,
    LocalizedText LearningText
)
{
    public int CorrectAnswerIndex
    {
        get
        {
            for (var answerIndex = 0; answerIndex < Answers.Count; answerIndex++)
            {
                if (Answers[answerIndex].Kind == QuizAnswerKind.Correct)
                {
                    return answerIndex;
                }
            }

            throw new InvalidOperationException("The question has no correct answer.");
        }
    }
}
