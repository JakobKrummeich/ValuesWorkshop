namespace ValuesWorkshop.Domain;

public sealed class QuizProgress
{
    public int? CurrentQuestionIndex { get; private set; }
    public bool IsRevealed { get; private set; }
    public bool IsLearningTextShown { get; private set; }

    public bool IsWalkComplete(int questionCount)
    {
        return CurrentQuestionIndex >= questionCount - 1 && IsRevealed && IsLearningTextShown;
    }

    internal static QuizProgress Restore(
        int? currentQuestionIndex,
        bool isRevealed,
        bool isLearningTextShown
    )
    {
        return new QuizProgress
        {
            CurrentQuestionIndex = currentQuestionIndex,
            IsRevealed = isRevealed,
            IsLearningTextShown = isLearningTextShown,
        };
    }
}
