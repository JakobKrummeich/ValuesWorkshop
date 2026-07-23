namespace ValuesWorkshop.Domain;

public sealed class QuizProgress
{
    public int? CurrentQuestion { get; private set; }
    public bool IsRevealed { get; private set; }
    public bool IsLearningTextShown { get; private set; }

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
