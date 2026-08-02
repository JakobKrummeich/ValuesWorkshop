namespace ValuesWorkshop.Domain;

public sealed class QuizProgress
{
    public int? CurrentQuestion { get; private set; }
    public bool IsRevealed { get; private set; }
    public bool IsLearningTextShown { get; private set; }

    public bool IsWalkComplete(int questionCount)
    {
        return CurrentQuestion >= questionCount && IsRevealed && IsLearningTextShown;
    }

    internal static QuizProgress Restore(
        int? currentQuestion,
        bool isRevealed,
        bool isLearningTextShown
    )
    {
        return new QuizProgress
        {
            CurrentQuestion = currentQuestion,
            IsRevealed = isRevealed,
            IsLearningTextShown = isLearningTextShown,
        };
    }
}
